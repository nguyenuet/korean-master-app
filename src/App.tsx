import { useEffect, useState } from 'react';
import { Flame, Zap, Cloud, GraduationCap } from 'lucide-react';
import { UNITS } from './data/curriculum';
import { Dashboard } from './components/Dashboard';
import { UnitView } from './components/UnitView';
import { SyncModal } from './components/SyncModal';
import { AudioSpeedPill } from './components/SpeakButton';
import { useProgress } from './services/progress';
import { AudioService } from './services/audio';

export function App() {
  const [unitId, setUnitId] = useState<string | null>(() => {
    const h = window.location.hash.replace('#', '');
    return UNITS[h] ? h : null;
  });
  const [showSync, setShowSync] = useState(false);
  const { progress, sync } = useProgress();

  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace('#', '');
      setUnitId(UNITS[h] ? h : null);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const openUnit = (id: string | null) => {
    AudioService.stop();
    if (id) window.location.hash = id;
    else history.pushState('', document.title, window.location.pathname);
    setUnitId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const unit = unitId ? UNITS[unitId] : null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sticky header */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <button
            onClick={() => openUnit(null)}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-brand-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="font-extrabold text-base sm:text-lg text-slate-900 leading-none flex items-center gap-1.5">
                <span>Korean Master</span>
                <span className="font-ko text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                  한국어
                </span>
              </div>
              <div className="text-[11px] text-slate-500 hidden sm:block">
                Tiếng Hàn Tổng Hợp • Sejong • SNU
              </div>
            </div>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:block">
              <AudioSpeedPill />
            </div>

            <div
              title="Chuỗi ngày học liên tiếp"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-50 text-orange-700 font-bold text-xs sm:text-sm border border-orange-200/70"
            >
              <Flame className="w-4 h-4 fill-orange-500 text-orange-500" />
              <span>{progress.streak}</span>
            </div>

            <div
              title="Điểm kinh nghiệm (XP)"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 font-bold text-xs sm:text-sm border border-amber-200/70"
            >
              <Zap className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>{progress.xp} XP</span>
            </div>

            <button
              onClick={() => setShowSync(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold border transition ${
                progress.username
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                  : 'bg-brand-600 border-brand-600 text-white hover:bg-brand-700'
              }`}
            >
              <Cloud className={`w-4 h-4 ${sync.status === 'syncing' ? 'animate-bounce' : ''}`} />
              <span className="max-w-[110px] truncate">
                {progress.username ? `@${progress.username}` : 'Đồng bộ'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 sm:py-8">
        {unit ? (
          <UnitView unit={unit} onBack={() => openUnit(null)} />
        ) : (
          <Dashboard onSelectUnit={(id) => openUnit(id)} onOpenSync={() => setShowSync(true)} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-5 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <b>Korean Master</b> – Ứng dụng luyện tiếng Hàn cho người Việt (Tổng hợp • Sejong • SNU)
          </div>
          <div>
            Phát âm Neural TTS thời gian thực (SunHi & InJoon) • Lưu trữ kép LocalStorage + Cloudflare D1
          </div>
        </div>
      </footer>

      {showSync && <SyncModal onClose={() => setShowSync(false)} />}
    </div>
  );
}
