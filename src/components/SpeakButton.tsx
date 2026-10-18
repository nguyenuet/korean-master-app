import { useSyncExternalStore } from 'react';
import { Volume2, Gauge } from 'lucide-react';
import { AudioService, type Speed } from '../services/audio';
import type { Voice } from '../types';

export function useAudioState() {
  return useSyncExternalStore((cb) => AudioService.subscribe(cb), () => AudioService.getState());
}

/** Animated 4-bar waveform shown while audio is playing */
export function SoundWave({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-end gap-0.5 h-3.5 ${className}`} aria-hidden="true">
      <span className="w-0.5 h-full bg-current rounded-full animate-wave" style={{ animationDelay: '0ms' }} />
      <span className="w-0.5 h-full bg-current rounded-full animate-wave" style={{ animationDelay: '180ms' }} />
      <span className="w-0.5 h-full bg-current rounded-full animate-wave" style={{ animationDelay: '360ms' }} />
      <span className="w-0.5 h-full bg-current rounded-full animate-wave" style={{ animationDelay: '120ms' }} />
    </span>
  );
}

interface Props {
  text: string;
  id?: string;
  voice?: Voice;
  speed?: Speed;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showSpeedToggle?: boolean;
  className?: string;
}

export function SpeakButton({
  text,
  id,
  voice = 'female',
  speed,
  label,
  size = 'md',
  showSpeedToggle = false,
  className = '',
}: Props) {
  const state = useAudioState();
  const playId = id ?? `${voice}:${text}`;
  const active = state.playingId === playId;

  const sizes = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3 py-1.5 text-sm gap-2',
    lg: 'px-4 py-2.5 text-base gap-2.5',
  }[size];

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (active) AudioService.stop();
    else void AudioService.play(text, { id: playId, voice, speed });
  };

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        title={`Nghe phát âm (${state.speed}x)`}
        className={`inline-flex items-center font-medium rounded-full transition-all select-none ${sizes} ${
          active
            ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30 ring-2 ring-brand-300'
            : 'bg-brand-50 text-brand-700 hover:bg-brand-100 active:scale-95'
        }`}
      >
        {active ? <SoundWave /> : <Volume2 className={size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />}
        {label && <span>{label}</span>}
      </button>

      {showSpeedToggle && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            AudioService.toggleSpeed();
          }}
          title="Chuyển tốc độ đọc: 1.0x (bình thường) / 0.75x (chậm rõ từng chữ)"
          className={`px-2 py-1 text-xs font-semibold rounded-full border transition ${
            state.speed === 0.75
              ? 'bg-amber-50 border-amber-300 text-amber-800'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          {state.speed === 1 ? '1.0x' : '🐢 0.75x'}
        </button>
      )}
    </span>
  );
}

/** Global speed + engine pill shown in the top bar and unit header */
export function AudioSpeedPill() {
  const state = useAudioState();
  return (
    <div className="inline-flex items-center bg-slate-100 rounded-full p-0.5 text-xs font-semibold">
      <span className="hidden sm:inline-flex items-center gap-1 px-2 text-slate-500">
        <Gauge className="w-3.5 h-3.5" /> Tốc độ:
      </span>
      {([1, 0.75] as Speed[]).map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => AudioService.setSpeed(s)}
          className={`px-2.5 py-1 rounded-full transition ${
            state.speed === s ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {s === 1 ? '1.0x Chuẩn' : '🐢 0.75x Chậm'}
        </button>
      ))}
    </div>
  );
}
