import type { Voice } from '../types';

/**
 * AudioService – real-time Korean pronunciation, no static mp3 files.
 *
 * Engine order:
 *  1. Cloudflare Pages Function `/api/tts` (Edge Neural TTS: SunHi / InJoon, Google fallback)
 *     streamed as audio/mpeg into an HTML5 Audio() element.
 *  2. Browser Web Speech API (window.speechSynthesis, lang ko-KR) – used automatically when
 *     the network API fails, or when the user chooses "Giọng trình duyệt".
 */

export type Speed = 1 | 0.75;
export type Engine = 'api' | 'browser';

interface State {
  playingId: string | null;
  speed: Speed;
  engine: Engine;
  loading: boolean;
}

type Listener = (s: State) => void;

const LS_SPEED = 'km_audio_speed';
const LS_ENGINE = 'km_audio_engine';

class AudioServiceImpl {
  private state: State = {
    playingId: null,
    speed: (Number(localStorage.getItem(LS_SPEED)) === 0.75 ? 0.75 : 1) as Speed,
    engine: (localStorage.getItem(LS_ENGINE) as Engine) || 'api',
    loading: false,
  };
  private listeners = new Set<Listener>();
  private audio: HTMLAudioElement | null = null;
  private token = 0;
  private apiDownUntil = 0;
  private koVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const load = () => {
        this.koVoices = window.speechSynthesis
          .getVoices()
          .filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith('ko'));
      };
      load();
      window.speechSynthesis.addEventListener?.('voiceschanged', load);
    }
  }

  getState() {
    return this.state;
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private set(patch: Partial<State>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l(this.state));
  }

  setSpeed(speed: Speed) {
    localStorage.setItem(LS_SPEED, String(speed));
    this.set({ speed });
  }

  toggleSpeed() {
    this.setSpeed(this.state.speed === 1 ? 0.75 : 1);
  }

  setEngine(engine: Engine) {
    localStorage.setItem(LS_ENGINE, engine);
    this.set({ engine });
  }

  stop() {
    this.token++;
    if (this.audio) {
      this.audio.onended = null;
      this.audio.onerror = null;
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    this.set({ playingId: null, loading: false });
  }

  /** Play a single text. Resolves when playback ends (or is stopped). */
  async play(text: string, opts: { id?: string; voice?: Voice; speed?: Speed } = {}): Promise<void> {
    this.stop();
    const myToken = this.token;
    const id = opts.id ?? text;
    this.set({ playingId: id, loading: true });
    try {
      await this.speak(text, opts.voice ?? 'female', opts.speed ?? this.state.speed, myToken);
    } finally {
      if (this.token === myToken) this.set({ playingId: null, loading: false });
    }
  }

  /** Play several lines sequentially (e.g. a whole dialogue). */
  async playSequence(
    items: { text: string; voice: Voice; id: string }[],
    gapMs = 450,
  ): Promise<void> {
    this.stop();
    const myToken = this.token;
    for (const it of items) {
      if (this.token !== myToken) return;
      this.set({ playingId: it.id, loading: true });
      await this.speak(it.text, it.voice, this.state.speed, myToken);
      if (this.token !== myToken) return;
      await new Promise((r) => setTimeout(r, gapMs));
    }
    if (this.token === myToken) this.set({ playingId: null, loading: false });
  }

  private async speak(text: string, voice: Voice, speed: Speed, myToken: number) {
    const useApi = this.state.engine === 'api' && Date.now() > this.apiDownUntil;
    if (useApi) {
      try {
        await this.playApi(text, voice, speed, myToken);
        return;
      } catch (e) {
        if (this.token !== myToken) return;
        console.warn('[AudioService] API TTS failed → Web Speech fallback', e);
        this.apiDownUntil = Date.now() + 60_000;
      }
    }
    await this.playBrowser(text, voice, speed, myToken);
  }

  private playApi(text: string, voice: Voice, speed: Speed, myToken: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `/api/tts?text=${encodeURIComponent(text)}&voice=${voice}&rate=${speed === 1 ? '1.0' : '0.75'}`;
      const a = new Audio();
      a.preload = 'auto';
      this.audio = a;
      let started = false;
      const timeout = setTimeout(() => {
        if (!started) {
          a.pause();
          reject(new Error('TTS timeout'));
        }
      }, 9000);
      a.onplaying = () => {
        started = true;
        clearTimeout(timeout);
        if (this.token === myToken) this.set({ loading: false });
      };
      a.onended = () => {
        clearTimeout(timeout);
        resolve();
      };
      a.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Audio element error'));
      };
      a.src = url;
      a.play().catch((err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  private playBrowser(text: string, voice: Voice, speed: Speed, myToken: number): Promise<void> {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window) || this.token !== myToken) return resolve();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'ko-KR';
      u.rate = speed === 1 ? 0.95 : 0.7;
      const voices = this.koVoices;
      if (voices.length) {
        const preferred =
          voices.find((v) =>
            voice === 'male' ? /injoon|male|남/i.test(v.name) : /sunhi|female|yuna|heami|여/i.test(v.name),
          ) ||
          voices.find((v) => /google/i.test(v.name)) ||
          voices[0];
        u.voice = preferred;
      }
      if (voice === 'male' && !(u.voice && /injoon|male|남/i.test(u.voice.name))) u.pitch = 0.8;
      u.onstart = () => this.token === myToken && this.set({ loading: false });
      u.onend = () => resolve();
      u.onerror = () => resolve();
      window.speechSynthesis.speak(u);
    });
  }
}

export const AudioService = new AudioServiceImpl();
