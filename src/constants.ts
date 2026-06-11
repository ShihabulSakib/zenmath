// ─── Settings limits ─────────────────────────────────────
export const MIN_TOTAL_QUESTIONS = 1;
export const MAX_TOTAL_QUESTIONS = 50;
export const MIN_TIME_LIMIT = 5;
export const MAX_TIME_LIMIT = 60;
export const MIN_DAILY_GOAL = 1;
export const MAX_DAILY_GOAL = 100;
export const MIN_SPRITE_SPEED = 0.5;
export const MAX_SPRITE_SPEED = 2.0;
export const MIN_SPEECH_RATE = 0.5;
export const MAX_SPEECH_RATE = 2.0;
export const MIN_TIME_LIMIT_SLIDER = 6;

// ─── Default settings ────────────────────────────────────
export const DEFAULT_TOTAL_QUESTIONS = 5;
export const DEFAULT_TIME_LIMIT = 20;
export const DEFAULT_DAILY_GOAL = 10;
export const DEFAULT_SPRITE_SPEED = 1.0;
export const DEFAULT_SPEECH_RATE = 1.0;

// ─── Game rules ──────────────────────────────────────────
export const USER_INPUT_MAX_LENGTH = 12;
export const FEEDBACK_DELAY_MS = 800;
export const TIMEOUT_DELAY_MS = 1200;
export const ADAPTIVE_ACCURACY_THRESHOLD = 0.85;

// ─── Difficulty progression ──────────────────────────────
export const DIFFICULTY_ORDER = ['easy', 'medium', 'hard'] as const;
export const MAX_DIGITS = 4;

// ─── Default ranges ──────────────────────────────────────
export const DEFAULT_TABLE_RANGE: [number, number] = [1, 10];
export const DEFAULT_SQUARE_RANGE: [number, number] = [1, 25];
export const DEFAULT_SQRT_RANGE: [number, number] = [1, 35];
export const DEFAULT_FRACTION_DENOM_RANGE: [number, number] = [2, 10];
export const DEFAULT_FRACTION_NUM_RANGE: [number, number] = [1, 9];

// ─── Audio ────────────────────────────────────────────────
export const BASE_SEQUENCE_GAP = 0.08;
export const FADE_TIME = 0.005;

// ─── Maths ────────────────────────────────────────────────
export const SQRT_RANGES: Record<string, [number, number]> = {
    easy: [1, 10],
    medium: [11, 25],
    hard: [26, 35],
};