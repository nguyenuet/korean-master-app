import { useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Trophy,
  Headphones,
  BookOpenCheck,
  Sparkles,
} from 'lucide-react';
import type { Exercise } from '../types';
import { SpeakButton } from './SpeakButton';
import { AudioService } from '../services/audio';
import { progressStore } from '../services/progress';

function shuffle<T>(arr: T[], seed: string): T[] {
  const out = [...arr];
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  for (let i = out.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    const j = Math.abs(h) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function PracticeTab({
  exercises,
  unitId,
  onFinish,
}: {
  exercises: Exercise[];
  unitId: string;
  onFinish?: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [checked, setChecked] = useState<null | boolean>(null);
  const [done, setDone] = useState(false);

  // Per-question transient state
  const [choice, setChoice] = useState<number | null>(null);
  const [orderPicked, setOrderPicked] = useState<number[]>([]);
  const [matchKo, setMatchKo] = useState<number | null>(null);
  const [matched, setMatched] = useState<Record<number, number>>({});
  const [matchWrong, setMatchWrong] = useState(false);

  const ex = exercises[idx];

  const shuffledRight = useMemo(() => {
    if (ex?.type !== 'match') return [];
    return shuffle(
      ex.pairs.map((p, i) => ({ vi: p.vi, orig: i })),
      ex.id,
    );
  }, [ex]);

  const shuffledWords = useMemo(() => {
    if (ex?.type !== 'listen-order') return [];
    return shuffle(
      ex.words.map((w, i) => ({ w, orig: i })),
      ex.id,
    );
  }, [ex]);

  const resetForNext = () => {
    setChecked(null);
    setChoice(null);
    setOrderPicked([]);
    setMatchKo(null);
    setMatched({});
    setMatchWrong(false);
  };

  const awardAndMark = (ok: boolean) => {
    setChecked(ok);
    if (ok) {
      setCorrectCount((c) => c + 1);
      progressStore.addXp(10);
    }
  };

  const checkAnswer = () => {
    if (!ex || checked !== null) return;
    if (ex.type === 'fill' || ex.type === 'reading' || ex.type === 'listen-choice') {
      if (choice === null) return;
      awardAndMark(choice === ex.answer);
      if (ex.type === 'listen-choice') void AudioService.play(ex.audio, { voice: ex.voice });
    } else if (ex.type === 'listen-order') {
      const built = orderPicked.map((i) => shuffledWords[i].w).join(' ');
      awardAndMark(built.trim() === ex.words.join(' ').trim());
      void AudioService.play(ex.audio, { voice: ex.voice });
    }
  };

  const handleMatchClickVi = (origViIdx: number) => {
    if (ex?.type !== 'match' || matchKo === null || checked !== null) return;
    if (matchKo === origViIdx) {
      const next = { ...matched, [matchKo]: origViIdx };
      setMatched(next);
      setMatchKo(null);
      void AudioService.play(ex.pairs[origViIdx].ko);
      if (Object.keys(next).length === ex.pairs.length) {
        awardAndMark(true);
      }
    } else {
      setMatchWrong(true);
      setTimeout(() => setMatchWrong(false), 450);
    }
  };

  const nextQuestion = () => {
    if (idx + 1 >= exercises.length) {
      const score = Math.round((correctCount / exercises.length) * 100);
      progressStore.completeUnit(unitId, score);
      if (score >= 60) {
        progressStore.addXp(25);
        try {
          void confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
        } catch { /* ignore */ }
      }
      setDone(true);
    } else {
      resetForNext();
      setIdx((i) => i + 1);
    }
  };

  const restart = () => {
    resetForNext();
    setIdx(0);
    setCorrectCount(0);
    setDone(false);
  };

  if (done) {
    const score = Math.round((correctCount / exercises.length) * 100);
    const passed = score >= 60;
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center max-w-lg mx-auto shadow-sm animate-pop">
        <div
          className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center mb-4 ${
            passed ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'
          }`}
        >
          <Trophy className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-extrabold text-slate-900">
          {passed ? 'Xuất sắc! Bạn đã hoàn thành bài học 🎉' : 'Cố lên! Hãy thử lại để đạt trên 60% nhé'}
        </h3>
        <p className="text-sm text-slate-600 mt-1">
          Đúng <b>{correctCount}</b> / {exercises.length} câu • Điểm số: <b className="text-brand-600">{score}%</b>
        </p>

        <div className="my-6 p-4 rounded-2xl bg-brand-50 border border-brand-100 inline-flex items-center gap-2 text-sm font-bold text-brand-800">
          <Sparkles className="w-4 h-4" /> +{correctCount * 10 + (passed ? 25 : 0)} XP đã được cộng vào tiến độ!
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={restart}
            className="px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-sm inline-flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Làm lại bài tập
          </button>
          {onFinish && (
            <button
              onClick={onFinish}
              className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm"
            >
              Về trang tổng quan
            </button>
          )}
        </div>
      </div>
    );
  }

  const canCheck =
    (ex.type === 'fill' || ex.type === 'reading' || ex.type === 'listen-choice')
      ? choice !== null
      : ex.type === 'listen-order'
        ? orderPicked.length === ex.words.length
        : false;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1.5">
          <span className="inline-flex items-center gap-1.5">
            {ex.skill === 'listening' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                <Headphones className="w-3.5 h-3.5" /> Kỹ năng Nghe
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-700">
                <BookOpenCheck className="w-3.5 h-3.5" /> Kỹ năng Đọc
              </span>
            )}
          </span>
          <span>
            Câu {idx + 1} / {exercises.length} • Đúng {correctCount}
          </span>
        </div>
        <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 transition-all duration-300"
            style={{ width: `${((idx + (checked !== null ? 1 : 0)) / exercises.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-sm space-y-5">
        <div className="text-sm font-bold text-slate-500">{ex.prompt}</div>

        {/* 1. Fill in the blank */}
        {ex.type === 'fill' && (
          <>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="font-ko text-xl sm:text-2xl font-bold text-slate-900">
                {ex.sentence}
              </div>
              {ex.sentenceVi && <div className="text-xs sm:text-sm text-slate-500 mt-1">{ex.sentenceVi}</div>}
            </div>
            <OptionGrid
              options={ex.options}
              choice={choice}
              answer={ex.answer}
              checked={checked}
              onSelect={setChoice}
            />
          </>
        )}

        {/* 2. Reading comprehension */}
        {ex.type === 'reading' && (
          <>
            <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <p className="font-ko text-base sm:text-lg font-medium text-slate-900 leading-relaxed whitespace-pre-line">
                  {ex.passage}
                </p>
                <SpeakButton text={ex.passage} id={`rd:${ex.id}`} size="sm" />
              </div>
              {checked !== null && ex.passageVi && (
                <p className="text-xs text-slate-600 pt-2 border-t border-amber-200/70">{ex.passageVi}</p>
              )}
            </div>
            <div className="font-bold text-slate-900 text-base">❓ {ex.question}</div>
            <OptionGrid
              options={ex.options}
              choice={choice}
              answer={ex.answer}
              checked={checked}
              onSelect={setChoice}
            />
          </>
        )}

        {/* 3. Listen & choose */}
        {ex.type === 'listen-choice' && (
          <>
            <div className="p-6 rounded-2xl bg-gradient-to-br from-brand-50 to-indigo-50 border border-brand-100 flex flex-col items-center text-center gap-3">
              <SpeakButton
                text={ex.audio}
                id={`lc:${ex.id}`}
                voice={ex.voice}
                size="lg"
                label="Bấm để nghe câu tiếng Hàn"
                showSpeedToggle
              />
              {checked !== null && (
                <div className="font-ko text-lg font-bold text-brand-800 mt-1">{ex.audio}</div>
              )}
            </div>
            <OptionGrid
              options={ex.options}
              choice={choice}
              answer={ex.answer}
              checked={checked}
              onSelect={setChoice}
            />
          </>
        )}

        {/* 4. Listen & order words */}
        {ex.type === 'listen-order' && (
          <>
            <div className="p-5 rounded-2xl bg-gradient-to-br from-brand-50 to-indigo-50 border border-brand-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs sm:text-sm text-slate-600">
                Nghĩa gợi ý: <b className="text-slate-900">“{ex.translation}”</b>
              </div>
              <SpeakButton
                text={ex.audio}
                id={`lo:${ex.id}`}
                voice={ex.voice}
                size="md"
                label="Nghe câu"
                showSpeedToggle
              />
            </div>

            {/* Answer tray */}
            <div className="min-h-[64px] p-3.5 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-300 flex flex-wrap items-center gap-2">
              {orderPicked.length === 0 ? (
                <span className="text-xs text-slate-400">Bấm các từ bên dưới theo đúng thứ tự bạn nghe được…</span>
              ) : (
                orderPicked.map((sIdx, pos) => (
                  <button
                    key={pos}
                    disabled={checked !== null}
                    onClick={() => setOrderPicked((arr) => arr.filter((_, i) => i !== pos))}
                    className="font-ko px-3.5 py-2 rounded-xl bg-brand-600 text-white font-bold text-base shadow-sm hover:bg-brand-700 transition"
                  >
                    {shuffledWords[sIdx].w}
                  </button>
                ))
              )}
            </div>

            {/* Word bank */}
            <div className="flex flex-wrap gap-2">
              {shuffledWords.map((item, sIdx) => {
                const used = orderPicked.includes(sIdx);
                return (
                  <button
                    key={sIdx}
                    disabled={used || checked !== null}
                    onClick={() => {
                      void AudioService.play(item.w.replace(/[.?!]/g, ''), { id: `chip:${ex.id}:${sIdx}` });
                      setOrderPicked((arr) => [...arr, sIdx]);
                    }}
                    className={`font-ko px-4 py-2.5 rounded-xl font-bold text-base border transition ${
                      used
                        ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed'
                        : 'bg-white border-slate-200 text-slate-900 hover:border-brand-400 hover:bg-brand-50'
                    }`}
                  >
                    {item.w}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* 5. Match pairs */}
        {ex.type === 'match' && (
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${matchWrong ? 'animate-shake' : ''}`}>
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase text-slate-400 px-1">Tiếng Hàn (Chọn 1 mục)</div>
              {ex.pairs.map((p, i) => {
                const donePair = matched[i] !== undefined;
                const active = matchKo === i;
                return (
                  <button
                    key={i}
                    disabled={donePair}
                    onClick={() => {
                      setMatchKo(i);
                      void AudioService.play(p.ko, { id: `m:${ex.id}:${i}` });
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl border font-ko font-bold text-base transition flex items-center justify-between ${
                      donePair
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : active
                          ? 'bg-brand-600 border-brand-600 text-white shadow-md'
                          : 'bg-white border-slate-200 hover:border-brand-300 text-slate-900'
                    }`}
                  >
                    <span>{p.ko}</span>
                    {donePair && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold uppercase text-slate-400 px-1">Nghĩa tiếng Việt (Chọn cặp tương ứng)</div>
              {shuffledRight.map((r, i) => {
                const donePair = matched[r.orig] !== undefined;
                return (
                  <button
                    key={i}
                    disabled={donePair}
                    onClick={() => handleMatchClickVi(r.orig)}
                    className={`w-full text-left p-3.5 rounded-2xl border text-sm font-semibold transition flex items-center justify-between ${
                      donePair
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-white border-slate-200 hover:border-brand-300 text-slate-800'
                    }`}
                  >
                    <span>{r.vi}</span>
                    {donePair && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Instant feedback */}
        {checked !== null && (
          <div
            className={`p-4 rounded-2xl border flex items-start gap-3 animate-pop ${
              checked ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'
            }`}
          >
            {checked ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="text-sm">
              <div className="font-bold">
                {checked ? 'Chính xác! +10 XP 🎉' : 'Chưa đúng rồi – xem giải thích nhé:'}
              </div>
              {ex.type === 'listen-order' && !checked && (
                <div className="font-ko font-bold text-slate-900 mt-1">
                  Đáp án đúng: {ex.words.join(' ')}
                </div>
              )}
              <div className="text-xs sm:text-sm mt-1 leading-relaxed opacity-90">{ex.explanation}</div>
            </div>
          </div>
        )}

        {/* Action button */}
        <div className="pt-2 flex justify-end">
          {checked === null ? (
            ex.type !== 'match' && (
              <button
                disabled={!canCheck}
                onClick={checkAnswer}
                className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm transition shadow-lg shadow-brand-500/20"
              >
                Kiểm tra đáp án
              </button>
            )
          ) : (
            <button
              onClick={nextQuestion}
              className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm inline-flex items-center gap-2 transition"
            >
              <span>{idx + 1 >= exercises.length ? 'Xem kết quả' : 'Câu tiếp theo'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function OptionGrid({
  options,
  choice,
  answer,
  checked,
  onSelect,
}: {
  options: string[];
  choice: number | null;
  answer: number;
  checked: boolean | null;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {options.map((opt, i) => {
        const selected = choice === i;
        const isAnswer = i === answer;
        let style = 'bg-white border-slate-200 hover:border-brand-300 text-slate-900';
        if (checked === null && selected) {
          style = 'bg-brand-50 border-brand-500 text-brand-900 ring-2 ring-brand-200';
        } else if (checked !== null) {
          if (isAnswer) style = 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-200';
          else if (selected) style = 'bg-rose-50 border-rose-400 text-rose-900';
          else style = 'bg-slate-50 border-slate-200 text-slate-400';
        }
        return (
          <button
            key={i}
            disabled={checked !== null}
            onClick={() => onSelect(i)}
            className={`p-4 rounded-2xl border-2 text-left font-ko font-semibold text-base transition flex items-center justify-between gap-2 ${style}`}
          >
            <span>{opt}</span>
            {checked !== null && isAnswer && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
            {checked !== null && selected && !isAnswer && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}
