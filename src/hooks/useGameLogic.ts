import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { generateFractionQuestion } from '../utils/fractions';
import { speakQuestion, translateMathToText, cancelSpeech } from '../utils/speech';
import { audioSpritePlayer } from '../services/audio';
import { problemToSpriteKeys } from '../utils/mathSpeech';
import { syncProgressToServer } from '../services/notifications';
import {
    randomInRange,
    generateQuestion, generatePercentageQuestion,
    generateSquareRootQuestion, generateApproximationQuestion,
    generateNumberSeriesQuestion, generateRatioQuestion,
    generateChainCalculationQuestion,
    getOperationSymbol, modeToOperation,
} from '../utils/questions';
import {
    MIN_TOTAL_QUESTIONS, MAX_TOTAL_QUESTIONS,
    MIN_TIME_LIMIT, MAX_TIME_LIMIT,
    MIN_DAILY_GOAL, MAX_DAILY_GOAL,
    MIN_SPRITE_SPEED, MAX_SPRITE_SPEED,
    MIN_SPEECH_RATE, MAX_SPEECH_RATE,
    DEFAULT_TOTAL_QUESTIONS, DEFAULT_TIME_LIMIT, DEFAULT_DAILY_GOAL,
    DEFAULT_SPRITE_SPEED, DEFAULT_SPEECH_RATE,
    USER_INPUT_MAX_LENGTH, FEEDBACK_DELAY_MS, TIMEOUT_DELAY_MS,
    ADAPTIVE_ACCURACY_THRESHOLD,
    DIFFICULTY_ORDER, MAX_DIGITS,
    DEFAULT_TABLE_RANGE, DEFAULT_SQUARE_RANGE, DEFAULT_SQRT_RANGE,
    DEFAULT_FRACTION_DENOM_RANGE, DEFAULT_FRACTION_NUM_RANGE,
} from '../constants';

// ─── Types ──────────────────────────────────────────────────
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Operation = '+' | '-' | '*' | '/';
export type GameMode =
    | 'addition'
    | 'subtraction'
    | 'multiplication'
    | 'division'
    | 'mixed'
    | 'multiplication-table'
    | 'factor-finding'
    | 'square'
    | 'fraction'
    | 'percentage'
    | 'square-root'
    | 'approximation'
    | 'number-series'
    | 'ratio'
    | 'chain-calculation';

export type ScreenState =
    | 'menu'
    | 'setup'
    | 'special-menu'
    | 'playing'
    | 'result'
    | 'settings'
    | 'revision'
    | 'stats'
    | 'history';

export interface QuestionResult {
    num1: number;
    num2: number;
    operation: string;
    correctAnswer: number | string;
    userAnswer: number | string | null;
    isCorrect: boolean;
    timeTaken: number;
    timedOut: boolean;
}

export interface GameSettings {
    totalQuestions: number;
    timeLimit: number;
    dailyGoal: number;
    ttsEnabled: boolean;
    audioSpriteEnabled: boolean;
    spriteSpeed: number;
    listenOnlyMode: boolean;
    speechRate: number;
    preferredVoiceURI: string;
    adaptiveDifficulty: boolean;
    showStreak: boolean;
    notificationsEnabled: boolean;
    notificationTimes: string[];
}

export interface GameState {
    screen: ScreenState;
    mode: GameMode;
    difficulty: Difficulty;
    digits: number;
    allowRemainder: boolean;
    mixedOps: boolean[];
    allowNegativeResults: boolean;
    // Playing state
    currentQuestion: number;
    num1: number;
    num2: number;
    currentOperation: string;
    correctAnswer: number;
    userInput: string;
    timeRemaining: number;
    feedback: 'none' | 'correct' | 'incorrect' | 'timeout';
    // Fraction specific
    fractionQuestionDisplay: string;
    fractionCorrectAnswer: string;
    // Results
    results: QuestionResult[];
    score: number;
    // Special mode params
    tableRange: [number, number];
    // Fraction settings
    fractionDenominatorRange: [number, number];
    // Settings
    settings: GameSettings;
}

