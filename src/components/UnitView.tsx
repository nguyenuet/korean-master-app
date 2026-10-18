import { useState } from 'react';
import { ArrowLeft, BookA, Scale, MessageSquare, Dumbbell, CheckCircle2 } from 'lucide-react';
import type { Unit } from '../types';
import { AudioService } from '../services/audio';
import { AudioSpeedPill } from './SpeakButton';
import { VocabTab } from './VocabTab';
import { GrammarTab } from './GrammarTab';
import { DialogueTab } from './DialogueTab';
import { PracticeTab } from './PracticeTab';
import { useProgress } from '../services/progress';

type Tab = 'vocab' | 'grammar' | 'dialogue' | 'practice';

export function UnitView({ unit, onBack }: { unit: Unit; onBack: () => void }) {
  const [tab, setTab] = useState<Tab>('vocab');
  const { progress } = useProgress();
  const up = progress.units[unit.id];

  const switchTab = (t: Tab) => {
    AudioService.stop();
    setTab(t);
  };

  const tabs: { id: Tab; label: string; count: string; icon: typeof BookA }[] = [
    { id: 'vocab', label: '1. Từ vựng', count: `${unit.vocab.length} từ`, icon: BookA },
    { id: 'grammar', label: '2. Ngữ pháp', count: `${unit.grammar.length} mẫu`, icon: Scale },
    { id: 'dialogue', label: '3. Hội thoại', count: `${unit.dialogue.lines.length} câu`, icon: MessageSquare },
    { id: 'practice', label: '4. Luyện tập', count: `${unit.exercises.length} câu`, icon: Dumbbell },
  ];

  return (
    <div className="space-y-6">
      {/* Unit banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <button
            onClick={() => {
              AudioService.stop();
              onBack();
            }}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-brand-700"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại lộ trình
          </button>
          <AudioSpeedPill />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-brand-50 border border-brand-100 text-3xl flex items-center justify-center shrink-0">
              {unit.emoji}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800">
                  Sơ cấp {unit.level} • Bài {unit.number}
                </span>
                {up?.completed && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Đã hoàn thành ({up.best_score}%)
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                {unit.title}{' '}
                <span className="font-ko font-bold text-brand-600 text-lg sm:text-xl">({unit.titleKo})</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">{unit.description}</p>
            </div>
          </div>
        </div>

        {/* 4 tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5 pt-4 border-t border-slate-100">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => switchTab(t.id)}
                className={`p-3 rounded-2xl text-left transition flex items-center gap-3 border ${
                  active
                    ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-500/20'
                    : 'bg-slate-50/80 hover:bg-slate-100 text-slate-700 border-slate-200/70'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold truncate">{t.label}</div>
                  <div className={`text-[11px] ${active ? 'text-brand-100' : 'text-slate-400'}`}>{t.count}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      {tab === 'vocab' && <VocabTab vocab={unit.vocab} unitId={unit.id} />}
      {tab === 'grammar' && <GrammarTab grammar={unit.grammar} unitId={unit.id} />}
      {tab === 'dialogue' && <DialogueTab dialogue={unit.dialogue} unitId={unit.id} />}
      {tab === 'practice' && <PracticeTab key={unit.id} exercises={unit.exercises} unitId={unit.id} onFinish={onBack} />}
    </div>
  );
}
