import { useState } from 'react';
import {
  Flame,
  Zap,
  Target,
  Cloud,
  CheckCircle2,
  Lock,
  Play,
  BookOpen,
  Award,
  Sparkles,
} from 'lucide-react';
import { LEVELS, UNITS } from '../data/curriculum';
import { addDays, progressStore, todayStr, useProgress, xpLevel } from '../services/progress';

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export function Dashboard({
  onSelectUnit,
  onOpenSync,
}: {
  onSelectUnit: (id: string) => void;
  onOpenSync: () => void;
}) {
  const { progress, sync } = useProgress();
  const [activeLevel, setActiveLevel] = useState(1);
  const lv = xpLevel(progress.xp);

  // Last 7 days calendar
  const today = todayStr();
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, i - 6);
    const d = new Date(date + 'T00:00:00');
    return {
      date,
      label: WEEKDAYS[d.getDay()],
      day: d.getDate(),
      active: progress.activity.includes(date),
      isToday: date === today,
    };
  });

  const goalPct = Math.min(100, Math.round((progress.todayXp / progress.dailyGoal) * 100));
  const authoredIds = Object.keys(UNITS);
  const completedCount = authoredIds.filter((id) => progress.units[id]?.completed).length;

  return (
    <div className="space-y-6">
      {/* Top stats + Gamification row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Streak + Weekly activity */}
        <div className="bg-gradient-to-br from-orange-500 to-rose-600 text-white rounded-3xl p-5 sm:p-6 shadow-lg shadow-orange-500/15 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-orange-100">Chuỗi ngày học</div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl sm:text-5xl font-black">{progress.streak}</span>
                <span className="text-sm font-semibold text-orange-100">ngày liên tiếp 🔥</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Flame className="w-7 h-7" />
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-white/20">
            <div className="text-[11px] font-semibold text-orange-100 mb-2">Lịch hoạt động 7 ngày qua</div>
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {week.map((w) => (
                <div
                  key={w.date}
                  className={`py-1.5 rounded-xl text-xs font-bold transition ${
                    w.active
                      ? 'bg-white text-orange-600 shadow-sm'
                      : w.isToday
                        ? 'bg-white/20 text-white ring-1 ring-white/60'
                        : 'bg-white/10 text-orange-100/80'
                  }`}
                >
                  <div className="text-[10px] opacity-80">{w.label}</div>
                  <div className="mt-0.5">{w.active ? '🔥' : w.day}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* XP + Daily goal */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Điểm kinh nghiệm</div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl sm:text-4xl font-black text-slate-900">{progress.xp}</span>
                <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full">
                  Cấp {lv.level}
                </span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <Zap className="w-6 h-6 fill-current" />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="inline-flex items-center gap-1 text-slate-600">
                  <Target className="w-3.5 h-3.5 text-brand-600" /> Mục tiêu hôm nay
                </span>
                <span className="text-brand-700 font-bold">
                  {progress.todayXp} / {progress.dailyGoal} XP ({goalPct}%)
                </span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 transition-all"
                  style={{ width: `${goalPct}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>Đổi mục tiêu ngày:</span>
              <div className="inline-flex gap-1">
                {[30, 50, 100].map((g) => (
                  <button
                    key={g}
                    onClick={() => progressStore.setDailyGoal(g)}
                    className={`px-2 py-0.5 rounded-md font-semibold ${
                      progress.dailyGoal === g ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {g} XP
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Cloud sync card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Đồng bộ Cloudflare D1</div>
                <div className="text-lg font-extrabold text-slate-900 mt-1">
                  {progress.username ? `Xin chào, @${progress.username}!` : 'Chưa liên kết tài khoản'}
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <Cloud className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              {progress.username
                ? sync.message || 'Tiến độ của bạn được lưu tức thì (0ms) vào máy và tự động đồng bộ lên đám mây.'
                : 'Nhập Tên học viên + Mã PIN 4 số để bảo lưu Streak và điểm số trên mọi thiết bị.'}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
            <div className="text-xs text-slate-500">
              Đã xong <b className="text-slate-900">{completedCount}/{authoredIds.length}</b> bài Sơ cấp 1
            </div>
            <button
              onClick={onOpenSync}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition shadow-sm"
            >
              {progress.username ? 'Quản lý đồng bộ' : 'Đồng bộ ngay'}
            </button>
          </div>
        </div>
      </div>

      {/* Curriculum banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1 rounded-full mb-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Giáo trình chuẩn tổng hợp
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">Lộ trình học tiếng Hàn</h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Hệ thống hóa từ <b>Tiếng Hàn Tổng Hợp dành cho người Việt Nam</b>, <b>Giáo trình Sejong</b> và <b>Giáo trình ĐHQG Seoul (SNU)</b>.
            </p>
          </div>
        </div>

        {/* Level selector */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-6">
          {LEVELS.map((l) => {
            const active = activeLevel === l.id;
            const totalInLevel = l.units.length;
            const doneInLevel = l.units.filter((u) => progress.units[u.id]?.completed).length;
            return (
              <button
                key={l.id}
                onClick={() => setActiveLevel(l.id)}
                className={`p-4 rounded-2xl border text-left transition ${
                  active
                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                    : 'bg-slate-50/70 hover:bg-slate-100 text-slate-800 border-slate-200/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold">{l.name}</span>
                  <span className={`font-ko text-xs font-bold ${active ? 'text-sky-300' : 'text-brand-600'}`}>
                    {l.nameKo}
                  </span>
                </div>
                <div className={`text-[11px] mt-1 ${active ? 'text-slate-300' : 'text-slate-500'}`}>
                  Hoàn thành {doneInLevel}/{totalInLevel} bài
                </div>
              </button>
            );
          })}
        </div>

        {/* Units of selected level */}
        {LEVELS.filter((l) => l.id === activeLevel).map((l) => (
          <div key={l.id} className="space-y-4">
            <div className={`p-4 rounded-2xl bg-gradient-to-r ${l.color} text-white flex flex-wrap items-center justify-between gap-2`}>
              <div>
                <div className="font-extrabold text-base sm:text-lg">
                  {l.name} ({l.nameKo})
                </div>
                <div className="text-xs opacity-90">{l.description}</div>
              </div>
              <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full">{l.units.length} bài học</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {l.units.map((u) => {
                const full = UNITS[u.id];
                const st = progress.units[u.id];
                const isAvailable = !!full;
                return (
                  <div
                    key={u.id}
                    onClick={() => isAvailable && onSelectUnit(u.id)}
                    className={`rounded-2xl p-4 sm:p-5 border transition flex flex-col justify-between gap-4 ${
                      isAvailable
                        ? 'bg-white border-slate-200 hover:border-brand-400 hover:shadow-md cursor-pointer'
                        : 'bg-slate-50/70 border-slate-200/60 opacity-75'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 text-2xl flex items-center justify-center shrink-0">
                        {u.emoji}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
                            Bài {u.number}
                          </span>
                          <span className="font-ko text-xs font-semibold text-slate-400">{u.titleKo}</span>
                          {st?.completed && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> {st.best_score}%
                            </span>
                          )}
                        </div>
                        <h3 className="font-extrabold text-slate-900 text-base sm:text-lg mt-0.5">{u.title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{u.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                      {full ? (
                        <>
                          <div className="flex items-center gap-3 text-slate-500 font-medium">
                            <span className="inline-flex items-center gap-1">
                              <BookOpen className="w-3.5 h-3.5 text-brand-500" /> {full.vocab.length} từ vựng
                            </span>
                            <span>• {full.grammar.length} ngữ pháp</span>
                            <span className="hidden sm:inline">• {full.exercises.length} bài tập</span>
                          </div>
                          <span className="inline-flex items-center gap-1 font-bold text-brand-600">
                            {st?.completed ? (
                              <>
                                <Award className="w-4 h-4" /> Ôn lại
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5 fill-current" /> Học ngay
                              </>
                            )}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-slate-400">Nội dung khung lộ trình – mở sau khi hoàn thành Sơ cấp 1</span>
                          <span className="inline-flex items-center gap-1 text-slate-400 font-semibold">
                            <Lock className="w-3.5 h-3.5" /> Khung chương trình
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
