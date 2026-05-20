import { useState, useEffect, useCallback, useRef } from 'react';
import { useFractionLogic } from './useFractionLogic'; // Import useFractionLogic
import { speakQuestion, translateMathToText, cancelSpeech } from '../utils/speech';
import { audioSpritePlayer } from '../services/audio';
import { problemToSpriteKeys } from '../utils/mathSpeech';

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
    hapticFeedback: boolean;
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

// ─── Helpers ────────────────────────────────────────────────
function randomInRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateNumber(
    digits: number,
    diff: Difficulty,
    operation: Operation,
    isSecondNum: boolean
): number {
    let min = 1;
    for (let i = 0; i < digits - 1; i++) min *= 10;
    const max = min * 10 - 1;

    let num = randomInRange(min, max);

    if (diff === 'hard') {
        // 75% chance of hard heuristic (cases 0-2), 25% keep random (case 3)
        const choice = Math.floor(Math.random() * 4);
        switch (choice) {
            case 0: // Numbers ending in 9
                num = Math.floor(num / 10) * 10 + 9;
                if (num > max) num = max; // Clamp to max
                break;
            case 1: // Numbers ending in 1
                num = Math.floor(num / 10) * 10 + 1;
                if (num < min) num = min; // Clamp to min
                break;
            case 2: // Near powers of 10 (near min or max boundary)
                if (Math.random() < 0.5) {
                    num = min + randomInRange(0, 2); // Close to min
                } else {
                    num = max - randomInRange(0, 2); // Close to max
                }
                break;
            case 3: // Keep random
                break;
        }
    } else if (diff === 'easy' && operation === '*' && isSecondNum) {
        // Easy multiplication: second number restricted to 2-9
        num = randomInRange(2, 9);
    }

    return num;
}

function generateQuestion(
    operation: Operation,
    digits: number,
    diff: Difficulty,
    allowRemainder: boolean,
    allowNegativeResults: boolean // New parameter
): { num1: number; num2: number; answer: number } {
    let num1 = generateNumber(digits, diff, operation, false);
    let num2 = generateNumber(digits, diff, operation, true);
    let answer: number;

    switch (operation) {
        case '+':
            answer = num1 + num2;
            break;
        case '-':
            if (allowNegativeResults) {
                // Force negative result
                if (num1 >= num2) {
                    [num1, num2] = [num2, num1];
                }
                if (num1 === num2) num2 += 1; // Ensure strictly negative
            } else {
                // Force positive result
                if (num1 < num2) {
                    [num1, num2] = [num2, num1];
                }
            }
            answer = num1 - num2;
            break;
        case '*':
            answer = num1 * num2;
            break;
        case '/':
            if (!allowRemainder) {
                // Clean division: find a divisor
                num1 = generateNumber(digits, diff, operation, false);
                const divDigits = digits > 1 ? Math.floor(digits / 2) : 1;
                let divisor = generateNumber(divDigits, diff, operation, true);
                let attempts = 0;
                while ((num1 % divisor !== 0 || divisor === 1) && attempts < 100) {
                    divisor = generateNumber(divDigits, diff, operation, true);
                    if (divisor > num1 / 2) divisor = num1;
                    attempts++;
                }
                if (num1 % divisor !== 0) {
                    // Fallback: just use num1 as its own divisor to avoid infinite loop
                    divisor = num1;
                }
                num2 = divisor;
                answer = Math.floor(num1 / num2);
            } else {
                answer = Math.floor(num1 / num2);
            }
            break;
        default:
            answer = 0;
    }

    return { num1, num2, answer };
}

function getOperationSymbol(op: Operation): string {
    switch (op) {
        case '+': return '+';
        case '-': return '−';
        case '*': return '×';
        case '/': return '÷';
    }
}