function loadSettings(): GameSettings {
    try {
        const stored = localStorage.getItem('zenmath-settings');
        if (stored) {
            const parsed = JSON.parse(stored);
            return {
                totalQuestions: Math.min(MAX_TOTAL_QUESTIONS, Math.max(MIN_TOTAL_QUESTIONS, parsed.totalQuestions || DEFAULT_TOTAL_QUESTIONS)),
                timeLimit: Math.min(MAX_TIME_LIMIT, Math.max(MIN_TIME_LIMIT, parsed.timeLimit || DEFAULT_TIME_LIMIT)),
                dailyGoal: Math.min(MAX_DAILY_GOAL, Math.max(MIN_DAILY_GOAL, parsed.dailyGoal || DEFAULT_DAILY_GOAL)),
                ttsEnabled: typeof parsed.ttsEnabled === 'boolean' ? parsed.ttsEnabled : false,
                audioSpriteEnabled: typeof parsed.audioSpriteEnabled === 'boolean' ? parsed.audioSpriteEnabled : false,
                spriteSpeed: Math.min(MAX_SPRITE_SPEED, Math.max(MIN_SPRITE_SPEED, parsed.spriteSpeed || DEFAULT_SPRITE_SPEED)),
                listenOnlyMode: (typeof parsed.ttsEnabled === 'boolean' ? parsed.ttsEnabled : false) ? (typeof parsed.listenOnlyMode === 'boolean' ? parsed.listenOnlyMode : true) : false,
                speechRate: Math.min(MAX_SPEECH_RATE, Math.max(MIN_SPEECH_RATE, parsed.speechRate || DEFAULT_SPEECH_RATE)),
                preferredVoiceURI: parsed.preferredVoiceURI || '',
                adaptiveDifficulty: typeof parsed.adaptiveDifficulty === 'boolean' ? parsed.adaptiveDifficulty : false,
                showStreak: typeof parsed.showStreak === 'boolean' ? parsed.showStreak : true,
                notificationsEnabled: typeof parsed.notificationsEnabled === 'boolean' ? parsed.notificationsEnabled : false,
                notificationTimes: Array.isArray(parsed.notificationTimes) ? parsed.notificationTimes : ['21:00'],
            };
        }
    } catch { /* ignore */ }
    return { totalQuestions: DEFAULT_TOTAL_QUESTIONS, timeLimit: DEFAULT_TIME_LIMIT, dailyGoal: DEFAULT_DAILY_GOAL, ttsEnabled: false, audioSpriteEnabled: false, spriteSpeed: DEFAULT_SPRITE_SPEED, listenOnlyMode: false, speechRate: DEFAULT_SPEECH_RATE, preferredVoiceURI: '', adaptiveDifficulty: false, showStreak: true, notificationsEnabled: false, notificationTimes: ['21:00'] };
}

function saveSettings(settings: GameSettings): GameSettings {
    const validated = {
        ...settings,
        totalQuestions: Math.min(MAX_TOTAL_QUESTIONS, Math.max(MIN_TOTAL_QUESTIONS, settings.totalQuestions)),
        timeLimit: Math.min(MAX_TIME_LIMIT, Math.max(MIN_TIME_LIMIT, settings.timeLimit)),
        dailyGoal: Math.min(MAX_DAILY_GOAL, Math.max(MIN_DAILY_GOAL, settings.dailyGoal)),
        spriteSpeed: Math.min(MAX_SPRITE_SPEED, Math.max(MIN_SPRITE_SPEED, settings.spriteSpeed)),
        speechRate: Math.min(MAX_SPEECH_RATE, Math.max(MIN_SPEECH_RATE, settings.speechRate)),
        listenOnlyMode: settings.ttsEnabled ? settings.listenOnlyMode : false,
    };
    localStorage.setItem('zenmath-settings', JSON.stringify(validated));
    return validated;
}

