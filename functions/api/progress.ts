/**
 * Cloudflare Pages Function: /api/progress
 *
 * Quick account sync using Username + 4-digit PIN (stored as SHA-256 hash).
 *  - GET  /api/progress            → health check (is D1 bound?)
 *  - POST /api/progress            → { username, pin, data? }
 *        Creates the account if it does not exist, otherwise verifies the PIN,
 *        merges the client's local progress with the cloud copy (never loses data)
 *        and returns the merged state.
 */

interface Env {
  DB: D1Database;
}

interface UnitRow {
  unit_id: string;
  completed: boolean | number;
  best_score: number;
}

interface ClientData {
  streak?: number;
  last_active_date?: string | null;
  xp?: number;
  daily_goal?: number;
  activity?: string[];
  units?: UnitRow[];
}

interface UserRow {
  username: string;
  pin: string;
  streak: number;
  last_active_date: string | null;
  xp: number;
  daily_goal: number;
  activity: string;
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

async function sha256(s: string) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function cleanDates(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.filter((d): d is string => typeof d === 'string' && DATE_RE.test(d));
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  if (!env.DB) return json({ ok: false, error: 'D1 binding "DB" not configured' }, 503);
  try {
    const r = await env.DB.prepare('SELECT COUNT(*) AS n FROM users').first<{ n: number }>();
    return json({ ok: true, users: r?.n ?? 0 });
  } catch (e) {
    return json({ ok: false, error: (e as Error).message }, 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.DB) return json({ error: 'Cơ sở dữ liệu chưa được cấu hình (thiếu binding DB).' }, 503);

  let body: { username?: string; pin?: string; data?: ClientData };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Dữ liệu gửi lên không hợp lệ.' }, 400);
  }

  const username = (body.username || '').trim().toLowerCase();
  const pin = (body.pin || '').trim();
  if (!/^[\p{L}\p{N}_.-]{2,30}$/u.test(username))
    return json({ error: 'Tên học viên phải dài 2–30 ký tự, không chứa khoảng trắng.' }, 400);
  if (!/^\d{4}$/.test(pin)) return json({ error: 'Mã PIN phải gồm đúng 4 chữ số.' }, 400);

  const pinHash = await sha256(`korean-master:${username}:${pin}`);
  const data: ClientData = body.data || {};

  const existing = await env.DB.prepare('SELECT * FROM users WHERE username = ?')
    .bind(username)
    .first<UserRow>();

  if (existing && existing.pin !== pinHash) {
    return json({ error: 'Sai mã PIN cho tên học viên này.' }, 401);
  }

  // ---- Merge user-level stats ----
  const localDate = data.last_active_date && DATE_RE.test(data.last_active_date) ? data.last_active_date : null;
  const localStreak = Math.max(0, Math.floor(Number(data.streak) || 0));
  const localXp = Math.max(0, Math.floor(Number(data.xp) || 0));
  const dailyGoal = Math.min(500, Math.max(10, Math.floor(Number(data.daily_goal) || existing?.daily_goal || 50)));

  let streak = localStreak;
  let lastActive = localDate;
  let xp = localXp;
  let activity = cleanDates(data.activity);

  if (existing) {
    const srvDate = existing.last_active_date;
    if (!localDate || (srvDate && srvDate > localDate)) {
      streak = existing.streak;
      lastActive = srvDate;
    } else if (srvDate === localDate) {
      streak = Math.max(existing.streak, localStreak);
    }
    xp = Math.max(existing.xp, localXp);
    let srvActivity: string[] = [];
    try {
      srvActivity = cleanDates(JSON.parse(existing.activity || '[]'));
    } catch { /* ignore */ }
    activity = [...new Set([...srvActivity, ...activity])];
  }
  activity = activity.sort().slice(-120);

  const stmts: D1PreparedStatement[] = [];
  if (existing) {
    stmts.push(
      env.DB.prepare(
        `UPDATE users SET streak = ?, last_active_date = ?, xp = ?, daily_goal = ?, activity = ?, updated_at = datetime('now')
         WHERE username = ?`,
      ).bind(streak, lastActive, xp, dailyGoal, JSON.stringify(activity), username),
    );
  } else {
    stmts.push(
      env.DB.prepare(
        `INSERT INTO users (username, pin, streak, last_active_date, xp, daily_goal, activity) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).bind(username, pinHash, streak, lastActive, xp, dailyGoal, JSON.stringify(activity)),
    );
  }

  // ---- Merge unit progress (completed = OR, best_score = MAX) ----
  const units = Array.isArray(data.units) ? data.units.slice(0, 500) : [];
  for (const u of units) {
    if (!u || typeof u.unit_id !== 'string' || u.unit_id.length > 40) continue;
    const completed = u.completed ? 1 : 0;
    const score = Math.min(100, Math.max(0, Math.round(Number(u.best_score) || 0)));
    stmts.push(
      env.DB.prepare(
        `INSERT INTO progress (username, unit_id, completed, best_score) VALUES (?, ?, ?, ?)
         ON CONFLICT(username, unit_id) DO UPDATE SET
           completed = MAX(progress.completed, excluded.completed),
           best_score = MAX(progress.best_score, excluded.best_score),
           updated_at = datetime('now')`,
      ).bind(username, u.unit_id, completed, score),
    );
  }

  try {
    await env.DB.batch(stmts);
    const { results } = await env.DB.prepare(
      'SELECT unit_id, completed, best_score FROM progress WHERE username = ?',
    )
      .bind(username)
      .all<{ unit_id: string; completed: number; best_score: number }>();

    return json({
      ok: true,
      created: !existing,
      user: { username, streak, last_active_date: lastActive, xp, daily_goal: dailyGoal, activity },
      units: (results || []).map((r) => ({
        unit_id: r.unit_id,
        completed: !!r.completed,
        best_score: r.best_score,
      })),
      syncedAt: new Date().toISOString(),
    });
  } catch (e) {
    return json({ error: 'Lỗi cơ sở dữ liệu: ' + (e as Error).message }, 500);
  }
};