function generatePercentageQuestion(diff: Difficulty): { question: string; display: string; answer: number; type: string } {
    const type = Math.random() < 0.5 ? 'percentOf' : 'whatPercent';
    let num1: number, num2: number, answer: number, display: string;

    if (type === 'percentOf') {
        num1 = randomInRange(1, 20) * 5;
        num2 = randomInRange(10, 50);
        answer = Math.round((num1 * num2) / 100);
        display = `${num1}% of ${num2}`;
    } else {
        num1 = randomInRange(1, 20) * 5;
        num2 = (num1 * randomInRange(2, 20)) / 100;
        num2 = Math.round(num2);
        answer = num1;
        display = `${num2} is what % of ${num2 * (100 / num1)}`;
        if (diff === 'easy') {
            const easyAnswers = [5, 10, 15, 20, 25, 50, 75];
            num1 = easyAnswers[randomInRange(0, easyAnswers.length - 1)];
            num2 = randomInRange(1, 10);
            let baseValue = num2 * 100;
            answer = num1;
            display = `${num1}% of ${num2}`;
            if (num1 === 50) { num2 = randomInRange(2, 20); baseValue = num2 * 2; answer = 50; display = `${answer}% of ${baseValue}`; }
            else if (num1 === 25) { num2 = randomInRange(4, 20); baseValue = num2 * 4; answer = 25; display = `${answer}% of ${baseValue}`; }
            else if (num1 === 75) { num2 = randomInRange(2, 12); baseValue = num2 * 4/3; answer = 75; display = `${answer}% of ${Math.round(baseValue)}`; }
            else if (num1 === 10) { num2 = randomInRange(5, 50); baseValue = num2 * 10; answer = 10; display = `${answer}% of ${baseValue}`; }
        }
    }

    return { question: display, display, answer, type };
}

function generateSquareRootQuestion(diff: Difficulty): { question: string; answer: number } {
    let maxRoot = diff === 'easy' ? 15 : diff === 'medium' ? 25 : 40;
    const root = randomInRange(2, maxRoot);
    const perfect = diff === 'hard' ? Math.random() > 0.7 : Math.random() > 0.5;
    let num: number;

    if (perfect || diff === 'easy') {
        num = root * root;
    } else {
        const offset = randomInRange(-3, 3);
        num = (root + offset) * (root + offset);
        if (num < 1) num = root * root;
    }

    return { question: `√${num}`, answer: root };
}

function generateApproximationQuestion(diff: Difficulty): { question: string; options: number[]; answer: number } {
    const ops: Operation[] = ['+', '-', '*'];
    const op = ops[Math.floor(Math.random() * (diff === 'easy' ? 2 : 3))];
    let num1: number, num2: number, exactAnswer: number;

    const digits1 = diff === 'easy' ? 2 : diff === 'medium' ? 3 : 4;
    const digits2 = diff === 'easy' ? 2 : diff === 'medium' ? 3 : 4;

    num1 = randomInRange(Math.pow(10, digits1 - 1), Math.pow(10, digits1) - 1);
    num2 = randomInRange(Math.pow(10, digits2 - 1), Math.pow(10, digits2) - 1);

    switch (op) {
        case '+': exactAnswer = num1 + num2; break;
        case '-': if (num1 < num2) [num1, num2] = [num2, num1]; exactAnswer = num1 - num2; break;
        default: exactAnswer = num1 * num2;
    }

    const base = Math.round(exactAnswer / 10) * 10;

    const options = [base - 20 + randomInRange(0, 10), base + randomInRange(0, 10), base + 20 + randomInRange(0, 10), base + 40 + randomInRange(0, 10)];
    const shuffled = options.sort(() => Math.random() - 0.5);
    const correctIndex = shuffled.findIndex(o => Math.abs(o - exactAnswer) < 15);
    if (correctIndex === -1) shuffled[0] = base + randomInRange(-10, 10);
    else shuffled[correctIndex] = exactAnswer;

    return { question: `${num1} ${getOperationSymbol(op)} ${num2} ≈ ?`, options: shuffled.slice(0, 4), answer: exactAnswer };
}

function generateNumberSeriesQuestion(diff: Difficulty): { question: string; answer: number } {
    const length = diff === 'easy' ? 5 : 6;
    let start: number, diff2: number;

    const patterns = ['arithmetic', 'geometric', 'square', 'fibonacci'];
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];

    let series: number[] = [];

    switch (pattern) {
        case 'arithmetic':
            start = randomInRange(1, 20);
            diff2 = randomInRange(2, 10);
            for (let i = 0; i < length; i++) series.push(start + i * diff2);
            break;
        case 'geometric':
            start = randomInRange(1, 5);
            diff2 = randomInRange(2, 3);
            for (let i = 0; i < length; i++) {
                const val = start * Math.pow(diff2, i);
                if (val > 1000) { series.push(1); series.push(2); series.push(4); series.push(8); series.push(16); series.push(32); break; }
                series.push(val);
            }
            if (series.length < length) { series = [1, 2, 4, 8, 16, 32].slice(0, length); }
            break;
        case 'square':
            start = randomInRange(1, 5);
            for (let i = 0; i < length; i++) series.push((start + i) * (start + i));
            break;
        case 'fibonacci':
            series = [1, 1, 2, 3, 5, 8, 13, 21];
            series = series.slice(0, length);
            break;
    }

    if (series.length < length) {
        start = randomInRange(1, 10);
        diff2 = randomInRange(2, 5);
        series = Array.from({ length }, (_, i) => start + i * diff2);
    }

    const missingIndex = Math.floor(length / 2);
    const answer = series[missingIndex];
    series[missingIndex] = -1;

    return { question: series.map(n => n === -1 ? '?' : n).join(', '), answer };
}