// ─── Hook ───────────────────────────────────────────────────
export function useGameLogic(onSessionComplete?: (
        mode: string,
        totalQuestions: number,
        correct: number,
        avgTimeMs: number,
        difficulty: string,
        results: QuestionResult[]
    ) => void) {
    const [screen, setScreenInternal] = useState<ScreenState>(() => {
        const hash = window.location.hash.replace('#', '') as ScreenState;
        const validScreens: ScreenState[] = ['menu', 'setup', 'special-menu', 'playing', 'result', 'settings', 'revision', 'stats', 'history'];
        return validScreens.includes(hash) ? hash : 'menu';
    });

    const [currentQuestion, setCurrentQuestion] = useState(0);

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.replace('#', '') as ScreenState;
            const validScreens: ScreenState[] = ['menu', 'setup', 'special-menu', 'playing', 'result', 'settings', 'revision', 'stats', 'history'];
            if (validScreens.includes(hash)) {
                if (hash === 'playing' && currentQuestion === 0) return;
                setScreenInternal(hash);
            } else if (!window.location.hash) {
                setScreenInternal('menu');
            }
        };

        handleHashChange();

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [currentQuestion]);

    const setScreen = useCallback((newScreen: ScreenState) => {
        if (newScreen === 'menu') {
            history.pushState(null, '', window.location.pathname);
            window.dispatchEvent(new HashChangeEvent('hashchange'));
        } else {
            window.location.hash = newScreen;
        }
    }, []);
    const [mode, setMode] = useState<GameMode>('addition');
    const [difficulty, setDifficulty] = useState<Difficulty>('medium');
    const [digits, setDigits] = useState(1);
    const [allowRemainder, setAllowRemainder] = useState(false);
    const [mixedOps, setMixedOps] = useState([true, true, true, true]);
    const [allowNegativeResults, setAllowNegativeResults] = useState(false);
    const [squareRangeType, setSquareRangeType] = useState<'fixed' | 'custom'>('fixed');
    const [customSquareRange, setCustomSquareRange] = useState<[number, number]>(DEFAULT_SQUARE_RANGE);

    const [sqrtRangeType, setSqrtRangeType] = useState<'fixed' | 'custom'>('fixed');
    const [customSqrtRange, setCustomSqrtRange] = useState<[number, number]>(DEFAULT_SQRT_RANGE);

    const [fractionDenominatorRange, setFractionDenominatorRange] = useState<[number, number]>(DEFAULT_FRACTION_DENOM_RANGE);
    const [fractionNumeratorRange, setFractionNumeratorRange] = useState<[number, number]>(DEFAULT_FRACTION_NUM_RANGE);

    const [dailyProgress, setDailyProgress] = useState(0);

    const [num1, setNum1] = useState(0);
    const [num2, setNum2] = useState(0);
    const [currentOperation, setCurrentOperation] = useState('+');
    const [correctAnswer, setCorrectAnswer] = useState(0);
    const [userInput, setUserInput] = useState('');
    const [timeRemaining, setTimeRemaining] = useState(20);
    const [feedback, setFeedback] = useState<'none' | 'correct' | 'incorrect' | 'timeout'>('none');

    // Fraction specific states
    const [fractionQuestionDisplay, setFractionQuestionDisplay] = useState('');
    const [fractionCorrectAnswer, setFractionCorrectAnswer] = useState('');

    const [results, setResults] = useState<QuestionResult[]>([]);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [currentQuestionTimeElapsed, setCurrentQuestionTimeElapsed] = useState(0);

    const [tableRange, setTableRange] = useState<[number, number]>(DEFAULT_TABLE_RANGE);
    const [settings, setSettings] = useState<GameSettings>(loadSettings);
    const [audioSpriteLoaded, setAudioSpriteLoaded] = useState(false);

    // ── Audio Sprite: lazy-load on demand ───────────────────
    const loadAudioSprites = useCallback(async () => {
        if (audioSpriteLoaded || audioSpritePlayer.isLoaded) {
            setAudioSpriteLoaded(true);
            return;
        }
        await audioSpritePlayer.load();
        setAudioSpriteLoaded(audioSpritePlayer.isLoaded);
    }, [audioSpriteLoaded]);

    // ── Daily Progress Persistence ─────────────────────────
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        const stored = localStorage.getItem('zenmath-daily-progress');
        if (stored) {
            const { date, count, bestStreak: savedBest } = JSON.parse(stored);
            if (date === today) {
                setDailyProgress(count);
                if (typeof savedBest === 'number') setBestStreak(savedBest);
            } else {
                setDailyProgress(0);
                setBestStreak(0);
                localStorage.setItem('zenmath-daily-progress', JSON.stringify({ date: today, count: 0, bestStreak: 0 }));
            }
        } else {
            localStorage.setItem('zenmath-daily-progress', JSON.stringify({ date: today, count: 0, bestStreak: 0 }));
        }
    }, []);

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem('zenmath-daily-progress', JSON.stringify({ date: today, count: dailyProgress, bestStreak }));
        syncProgressToServer();
    }, [dailyProgress, bestStreak]);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const questionStartRef = useRef<number>(Date.now());
    const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isProcessingRef = useRef(false);

    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const startTimer = useCallback(() => {
        stopTimer();
        questionStartRef.current = Date.now();
        setTimeRemaining(settings.timeLimit);
        setCurrentQuestionTimeElapsed(0);
        timerRef.current = setInterval(() => {
            const elapsed = Date.now() - questionStartRef.current;
            setCurrentQuestionTimeElapsed(elapsed);
            setTimeRemaining(Math.max(0, settings.timeLimit - Math.floor(elapsed / 1000)));
        }, 200);
    }, [settings.timeLimit, stopTimer]);

    // Handle timeout
    useEffect(() => {
        if (timeRemaining === 0 && screen === 'playing' && feedback === 'none') {
            handleTimeout();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeRemaining, screen, feedback]);

    // Cleanup
    useEffect(() => {
        return () => {
            stopTimer();
            cancelSpeech();
            audioSpritePlayer.stop();
            if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
        };
    }, [stopTimer]);

    // ── Question generation ─────────────────────────────────
    const generateNextQuestion = useCallback((questionIndex: number) => {
        if (mode === 'square') {
            const range = squareRangeType === 'fixed' ? DEFAULT_SQUARE_RANGE : customSquareRange;
            const n = randomInRange(range[0], range[1]);
            setNum1(n);
            setNum2(n);
            setCurrentOperation('²');
            setCorrectAnswer(n * n);
            setFractionQuestionDisplay('');
            setFractionCorrectAnswer('');
        } else if (mode === 'multiplication-table') {
            if (tableRange[0] === tableRange[1]) {
                const n1 = tableRange[0];
                const n2 = randomInRange(1, 12);
                setNum1(n1);
                setNum2(n2);
                setCurrentOperation('×');
                setCorrectAnswer(n1 * n2);
            } else {
                const n1 = randomInRange(tableRange[0], tableRange[1]);
                const n2 = randomInRange(tableRange[0], tableRange[1]);
                setNum1(n1);
                setNum2(n2);
                setCurrentOperation('×');
                setCorrectAnswer(n1 * n2);
            }
            setFractionQuestionDisplay('');
            setFractionCorrectAnswer('');
        } else if (mode === 'factor-finding') {
            if (tableRange[0] === tableRange[1]) {
                const n1 = tableRange[0];
                const n2 = randomInRange(1, 12);
                const product = n1 * n2;
                setNum1(product);
                setNum2(n1);
                setFractionQuestionDisplay(String(product));
                setCorrectAnswer(n2);
                setCurrentOperation('×');
            } else {
                const n1 = randomInRange(tableRange[0], tableRange[1]);
                const n2 = randomInRange(tableRange[0], tableRange[1]);
                const product = n1 * n2;
                setNum1(product);
                setNum2(n1);
                setFractionQuestionDisplay(`${product} = ${n1} × __`);
                setCorrectAnswer(n2);
                setCurrentOperation('×');
            }
            setFractionCorrectAnswer('');
        } else if (mode === 'mixed') {
            const ops: Operation[] = ['+', '-', '*', '/'];
            const enabled = ops.filter((_, i) => mixedOps[i]);
            const op = enabled[Math.floor(Math.random() * enabled.length)];
            const q = generateQuestion(op, digits, difficulty, allowRemainder, allowNegativeResults);
            setNum1(q.num1);
            setNum2(q.num2);
            setCurrentOperation(getOperationSymbol(op));
            setCorrectAnswer(q.answer);
            setFractionQuestionDisplay('');
            setFractionCorrectAnswer('');
        } else if (mode === 'fraction') {
            const { question, answer, type } = generateFractionQuestion(
                fractionNumeratorRange[0], fractionNumeratorRange[1],
                fractionDenominatorRange[0], fractionDenominatorRange[1],
            );
            setNum1(0);
            setNum2(0);
            setCurrentOperation(type === 'fractionToDecimal' ? 'Fraction to Decimal' : 'Decimal to Fraction');
            setCorrectAnswer(0);
            setFractionQuestionDisplay(question);
            setFractionCorrectAnswer(answer);
        } else if (mode === 'percentage') {
            const { question, answer } = generatePercentageQuestion(difficulty);
            setNum1(0);
            setNum2(0);
            setCurrentOperation('%');
            setCorrectAnswer(answer);
            setFractionQuestionDisplay(question);
            setFractionCorrectAnswer('');
        } else if (mode === 'square-root') {
            const range = sqrtRangeType === 'custom' ? customSqrtRange : undefined;
            const { question, answer } = generateSquareRootQuestion(difficulty, range);
            setNum1(0);
            setNum2(0);
            setCurrentOperation('√');
            setCorrectAnswer(answer);
            setFractionQuestionDisplay(question);
            setFractionCorrectAnswer('');
        } else if (mode === 'approximation') {
            const { question, answer } = generateApproximationQuestion(difficulty);
            setNum1(0);
            setNum2(0);
            setCurrentOperation('≈');
            setCorrectAnswer(answer);
            setFractionQuestionDisplay(question);
            setFractionCorrectAnswer('');
        } else if (mode === 'number-series') {
            const { question, answer } = generateNumberSeriesQuestion(difficulty);
            setNum1(0);
            setNum2(0);
            setCurrentOperation('Series');
            setCorrectAnswer(answer);
            setFractionQuestionDisplay(question);
            setFractionCorrectAnswer('');
        } else if (mode === 'ratio') {
            const { question, answer } = generateRatioQuestion(difficulty);
            setNum1(0);
            setNum2(0);
            setCurrentOperation('Ratio');
            setCorrectAnswer(answer);
            setFractionQuestionDisplay(question);
            setFractionCorrectAnswer('');
        } else if (mode === 'chain-calculation') {
            const { question, answer } = generateChainCalculationQuestion(difficulty);
            setNum1(0);
            setNum2(0);
            setCurrentOperation('Chain');
            setCorrectAnswer(answer);
            setFractionQuestionDisplay(question);
            setFractionCorrectAnswer('');
        }
        else {
            const op = modeToOperation(mode);
            const q = generateQuestion(op, digits, difficulty, allowRemainder, allowNegativeResults);
            setNum1(q.num1);
            setNum2(q.num2);
            setCurrentOperation(getOperationSymbol(op));
            setCorrectAnswer(q.answer);
            setFractionQuestionDisplay('');
            setFractionCorrectAnswer('');
        }
        setUserInput('');
        setFeedback('none');
        setCurrentQuestion(questionIndex);
        isProcessingRef.current = false;
    }, [mode, digits, difficulty, allowRemainder, mixedOps, tableRange, fractionNumeratorRange, fractionDenominatorRange, allowNegativeResults, squareRangeType, customSquareRange, sqrtRangeType, customSqrtRange]);

    // ── TTS: Auto-speak on new question ─────────────────────
    const speakCurrentQuestion = useCallback(() => {
        if (!settings.ttsEnabled) return;

        // Prefer Audio Sprite if enabled and loaded
        if (settings.audioSpriteEnabled && audioSpriteLoaded) {
            const keys = problemToSpriteKeys(num1, currentOperation, num2, mode, fractionQuestionDisplay);
            if (keys.length > 0) {
                audioSpritePlayer.playbackRate = settings.spriteSpeed;
                audioSpritePlayer.playSequence(keys);
                return;
            }
            // Fallback to Web Speech if sprite keys couldn't be generated
        }

        // Web Speech API fallback
        const text = translateMathToText(num1, num2, currentOperation, mode, fractionQuestionDisplay);
        speakQuestion(text, settings.speechRate, settings.preferredVoiceURI);
    }, [num1, num2, currentOperation, mode, fractionQuestionDisplay, settings.ttsEnabled, settings.audioSpriteEnabled, settings.spriteSpeed, settings.speechRate, settings.preferredVoiceURI, audioSpriteLoaded]);

    useEffect(() => {
        if (screen === 'playing' && feedback === 'none' && currentQuestion > 0) {
            speakCurrentQuestion();
        }
    }, [currentQuestion, screen]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Game flow ───────────────────────────────────────────
    const startGame = useCallback(() => {
        setResults([]);
        setScore(0);
        setStreak(0);
        setBestStreak(0);
        setCurrentQuestionTimeElapsed(0);
        setScreen('playing');
        generateNextQuestion(1);
        startTimer();
    }, [generateNextQuestion, startTimer, setScreen]);

    const advanceToNext = useCallback(() => {
        const totalQ = settings.totalQuestions;

        if (currentQuestion >= totalQ) {
            stopTimer();

            const finalResults = results;
            const correctCount = finalResults.filter(r => r.isCorrect).length;
            const avgTimeMs = finalResults.length > 0
                ? finalResults.reduce((sum, r) => sum + r.timeTaken * 1000, 0) / finalResults.length
                : 0;

            if (onSessionComplete) {
                onSessionComplete(
                    mode,
                    finalResults.length,
                    correctCount,
                    avgTimeMs,
                    difficulty,
                    finalResults
                );
            }

            // Adaptive difficulty
            if (settings.adaptiveDifficulty && finalResults.length > 0) {
                const accuracy = correctCount / finalResults.length;
                if (accuracy >= ADAPTIVE_ACCURACY_THRESHOLD) {
                    const diffOrder: Difficulty[] = [...DIFFICULTY_ORDER];
                    const currentIdx = diffOrder.indexOf(difficulty);
                    if (currentIdx < 2) {
                        setDifficulty(diffOrder[currentIdx + 1]);
                    } else if (digits < MAX_DIGITS) {
                        setDigits(prev => prev + 1);
                    }
                }
            }

            setDailyProgress(prev => {
                const today = new Date().toISOString().split('T')[0];
                const stored = localStorage.getItem('zenmath-daily-progress');
                let count = prev;
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored);
                        if (parsed.date !== today) count = 0;
                    } catch { /* ignore */ }
                }
                return count + 1;
            });
            setScreen('result');
        } else {
            generateNextQuestion(currentQuestion + 1);
            startTimer();
        }
    }, [currentQuestion, settings.totalQuestions, settings.adaptiveDifficulty, digits, generateNextQuestion, startTimer, stopTimer, setScreen, onSessionComplete, results, mode, difficulty]);

    const advanceToNextRef = useRef(advanceToNext);
    advanceToNextRef.current = advanceToNext;

    const generateNextQuestionRef = useRef(generateNextQuestion);
    generateNextQuestionRef.current = generateNextQuestion;

    const recordResult = useCallback((
        isCorrect: boolean,
        userAns: number | string | null,
        timedOut: boolean,
    ) => {
        const timeTaken = timedOut
            ? settings.timeLimit
            : Math.round((Date.now() - questionStartRef.current) / 1000);
        const result: QuestionResult = {
            num1,
            num2,
            operation: currentOperation,
            correctAnswer: mode === 'fraction' ? fractionCorrectAnswer : correctAnswer,
            userAnswer: mode === 'fraction' ? (userAns !== null ? String(userAns) : null) : userAns,
            isCorrect,
            timeTaken,
            timedOut,
        };
        setResults(prev => [...prev, result]);
        if (isCorrect) {
            setScore(prev => prev + 1);
        }
        return result;
    }, [num1, num2, currentOperation, correctAnswer, settings.timeLimit, mode, fractionCorrectAnswer]);

    const handleSubmit = useCallback(() => {
        if (isProcessingRef.current || feedback !== 'none' || userInput === '') return;
        isProcessingRef.current = true;
        stopTimer();
        audioSpritePlayer.stop();
        cancelSpeech();

        let isCorrect: boolean;
        let userAns: number | string | null = null;

        if (mode === 'fraction') {
            userAns = userInput;
            if (!fractionCorrectAnswer.includes('/')) {
                // Expected answer is decimal (e.g., from fraction to decimal conversion)
                const u = parseFloat(userInput);
                const c = parseFloat(fractionCorrectAnswer);
                isCorrect = !isNaN(u) && Math.abs(u - c) < 0.0001;
            } else {
                // Expected answer is fraction (e.g., from decimal to fraction conversion)
                // Literal string match first
                isCorrect = userInput === fractionCorrectAnswer;

                if (!isCorrect) {
                    // Try numeric comparison (handles unsimplified fractions and decimal inputs)
                    const [cNum, cDen] = fractionCorrectAnswer.split('/').map(Number);
                    const targetVal = cNum / cDen;

                    if (userInput.includes('/')) {
                        const [uNum, uDen] = userInput.split('/').map(Number);
                        if (!isNaN(uNum) && !isNaN(uDen) && uDen !== 0) {
                            isCorrect = Math.abs((uNum / uDen) - targetVal) < 0.0001;
                        }
                    } else {
                        const uVal = parseFloat(userInput);
                        if (!isNaN(uVal)) {
                            isCorrect = Math.abs(uVal - targetVal) < 0.0001;
                        }
                    }
                }
            }
        } else if (mode === 'division' && allowRemainder) {
            const u = parseFloat(userInput);
            isCorrect = !isNaN(u) && Math.abs(u - correctAnswer) < 0.001;
            userAns = u;
        } else {
            userAns = parseInt(userInput, 10);
            isCorrect = userAns === correctAnswer;
        }

        recordResult(isCorrect, userAns, false);
        setFeedback(isCorrect ? 'correct' : 'incorrect');

        // Streak tracking
        if (isCorrect) {
            setStreak(prev => {
                const newStreak = prev + 1;
                setBestStreak(prevBest => Math.max(prevBest, newStreak));
                return newStreak;
            });
        } else {
            setStreak(0);
        }

        feedbackTimeoutRef.current = setTimeout(() => {
            advanceToNextRef.current();
        }, FEEDBACK_DELAY_MS);
    }, [userInput, correctAnswer, feedback, stopTimer, recordResult, mode, fractionCorrectAnswer, allowRemainder]);

    const handleTimeout = useCallback(() => {
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;
        stopTimer();
        audioSpritePlayer.stop();
        cancelSpeech();
        recordResult(false, null, true);
        setFeedback('timeout');
        feedbackTimeoutRef.current = setTimeout(() => {
            advanceToNextRef.current();
        }, TIMEOUT_DELAY_MS);
    }, [stopTimer, recordResult]);

    // ── Input handling ──────────────────────────────────────
    const handleKeyPress = useCallback((key: string) => {
        if (feedback !== 'none') return;
        if (key === 'enter') {
            handleSubmit();
        } else if (key === 'backspace') {
            setUserInput(prev => prev.slice(0, -1));
        } else if (key === '-') {
            if ((mode === 'subtraction' && allowNegativeResults) || mode === 'chain-calculation') {
                setUserInput(prev => {
                    if (prev.startsWith('-')) return prev.slice(1);
                    return '-' + prev;
                });
            }
        } else if (key === '/') {
            setUserInput(prev => {
                if (mode === 'fraction' && !prev.includes('/') && prev.length > 0) {
                    return prev + key;
                }
                return prev;
            });
        } else if (key === '.') {
            setUserInput(prev => {
                if (!prev.includes('.') && !prev.includes('/')) {
                    return prev + key;
                }
                return prev;
            });
        }
        else if (/^\d$/.test(key)) {
            setUserInput(prev => {
                if (prev.length >= USER_INPUT_MAX_LENGTH) return prev;
                return prev + key;
            });
        }
    }, [feedback, handleSubmit, mode, allowNegativeResults]);

    // ── Navigation ──────────────────────────────────────────
    const goToMenu = useCallback(() => {
        stopTimer();
        cancelSpeech();
        audioSpritePlayer.stop();
        if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
        setScreen('menu');
        setFeedback('none');
        setUserInput('');
        isProcessingRef.current = false;
    }, [stopTimer, setScreen]);

    const selectMode = useCallback((m: GameMode) => {
        setMode(m);
        if (m === 'multiplication-table' || m === 'factor-finding') {
            setScreen('special-menu');
        } else {
            setScreen('setup');
        }
    }, [setScreen]);

    const goToSettings = useCallback(() => setScreen('settings'), [setScreen]);
    const goToRevision = useCallback(() => setScreen('revision'), [setScreen]);
    const goToStats = useCallback(() => setScreen('stats'), [setScreen]);
    const goToHistory = useCallback(() => setScreen('history'), [setScreen]);

    const updateSettings = useCallback((newSettings: GameSettings) => {
        const validated = saveSettings(newSettings);
        setSettings(validated);
    }, []);

    const selectTableRange = useCallback((range: [number, number]) => {
        setTableRange(range);
        setResults([]);
        setScore(0);
        setScreen('playing');
        setCurrentQuestion(1);
        setUserInput('');
        setFeedback('none');
        isProcessingRef.current = false;
        // Use ref to ensure we call the latest generateNextQuestion
        // after React 19 commits the setTableRange state update.
        requestAnimationFrame(() => {
            generateNextQuestionRef.current(1);
            startTimer();
        });
    }, [startTimer, setScreen, generateNextQuestion]);

    // ── Computed values ─────────────────────────────────────
    const totalQuestions = settings.totalQuestions;

    const avgTime = useMemo(() =>
        results.length > 0
            ? results.reduce((sum, r) => sum + r.timeTaken, 0) / results.length
            : 0,
    [results]);

    const percentage = useMemo(() =>
        results.length > 0
            ? (score / results.length) * 100
            : 0,
    [score, results.length]);

    return {
        // State
        screen,
        mode,
        difficulty,
        digits,
        allowRemainder,
        allowNegativeResults,
        mixedOps,
        currentQuestion,
        num1,
        num2,
        currentOperation,
        correctAnswer,
        userInput,
        timeRemaining,
        feedback,
        results,
        score,
        totalQuestions,
        avgTime,
        percentage,
        streak,
        bestStreak,
        currentQuestionTimeElapsed,
        settings,
        tableRange,
        dailyGoal: settings.dailyGoal,
        dailyProgress,
        squareRangeType,
        customSquareRange,
        sqrtRangeType,
        customSqrtRange,
        fractionQuestionDisplay,
        fractionCorrectAnswer,
        fractionDenominatorRange,
        fractionNumeratorRange,
        // Actions
        selectMode,
        setDifficulty,
        setDigits,
        setAllowRemainder,
        setAllowNegativeResults,
        setMixedOps,
        setSquareRangeType,
        setCustomSquareRange,
        setSqrtRangeType,
        setCustomSqrtRange,
        setFractionDenominatorRange,
        setFractionNumeratorRange,
        startGame,
        handleKeyPress,
        goToMenu,
        goToSettings,
        goToRevision,
        goToStats,
        goToHistory,
        updateSettings,
        selectTableRange,
        speakCurrentQuestion,
        audioSpriteLoaded,
        loadAudioSprites,
    };
}
