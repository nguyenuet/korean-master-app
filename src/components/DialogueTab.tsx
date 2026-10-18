import { useState } from 'react';
import { Play, Square, Eye, EyeOff, MessageCircle } from 'lucide-react';
import type { Dialogue } from '../types';
import { AudioService } from '../services/audio';
import { SpeakButton, SoundWave, useAudioState } from './SpeakButton';

export function DialogueTab({ dialogue, unitId }: { dialogue: Dialogue; unitId: string }) {
  const [showVi, setShowVi] = useState(true);
  const audio = useAudioState();

  const seqIds = dialogue.lines.map((_, i) => `dlg:${unitId}:${i}`);
  const isPlayingAll = audio.playingId !== null && seqIds.includes(audio.playingId);

  const playAll = () => {
    if (isPlayingAll) {
      AudioService.stop();
      return;
    }
    void AudioService.playSequence(
      dialogue.lines.map((l, i) => ({
        text: l.ko,
        voice: dialogue.speakers[l.speaker].gender,
        id: `dlg:${unitId}:${i}`,
      })),
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-300 mb-1">
            <MessageCircle className="w-3.5 h-3.5" /> Hội thoại thực tế
          </div>
          <h3 className="font-bold text-lg sm:text-xl">{dialogue.title}</h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">{dialogue.context}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowVi((s) => !s)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold transition"
          >
            {showVi ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showVi ? 'Ẩn dịch tiếng Việt' : 'Hiện dịch tiếng Việt'}</span>
          </button>

          <button
            onClick={playAll}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition shadow-lg ${
              isPlayingAll ? 'bg-rose-500 hover:bg-rose-600 text-white' : 'bg-brand-500 hover:bg-brand-600 text-white'
            }`}
          >
            {isPlayingAll ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isPlayingAll ? 'Dừng phát' : 'Nghe toàn bộ hội thoại'}</span>
          </button>
        </div>
      </div>

      {/* Speaker legend */}
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-200/70 flex flex-wrap items-center gap-4 text-xs text-slate-600">
        {(['A', 'B'] as const).map((k) => {
          const sp = dialogue.speakers[k];
          return (
            <div key={k} className="inline-flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full font-bold flex items-center justify-center text-white ${
                  k === 'A' ? 'bg-pink-500' : 'bg-brand-600'
                }`}
              >
                {k}
              </span>
              <span className="font-semibold text-slate-800">
                {sp.name} ({sp.nameKo})
              </span>
              <span className="text-slate-400">• Giọng {sp.gender === 'female' ? 'Nữ (SunHi)' : 'Nam (InJoon)'}</span>
            </div>
          );
        })}
      </div>

      {/* Chat bubbles */}
      <div className="p-5 sm:p-6 space-y-4">
        {dialogue.lines.map((line, i) => {
          const isA = line.speaker === 'A';
          const sp = dialogue.speakers[line.speaker];
          const lineId = `dlg:${unitId}:${i}`;
          const active = audio.playingId === lineId;

          return (
            <div key={i} className={`flex items-start gap-3 ${isA ? '' : 'flex-row-reverse'}`}>
              <div
                className={`w-9 h-9 rounded-2xl shrink-0 font-bold text-sm flex items-center justify-center text-white shadow-sm ${
                  isA ? 'bg-pink-500' : 'bg-brand-600'
                }`}
              >
                {sp.name[0]}
              </div>

              <div className={`max-w-[82%] sm:max-w-[75%] ${isA ? '' : 'text-right'}`}>
                <div className={`text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1.5 ${isA ? '' : 'justify-end'}`}>
                  <span>{sp.name}</span>
                  <span className="font-ko text-slate-400">({sp.nameKo})</span>
                  {active && <SoundWave className="text-brand-600" />}
                </div>

                <div
                  className={`inline-block text-left rounded-2xl p-4 border transition ${
                    active
                      ? 'bg-brand-50 border-brand-400 ring-2 ring-brand-200'
                      : isA
                        ? 'bg-slate-50 border-slate-200/80'
                        : 'bg-indigo-50/60 border-indigo-200/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-ko text-base sm:text-lg font-bold text-slate-900 leading-snug">{line.ko}</p>
                    <SpeakButton text={line.ko} id={lineId} voice={sp.gender} size="sm" />
                  </div>
                  {showVi && <p className="text-xs sm:text-sm text-slate-600 mt-1.5">{line.vi}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
