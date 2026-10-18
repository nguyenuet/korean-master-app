import { BookOpen, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { GrammarPoint } from '../types';
import { SpeakButton } from './SpeakButton';

export function GrammarTab({ grammar, unitId }: { grammar: GrammarPoint[]; unitId: string }) {
  return (
    <div className="space-y-6">
      {grammar.map((g, gi) => (
        <div
          key={`${unitId}-g-${gi}`}
          className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden"
        >
          <div className="bg-gradient-to-r from-brand-600 to-indigo-600 text-white p-5 sm:p-6">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider bg-white/15 px-2.5 py-1 rounded-full mb-2">
              <BookOpen className="w-3.5 h-3.5" /> Ngữ pháp {gi + 1}
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-ko text-2xl sm:text-3xl font-extrabold">{g.pattern}</h3>
              <span className="text-sm sm:text-base font-semibold bg-white/20 px-3 py-1 rounded-xl">
                {g.meaning}
              </span>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed">{g.explanation}</p>

            {/* Conjugation / attachment rules */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                📐 Công thức chia (theo Patchim / Nguyên âm)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {g.rules.map((r, ri) => (
                  <div
                    key={ri}
                    className="p-3.5 rounded-2xl bg-brand-50/60 border border-brand-100 flex flex-col justify-between"
                  >
                    <div className="text-xs font-semibold text-slate-600">{r.condition}</div>
                    <div className="font-ko font-bold text-brand-700 text-base my-1">{r.form}</div>
                    <div className="font-ko text-xs text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-brand-100/80">
                      VD: {r.sample}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Examples */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                💬 Ví dụ thực tế (Phong cách giáo trình Seoul & Sejong)
              </h4>
              <div className="space-y-2">
                {g.examples.map((ex, ei) => (
                  <div
                    key={ei}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-ko font-bold text-slate-900 text-base flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{ex.ko}</span>
                      </div>
                      <div className="text-xs sm:text-sm text-slate-600 pl-6 mt-0.5">{ex.vi}</div>
                    </div>
                    <SpeakButton text={ex.ko} id={`g:${unitId}:${gi}:${ei}`} size="sm" showSpeedToggle />
                  </div>
                ))}
              </div>
            </div>

            {/* Common mistakes */}
            {g.mistakes.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" /> Lưu ý lỗi người Việt hay mắc
                </div>
                <ul className="space-y-1 text-xs sm:text-sm text-amber-950 list-disc list-inside">
                  {g.mistakes.map((m, mi) => (
                    <li key={mi}>{m}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
