import { useState } from 'react';
import { Cloud, CheckCircle2, AlertCircle, RefreshCw, LogOut, User, KeyRound, X } from 'lucide-react';
import { progressStore, useProgress } from '../services/progress';

export function SyncModal({ onClose }: { onClose: () => void }) {
  const { progress, sync } = useProgress();
  const [username, setUsername] = useState(progress.username || '');
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    const res = await progressStore.login(username, pin);
    setBusy(false);
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok) setPin('');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Đồng bộ tài khoản nhanh</h3>
              <p className="text-xs text-slate-500">Cloudflare D1 + LocalStorage (0ms)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-600 mb-4 leading-relaxed">
          Chỉ cần nhập <b>Tên học viên</b> và <b>Mã PIN 4 số</b> để lưu hoặc khôi phục chuỗi Streak 🔥 và tiến độ bài học trên mọi thiết bị. Nếu tên chưa tồn tại, hệ thống sẽ tự tạo mới.
        </p>

        {progress.username && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
            <div className="text-sm">
              <div className="font-semibold text-emerald-900">Đang kết nối: @{progress.username}</div>
              <div className="text-xs text-emerald-700">
                {sync.message || (progress.lastSyncedAt ? `Đồng bộ lúc ${new Date(progress.lastSyncedAt).toLocaleTimeString('vi-VN')}` : 'Đã liên kết')}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => void progressStore.syncNow()}
                title="Đồng bộ ngay"
                className="p-2 rounded-xl bg-white text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
              >
                <RefreshCw className={`w-4 h-4 ${sync.status === 'syncing' ? 'animate-spin' : ''}`} />
              </button>
              <button
                type="button"
                onClick={() => progressStore.logout()}
                title="Ngắt kết nối tài khoản trên thiết bị này"
                className="p-2 rounded-xl bg-white text-rose-600 hover:bg-rose-50 border border-rose-200"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Tên học viên (Username)</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="vd: minh_anh"
                minLength={2}
                maxLength={30}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Mã PIN (4 chữ số)</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                required
                type="password"
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm tracking-widest font-mono"
              />
            </div>
          </div>

          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                feedback.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {feedback.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{feedback.text}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={busy || pin.length !== 4 || username.trim().length < 2}
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20"
          >
            {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
            <span>{progress.username ? 'Đồng bộ / Đổi tài khoản' : 'Lưu & Đồng bộ đám mây'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