function generateRatioQuestion(diff: Difficulty): { question: string; answer: number } {
    const type = Math.random() < 0.5 ? 'findRatio' : 'findValue';

    if (type === 'findRatio') {
        const a = randomInRange(2, diff === 'hard' ? 20 : 10);
        const b = randomInRange(2, diff === 'hard' ? 20 : 10);
        const mult = randomInRange(2, 5);
        return { question: `If A:B = ${a}:${b}, then A:${b * mult} = ?`, answer: a * mult };
    } else {
        const ratio = randomInRange(2, diff === 'hard' ? 10 : 5);
        const a = randomInRange(2, 10) * ratio;
        return { question: `In ratio ${ratio}:1, if first number is ${a}, second = ?`, answer: a / ratio };
    }
}

function generateChainCalculationQuestion(diff: Difficulty): { question: string; answer: number } {
    const operations = ['+', '-', '*'];
    const numOps = diff === 'easy' ? 2 : 3;
    const numbers = [randomInRange(2, diff === 'easy' ? 9 : 20)];

    for (let i = 0; i < numOps; i++) {
        numbers.push(randomInRange(2, diff === 'easy' ? 9 : 15));
    }

    let answer = numbers[0];
    let q = `${numbers[0]}`;

    for (let i = 0; i < numOps; i++) {
        const op = operations[randomInRange(0, operations.length - 1)];
        const n = numbers[i + 1];
        q += ` ${getOperationSymbol(op as Operation)} ${n}`;
        switch (op) {
            case '+': answer += n; break;
            case '-': answer -= n; break;
            case '*': answer *= n; break;
        }
    }

    return { question: q, answer: Math.round(answer) };
}

function modeToOperation(mode: GameMode): Operation {
    switch (mode) {
        case 'addition': return '+';
        case 'subtraction': return '-';
        case 'multiplication': return '*';
        case 'division': return '/';
        default: return '+';
    }
}

function loadSettings(): GameSettings {
    try {
        const stored = localStorage.getItem('zenmath-settings');
        if (stored) {
            const parsed = JSON.parse(stored);
            return {
                totalQuestions: Math.min(50, Math.max(1, parsed.totalQuestions || 5)),
                timeLimit: Math.min(60, Math.max(5, parsed.timeLimit || 20)),
                dailyGoal: Math.min(100, Math.max(1, parsed.dailyGoal || 20)),
                ttsEnabled: typeof parsed.ttsEnabled === 'boolean' ? parsed.ttsEnabled : false,
                audioSpriteEnabled: typeof parsed.audioSpriteEnabled === 'boolean' ? parsed.audioSpriteEnabled : false,
                spriteSpeed: Math.min(2.0, Math.max(0.5, parsed.spriteSpeed || 1.0)),
                listenOnlyMode: (typeof parsed.ttsEnabled === 'boolean' ? parsed.ttsEnabled : false) ? (typeof parsed.listenOnlyMode === 'boolean' ? parsed.listenOnlyMode : true) : false,
                speechRate: Math.min(2.0, Math.max(0.5, parsed.speechRate || 1.0)),
                preferredVoiceURI: parsed.preferredVoiceURI || '',
                adaptiveDifficulty: typeof parsed.adaptiveDifficulty === 'boolean' ? parsed.adaptiveDifficulty : false,
                showStreak: typeof parsed.showStreak === 'boolean' ? parsed.showStreak : true,
                hapticFeedback: typeof parsed.hapticFeedback === 'boolean' ? parsed.hapticFeedback : true,
            };
        }
    } catch { /* ignore */ }
    return { totalQuestions: 5, timeLimit: 20, dailyGoal: 5, ttsEnabled: false, audioSpriteEnabled: false, spriteSpeed: 1.0, listenOnlyMode: false, speechRate: 1.0, preferredVoiceURI: '', adaptiveDifficulty: false, showStreak: true, hapticFeedback: true };
}

