import { useState } from 'react';
import { Layers, List, RotateCw, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import type { Vocab } from '../types';
import { SpeakButton } from './SpeakButton';
import { AudioService } from '../services/audio';

export function VocabTab({ vocab, unitId }: { vocab: Vocab[]; unitId: string }) {
  const [mode, setMode] = useState<'list' | 'flashcard'>('list');
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = vocab[idx] || vocab[0];
  const go = (delta: number) => {
    setFlipped(false);
    const next = (idx + delta + vocab.length) % vocab.length;
    setIdx(next);
    void AudioService.play(vocab[next].ko, { id: `fc:${vocab[next].ko}` });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="font-bold text-slate-900 text-lg">Từ vựng trọng tâm ({vocab.length} từ)</h3>
          <p className="text-xs text-slate-500">Bấm vào nút loa 🔊 để nghe phát âm chuẩn Seoul, hoặc chuyển sang chế độ Thẻ lật để ôn nhanh.</p>
        </div>
        <div className="inline-flex bg-slate-100 p-1 rounded-2xl text-xs font-semibold">
          <button
            onClick={() => setMode('list')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
              mode === 'list' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600'
            }`}
          >
            <List className="w-3.5 h-3.5" /> Danh sách
          </button>
          <button
            onClick={() => {
              setMode('flashcard');
              setFlipped(false);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
              mode === 'flashcard' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Flashcard
          </button>
        </div>
      </div>

      {mode === 'flashcard' ? (
        <div className="max-w-lg mx-auto my-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 px-1">
            <span>Thẻ {idx + 1} / {vocab.length}</span>
            <span className="inline-flex items-center gap-1 text-brand-600 font-medium">
              <RotateCw className="w-3.5 h-3.5" /> Bấm vào thẻ để lật
            </span>
          </div>

          <div
            onClick={() => setFlipped((f) => !f)}
            className="cursor-pointer select-none rounded-3xl bg-gradient-to-br from-white to-brand-50/50 border-2 border-brand-100 shadow-xl p-8 min-h-[290px] flex flex-col items-center justify-center text-center transition-all hover:border-brand-300"
          >
            {!flipped ? (
              <>
                <span className="text-xs uppercase tracking-wider font-semibold text-brand-600 bg-brand-50 px-3 py-1 rounded-full mb-4">
                  Tiếng Hàn (Hangul)
                </span>
                <div className="font-ko text-4xl sm:text-5xl font-black text-slate-900 mb-3">{card.ko}</div>
                <div className="text-sm text-slate-500 mb-4">[{card.roman}]</div>
                <SpeakButton text={card.ko} id={`fc:${card.ko}`} size="lg" label="Nghe phát âm" showSpeedToggle />
              </>
            ) : (
              <>
                <span className="text-xs uppercase tracking-wider font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full mb-3">
                  Nghĩa tiếng Việt
                </span>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">{card.vi}</div>
                <div className="font-ko text-lg font-semibold text-brand-700 mb-3">
                  {card.ko} <span className="text-xs font-normal text-slate-500">[{card.roman}]</span>
                </div>
                {card.note && (
                  <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full mb-3">
                    💡 {card.note}
                  </div>
                )}
                <div className="w-full mt-2 pt-3 border-t border-slate-200/80 text-sm">
                  <div className="font-ko font-medium text-slate-800 flex items-center justify-center gap-2">
                    <span>{card.example}</span>
                    <SpeakButton text={card.example} id={`fce:${card.ko}`} size="sm" />
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{card.exampleVi}</div>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-between mt-4 gap-3">
            <button
              onClick={() => go(-1)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 font-semibold text-sm inline-flex items-center justify-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Trước
            </button>
            <button
              onClick={() => setFlipped((f) => !f)}
              className="py-2.5 px-5 rounded-xl bg-brand-50 text-brand-700 hover:bg-brand-100 font-semibold text-sm"
            >
              Lật thẻ
            </button>
            <button
              onClick={() => go(1)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-brand-600 text-white hover:bg-brand-700 font-semibold text-sm inline-flex items-center justify-center gap-1"
            >
              Tiếp <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {vocab.map((v, i) => (
            <div
              key={`${unitId}-v-${i}`}
              className="bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-brand-300 hover:shadow-md transition flex flex-col justify-between gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-ko text-2xl font-bold text-slate-900">{v.ko}</span>
                    <span className="text-xs text-slate-400 font-mono">[{v.roman}]</span>
                  </div>
                  <div className="text-base font-semibold text-brand-700 mt-0.5">{v.vi}</div>
                  {v.note && (
                    <div className="inline-flex items-center gap-1 text-xs text-amber-800 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-md mt-1.5">
                      <Sparkles className="w-3 h-3 shrink-0" /> {v.note}
                    </div>
                  )}
                </div>
                <SpeakButton text={v.ko} id={`v:${unitId}:${i}`} size="md" showSpeedToggle />
              </div>

              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 bg-slate-50/70 -mx-4 -mb-4 px-4 py-2.5 rounded-b-2xl">
                <div className="text-xs">
                  <div className="font-ko font-medium text-slate-800">{v.example}</div>
                  <div className="text-slate-500">{v.exampleVi}</div>
                </div>
                <SpeakButton text={v.example} id={`ve:${unitId}:${i}`} size="sm" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
