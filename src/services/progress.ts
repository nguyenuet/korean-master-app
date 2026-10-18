import { useSyncExternalStore } from 'react';
import type { ProgressState, UnitProgress } from '../types';

/**
 * Dual storage:
 *  - localStorage: every change is written instantly (0 ms perceived latency)
 *  - Cloudflare D1 via /api/progress: debounced background sync when the learner
 *    has linked an account (Username + 4-digit PIN).
 */

const LS_KEY = 'km_progress_v1';
const LS_PIN = 'km_pin_v1';

export function todayStr(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return todayStr(dt);
}

const defaultState: ProgressState = {
  username: null,
  pinHash: null,
  streak: 0,
  last_active_date: null,
  xp: 0,
  dailyGoal: 50,
  todayXp: 0,
  todayDate: null,
  activity: [],
  units: {},
  lastSyncedAt: null,
};

export type SyncStatus = 'idle' | 'syncing' | 'ok' | 'error' | 'offline';

interface Store {
  progress: ProgressState;
  sync: { status: SyncStatus; message: string };
}

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { ...defaultState };
    return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    return { ...defaultState };
  }
}

let store: Store = { progress: normalize(load()), sync: { status: 'idle', message: '' } };
const listeners = new Set<() => void>();
let syncTimer: ReturnType<typeof setTimeout> | null = null;

/** Recompute derived values (streak broken? new day?) */
function normalize(p: ProgressState): ProgressState {
  const today = todayStr();
  const next = { ...p };
  if (next.todayDate !== today) {
    next.todayDate = today;
    next.todayXp = 0;
  }
  if (next.last_active_date && next.last_active_date < addDays(today, -1)) {
    next.streak = 0; // streak broken
  }
  return next;
}

function emit() {
  listeners.forEach((l) => l());
}

function setProgress(updater: (p: ProgressState) => ProgressState, autoSync = true) {
  const next = normalize(updater(store.progress));
  store = { ...store, progress: next };
  localStorage.setItem(LS_KEY, JSON.stringify(next));
  emit();
  if (autoSync && next.username) scheduleSync();
}

function setSync(status: SyncStatus, message = '') {
  store = { ...store, sync: { status, message } };
  emit();
}

function scheduleSync() {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    void syncNow();
  }, 1500);
}

function markActive(p: ProgressState): ProgressState {
  const today = todayStr();
  if (p.last_active_date === today) return p;
  const streak = p.last_active_date === addDays(today, -1) ? p.streak + 1 : 1;
  const activity = [...new Set([...p.activity, today])].sort().slice(-120);
  return { ...p, streak, last_active_date: today, activity };
}

// ---------------- Public API ----------------

export const progressStore = {
  get: () => store,

  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },

  addXp(amount: number) {
    setProgress((p) => {
      const base = normalize(p);
      return markActive({ ...base, xp: base.xp + amount, todayXp: base.todayXp + amount });
    });
  },

  completeUnit(unitId: string, score: number) {
    setProgress((p) => {
      const prev: UnitProgress = p.units[unitId] || { unit_id: unitId, completed: false, best_score: 0 };
      const passed = score >= 60;
      return markActive({
        ...p,
        units: {
          ...p.units,
          [unitId]: {
            unit_id: unitId,
            completed: prev.completed || passed,
            best_score: Math.max(prev.best_score, score),
          },
        },
      });
    });
  },

  setDailyGoal(goal: number) {
    setProgress((p) => ({ ...p, dailyGoal: goal }));
  },

  /** Link (or create) a cloud account and merge progress */
  async login(username: string, pin: string): Promise<{ ok: boolean; message: string; created?: boolean }> {
    const r = await callApi(username, pin);
    if (r.ok) {
      localStorage.setItem(LS_PIN, pin);
      return { ok: true, created: r.created, message: r.created ? 'Đã tạo tài khoản mới và lưu tiến độ lên đám mây!' : 'Đã khôi phục & đồng bộ tiến độ thành công!' };
    }
    return { ok: false, message: r.message };
  },

  logout() {
    localStorage.removeItem(LS_PIN);
    setProgress((p) => ({ ...p, username: null, pinHash: null, lastSyncedAt: null }), false);
    setSync('idle');
  },

  /** Reset everything on this device */
  resetLocal() {
    localStorage.removeItem(LS_PIN);
    store = { progress: normalize({ ...defaultState }), sync: { status: 'idle', message: '' } };
    localStorage.setItem(LS_KEY, JSON.stringify(store.progress));
    emit();
  },

  syncNow: () => syncNow(),
};

async function syncNow() {
  const p = store.progress;
  const pin = localStorage.getItem(LS_PIN);
  if (!p.username || !pin) return;
  await callApi(p.username, pin);
}

async function callApi(
  username: string,
  pin: string,
): Promise<{ ok: boolean; message: string; created?: boolean }> {
  if (!navigator.onLine) {
    setSync('offline', 'Đang ngoại tuyến – dữ liệu vẫn được lưu trên máy.');
    return { ok: false, message: 'Bạn đang ngoại tuyến.' };
  }
  setSync('syncing', 'Đang đồng bộ…');
  const p = store.progress;
  try {
    const res = await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        pin,
        data: {
          streak: p.streak,
          last_active_date: p.last_active_date,
          xp: p.xp,
          daily_goal: p.dailyGoal,
          activity: p.activity,
          units: Object.values(p.units),
        },
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = body.error || `Lỗi máy chủ (${res.status})`;
      setSync('error', msg);
      return { ok: false, message: msg };
    }
    const units: Record<string, UnitProgress> = {};
    for (const u of body.units as UnitProgress[]) units[u.unit_id] = u;
    setProgress(
      (cur) => ({
        ...cur,
        username: body.user.username,
        streak: body.user.streak,
        last_active_date: body.user.last_active_date,
        xp: body.user.xp,
        dailyGoal: body.user.daily_goal,
        activity: body.user.activity,
        units: { ...cur.units, ...units },
        lastSyncedAt: body.syncedAt,
      }),
      false,
    );
    setSync('ok', 'Đã đồng bộ với Cloudflare D1');
    return { ok: true, message: 'OK', created: body.created };
  } catch {
    setSync('error', 'Không kết nối được máy chủ – dữ liệu vẫn an toàn trên máy.');
    return { ok: false, message: 'Không kết nối được máy chủ.' };
  }
}

// Sync once at startup & whenever we come back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => void syncNow());
  setTimeout(() => void syncNow(), 800);
}

export function useProgress() {
  return useSyncExternalStore(progressStore.subscribe, progressStore.get);
}

/** Level labels by XP */
export function xpLevel(xp: number) {
  const level = Math.floor(Math.sqrt(xp / 50)) + 1;
  const cur = 50 * (level - 1) ** 2;
  const next = 50 * level ** 2;
  return { level, cur, next, pct: Math.round(((xp - cur) / (next - cur)) * 100) };
}