function saveSettings(settings: GameSettings): GameSettings {
    const validated = {
        ...settings,
        totalQuestions: Math.min(50, Math.max(1, settings.totalQuestions)),
        timeLimit: Math.min(60, Math.max(5, settings.timeLimit)),
        dailyGoal: Math.min(100, Math.max(1, settings.dailyGoal)),
        spriteSpeed: Math.min(2.0, Math.max(0.5, settings.spriteSpeed)),
        speechRate: Math.min(2.0, Math.max(0.5, settings.speechRate)),
        listenOnlyMode: settings.ttsEnabled ? settings.listenOnlyMode : false,
        hapticFeedback: typeof settings.hapticFeedback === 'boolean' ? settings.hapticFeedback : true,
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

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.replace('#', '') as ScreenState;
            const validScreens: ScreenState[] = ['menu', 'setup', 'special-menu', 'playing', 'result', 'settings', 'revision', 'stats', 'history'];
            if (validScreens.includes(hash)) {
                setScreenInternal(hash);
            } else if (!window.location.hash) {
                setScreenInternal('menu');
            }
        };

        handleHashChange();

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const setScreen = useCallback((newScreen: ScreenState) => {
        if (newScreen === 'menu') {
            history.pushState(null, '', window.location.pathname);
            window.dispatchEvent(new HashChangeEvent('hashchange'));
        } else {
            window.location.hash = newScreen;
        }
        setScreenInternal(newScreen);
    }, []);
    const [mode, setMode] = useState<GameMode>('addition');
    const [difficulty, setDifficulty] = useState<Difficulty>('medium');
    const [digits, setDigits] = useState(1);
    const [allowRemainder, setAllowRemainder] = useState(false);
    const [mixedOps, setMixedOps] = useState([true, true, true, true]);
    const [allowNegativeResults, setAllowNegativeResults] = useState(false);
    const [squareRangeType, setSquareRangeType] = useState<'fixed' | 'custom'>('fixed');
    const [customSquareRange, setCustomSquareRange] = useState<[number, number]>([1, 25]);
    const [fractionDenominatorRange, setFractionDenominatorRange] = useState<[number, number]>([2, 10]);
    const [fractionNumeratorRange, setFractionNumeratorRange] = useState<[number, number]>([1, 9]);

    const [dailyProgress, setDailyProgress] = useState(0);

    const fractionLogic = useFractionLogic(fractionNumeratorRange[0], fractionNumeratorRange[1], fractionDenominatorRange[0], fractionDenominatorRange[1]);

    const [currentQuestion, setCurrentQuestion] = useState(0);
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

    const [tableRange, setTableRange] = useState<[number, number]>([1, 10]);
    const [settings, setSettings] = useState<GameSettings>(loadSettings);
    const [audioSpriteLoaded, setAudioSpriteLoaded] = useState(false);

    // ── Audio Sprite Initialization ─────────────────────────
    useEffect(() => {
        audioSpritePlayer.load()
            .then(() => {
                setAudioSpriteLoaded(audioSpritePlayer.isLoaded);
            });
    }, []);

    // ── Daily Progress Persistence ─────────────────────────
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        const stored = localStorage.getItem('zenmath-daily-progress');
        if (stored) {
            const { date, count } = JSON.parse(stored);
            if (date === today) {
                setDailyProgress(count);
            } else {
                setDailyProgress(0);
                localStorage.setItem('zenmath-daily-progress', JSON.stringify({ date: today, count: 0 }));
            }
        } else {
            localStorage.setItem('zenmath-daily-progress', JSON.stringify({ date: today, count: 0 }));
        }
    }, []);

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem('zenmath-daily-progress', JSON.stringify({ date: today, count: dailyProgress }));
    }, [dailyProgress]);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const questionStartRef = useRef<number>(Date.now());
    const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isProcessingRef = useRef(false);

    // ── Timer ───────────────────────────────────────────────
    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const startTimer = useCallback(() => {
        stopTimer();
        setTimeRemaining(settings.timeLimit);
        setCurrentQuestionTimeElapsed(0);
        questionStartRef.current = Date.now();
        timerRef.current = setInterval(() => {
            setCurrentQuestionTimeElapsed(Date.now() - questionStartRef.current);
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
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
            const range = squareRangeType === 'fixed' ? [1, 25] : customSquareRange;
            const n = randomInRange(range[0], range[1]);
            setNum1(n);
            setNum2(n);
            setCurrentOperation('²');
            setCorrectAnswer(n * n);
            setFractionQuestionDisplay('');
            setFractionCorrectAnswer('');
        } else if (mode === 'multiplication-table') {
            let n1 = randomInRange(tableRange[0], tableRange[1]);
            const n2 = randomInRange(tableRange[0], tableRange[1]);
            if (tableRange[0] !== tableRange[1]) {
                while (n1 === n2) n1 = randomInRange(tableRange[0], tableRange[1]);
            }
            setNum1(n1);
            setNum2(n2);
            setCurrentOperation('×');
            setCorrectAnswer(n1 * n2);
            setFractionQuestionDisplay('');
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
            const { question, answer, type } = fractionLogic.generateFractionQuestion();
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
            const { question, answer } = generateSquareRootQuestion(difficulty);
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
    }, [mode, digits, difficulty, allowRemainder, mixedOps, tableRange, fractionLogic, allowNegativeResults, squareRangeType, customSquareRange]);

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
                if (accuracy >= 0.85) {
                    const diffOrder: Difficulty[] = ['easy', 'medium', 'hard'];
                    const currentIdx = diffOrder.indexOf(difficulty);
                    if (currentIdx < 2) {
                        setDifficulty(diffOrder[currentIdx + 1]);
                    } else if (digits < 4) {
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
    }, [currentQuestion, settings.totalQuestions, generateNextQuestion, startTimer, stopTimer, setScreen, onSessionComplete, results, mode, difficulty]);

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
                if (newStreak > bestStreak) setBestStreak(newStreak);
                return newStreak;
            });
        } else {
            setStreak(0);
        }

        feedbackTimeoutRef.current = setTimeout(() => {
            advanceToNext();
        }, 800);
    }, [userInput, correctAnswer, feedback, stopTimer, recordResult, advanceToNext, mode, fractionCorrectAnswer]);

    const handleTimeout = useCallback(() => {
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;
        stopTimer();
        audioSpritePlayer.stop();
        cancelSpeech();
        recordResult(false, null, true);
        setFeedback('timeout');
        feedbackTimeoutRef.current = setTimeout(() => {
            advanceToNext();
        }, 1200);
    }, [stopTimer, recordResult, advanceToNext]);

    // ── Input handling ──────────────────────────────────────
    const handleKeyPress = useCallback((key: string) => {
        if (feedback !== 'none') return;
        if (key === 'enter') {
            handleSubmit();
        } else if (key === 'backspace') {
            setUserInput(prev => prev.slice(0, -1));
        } else if (key === '-') {
            setUserInput(prev => {
                if (prev.startsWith('-')) return prev.slice(1);
                return '-' + prev;
            });
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
                if (prev.length >= 12) return prev;
                return prev + key;
            });
        }
    }, [feedback, handleSubmit, mode]);

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
        if (m === 'multiplication-table') {
            setScreen('special-menu');
        } else if (m === 'square' || m === 'fraction') {
            setScreen('setup');
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
        // For special modes, generate first question inline
        if (mode === 'multiplication-table') {
            let n1 = randomInRange(range[0], range[1]);
            const n2 = randomInRange(range[0], range[1]);
            if (range[0] !== range[1]) {
                while (n1 === n2) n1 = randomInRange(range[0], range[1]);
            }
            setNum1(n1);
            setNum2(n2);
            setCurrentOperation('×');
            setCorrectAnswer(n1 * n2);
        } else if (mode === 'square') {
            const n = randomInRange(range[0], range[1]);
            setNum1(n);
            setNum2(n);
            setCurrentOperation('²');
            setCorrectAnswer(n * n);
        }
        setUserInput('');
        setFeedback('none');
        setCurrentQuestion(1);
        isProcessingRef.current = false;
        startTimer();
    }, [mode, startTimer, setScreen]);

    // ── Computed values ─────────────────────────────────────
    const totalQuestions = settings.totalQuestions;

    const avgTime = results.length > 0
        ? results.reduce((sum, r) => sum + r.timeTaken, 0) / results.length
        : 0;

    const percentage = results.length > 0
        ? (score / results.length) * 100
        : 0;

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
    };
}
