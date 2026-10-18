// ===== Curriculum types =====

export type Voice = 'female' | 'male';

export interface Vocab {
  /** Hangul */
  ko: string;
  /** Vietnamese meaning */
  vi: string;
  /** Romanization (Revised Romanization) */
  roman: string;
  /** Pronunciation note / sound change, e.g. "[함니다] – biến âm mũi hóa" */
  note?: string;
  /** Short Korean example sentence */
  example: string;
  /** Vietnamese translation of example */
  exampleVi: string;
}

export interface GrammarRule {
  /** e.g. "Danh từ có patchim" / "Động từ có nguyên âm ㅏ/ㅗ" */
  condition: string;
  /** e.g. "N + 이에요" */
  form: string;
  /** e.g. "학생 → 학생이에요" */
  sample: string;
}

export interface GrammarPoint {
  /** e.g. "N + 입니다 / 입니까?" */
  pattern: string;
  /** Short Vietnamese meaning, e.g. "Là ... (trang trọng)" */
  meaning: string;
  /** Clear Vietnamese explanation (Tiếng Hàn Tổng Hợp style) */
  explanation: string;
  rules: GrammarRule[];
  /** Common mistakes (Vietnamese) */
  mistakes: string[];
  examples: { ko: string; vi: string }[];
}

export interface DialogueLine {
  speaker: 'A' | 'B';
  ko: string;
  vi: string;
}

export interface Dialogue {
  title: string;
  /** Situation description in Vietnamese */
  context: string;
  speakers: {
    A: { name: string; nameKo: string; gender: Voice };
    B: { name: string; nameKo: string; gender: Voice };
  };
  lines: DialogueLine[];
}

interface ExerciseBase {
  id: string;
  /** Vietnamese explanation shown after answering */
  explanation: string;
}

/** Reading: choose word/particle/ending to fill the blank (use "___" in sentence) */
export interface FillBlankExercise extends ExerciseBase {
  type: 'fill';
  skill: 'reading';
  prompt: string;
  sentence: string;
  sentenceVi?: string;
  options: string[];
  answer: number;
}

/** Reading: match Korean sentences/words with Vietnamese meaning */
export interface MatchExercise extends ExerciseBase {
  type: 'match';
  skill: 'reading';
  prompt: string;
  pairs: { ko: string; vi: string }[];
}

/** Reading comprehension: short passage/message (3-5 sentences) + question */
export interface ReadingExercise extends ExerciseBase {
  type: 'reading';
  skill: 'reading';
  prompt: string;
  passage: string;
  passageVi?: string;
  question: string;
  options: string[];
  answer: number;
}

/** Listening: hear word/sentence (via TTS) and choose the correct option */
export interface ListenChoiceExercise extends ExerciseBase {
  type: 'listen-choice';
  skill: 'listening';
  prompt: string;
  audio: string;
  voice?: Voice;
  options: string[];
  answer: number;
}

/** Listening: hear sentence and arrange given word chips in correct order */
export interface ListenOrderExercise extends ExerciseBase {
  type: 'listen-order';
  skill: 'listening';
  prompt: string;
  audio: string;
  voice?: Voice;
  /** Chunks in correct order; joined with a space they must equal `audio` (without final punctuation differences) */
  words: string[];
  translation: string;
}

export type Exercise =
  | FillBlankExercise
  | MatchExercise
  | ReadingExercise
  | ListenChoiceExercise
  | ListenOrderExercise;

export interface Unit {
  id: string; // e.g. "s1-u1"
  level: number; // 1..4
  number: number; // unit number inside level
  title: string; // Vietnamese title
  titleKo: string;
  description: string;
  emoji: string;
  vocab: Vocab[];
  grammar: GrammarPoint[];
  dialogue: Dialogue;
  exercises: Exercise[];
}

export interface UnitOutline {
  id: string;
  level: number;
  number: number;
  title: string;
  titleKo: string;
  description: string;
  emoji: string;
}

export interface Level {
  id: number;
  name: string;
  nameKo: string;
  description: string;
  color: string;
  units: UnitOutline[];
}

// ===== Progress types =====

export interface UnitProgress {
  unit_id: string;
  completed: boolean;
  best_score: number; // 0..100
}

export interface ProgressState {
  username: string | null;
  pinHash: string | null;
  streak: number;
  last_active_date: string | null; // YYYY-MM-DD
  xp: number;
  dailyGoal: number; // XP per day
  todayXp: number;
  todayDate: string | null;
  activity: string[]; // list of YYYY-MM-DD active dates (last ~60)
  units: Record<string, UnitProgress>;
  lastSyncedAt: string | null;
}
