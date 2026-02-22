import { useState, useEffect, useCallback, useRef } from 'react';
import { useFractionLogic } from './useFractionLogic'; // Import useFractionLogic

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
    | 'fraction';

export type ScreenState =
    | 'menu'
    | 'setup'
    | 'special-menu'
    | 'playing'
    | 'result'
    | 'settings';

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
                break;
            case 1: // Numbers ending in 1
                num = Math.floor(num / 10) * 10 + 1;
                break;
            case 2: // Near powers of 10 (near min or max boundary)
                if (Math.random() < 0.5) {
                    num = min - 1 + randomInRange(0, 2); // Close to min
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
            };
        }
    } catch { /* ignore */ }
    return { totalQuestions: 5, timeLimit: 20, dailyGoal: 20 };
}

function saveSettings(settings: GameSettings) {
    localStorage.setItem('zenmath-settings', JSON.stringify(settings));
}

// ─── Hook ───────────────────────────────────────────────────
export function useGameLogic() {
    const [screen, setScreen] = useState<ScreenState>('menu');
    const [mode, setMode] = useState<GameMode>('addition');
    const [difficulty, setDifficulty] = useState<Difficulty>('medium');
    const [digits, setDigits] = useState(1);
    const [allowRemainder, setAllowRemainder] = useState(false);
    const [mixedOps, setMixedOps] = useState([true, true, true, true]);
    const [allowNegativeResults, setAllowNegativeResults] = useState(false);
    const [squareRangeType, setSquareRangeType] = useState<'fixed' | 'custom'>('fixed');
    const [customSquareRange, setCustomSquareRange] = useState<[number, number]>([1, 25]);
    const [fractionDenominatorRange, setFractionDenominatorRange] = useState<[number, number]>([2, 10]);

    const [dailyProgress, setDailyProgress] = useState(0);

    const fractionLogic = useFractionLogic(fractionDenominatorRange[0], fractionDenominatorRange[1]);

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

    const [tableRange, setTableRange] = useState<[number, number]>([1, 10]);
    const [settings, setSettings] = useState<GameSettings>(loadSettings);

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
        questionStartRef.current = Date.now();
        timerRef.current = setInterval(() => {
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
            let n2 = randomInRange(tableRange[0], tableRange[1]);
            while (n1 === n2) n1 = randomInRange(tableRange[0], tableRange[1]);
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
            setNum1(0); // Not used for fraction display directly
            setNum2(0); // Not used for fraction display directly
            setCurrentOperation(type === 'fractionToDecimal' ? 'Fraction to Decimal' : 'Decimal to Fraction');
            setCorrectAnswer(0); // Not used for fraction, string answer
            setFractionQuestionDisplay(question);
            setFractionCorrectAnswer(answer);
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

    // ── Game flow ───────────────────────────────────────────
    const startGame = useCallback(() => {
        setResults([]);
        setScore(0);
        setScreen('playing');
        generateNextQuestion(1);
        startTimer();
    }, [generateNextQuestion, startTimer]);

    const advanceToNext = useCallback(() => {
        const totalQ = (mode === 'multiplication-table')
            ? 10
            : (mode === 'square')
                ? 5
                : settings.totalQuestions;

        if (currentQuestion >= totalQ) {
            stopTimer();
            setScreen('result');
        } else {
            generateNextQuestion(currentQuestion + 1);
            startTimer();
        }
    }, [currentQuestion, mode, settings.totalQuestions, generateNextQuestion, startTimer, stopTimer]);

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
            setDailyProgress(prev => prev + 1);
        }
        return result;
    }, [num1, num2, currentOperation, correctAnswer, settings.timeLimit, mode, fractionCorrectAnswer]);

    const handleSubmit = useCallback(() => {
        if (isProcessingRef.current || feedback !== 'none' || userInput === '') return;
        isProcessingRef.current = true;
        stopTimer();

        let isCorrect: boolean;
        let userAns: number | string | null = null;

        if (mode === 'fraction') {
            userAns = userInput;
            if (!fractionCorrectAnswer.includes('/')) {
                // Decimal answer: normalize both
                const u = parseFloat(userInput);
                const c = parseFloat(fractionCorrectAnswer);
                isCorrect = !isNaN(u) && Math.abs(u - c) < 0.0001;
            } else {
                // Fraction answer: literal string match (expect simplified)
                isCorrect = userInput === fractionCorrectAnswer;
                
                // Optional: handle unsimplified fractions
                if (!isCorrect && userInput.includes('/')) {
                    const [uNum, uDen] = userInput.split('/').map(Number);
                    const [cNum, cDen] = fractionCorrectAnswer.split('/').map(Number);
                    if (!isNaN(uNum) && !isNaN(uDen) && uDen !== 0) {
                        isCorrect = (uNum / uDen) === (cNum / cDen);
                    }
                }
            }
        } else {
            userAns = parseInt(userInput, 10);
            isCorrect = userAns === correctAnswer;
        }

        recordResult(isCorrect, userAns, false);
        setFeedback(isCorrect ? 'correct' : 'incorrect');
        feedbackTimeoutRef.current = setTimeout(() => {
            advanceToNext();
        }, 800);
    }, [userInput, correctAnswer, feedback, stopTimer, recordResult, advanceToNext, mode, fractionCorrectAnswer]);

    const handleTimeout = useCallback(() => {
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;
        stopTimer();
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
        if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
        setScreen('menu');
        setFeedback('none');
        setUserInput('');
        isProcessingRef.current = false;
    }, [stopTimer]);

    const selectMode = useCallback((m: GameMode) => {
        setMode(m);
        if (m === 'multiplication-table') {
            setScreen('special-menu');
        } else if (m === 'square' || m === 'fraction') {
            setScreen('setup');
        } else {
            setScreen('setup');
        }
    }, []);

    const goToSettings = useCallback(() => setScreen('settings'), []);

    const updateSettings = useCallback((newSettings: GameSettings) => {
        setSettings(newSettings);
        saveSettings(newSettings);
    }, []);

    const selectTableRange = useCallback((range: [number, number]) => {
        setTableRange(range);
        setResults([]);
        setScore(0);
        setScreen('playing');
        // For special modes, generate first question inline
        if (mode === 'multiplication-table') {
            let n1 = randomInRange(range[0], range[1]);
            let n2 = randomInRange(range[0], range[1]);
            while (n1 === n2) n1 = randomInRange(range[0], range[1]);
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
    }, [mode, startTimer]);

    // ── Computed values ─────────────────────────────────────
    const totalQuestions = (mode === 'multiplication-table')
        ? 10
        : (mode === 'square')
            ? 5
            : settings.totalQuestions;

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
        settings,
        tableRange,
        dailyGoal: settings.dailyGoal,
        dailyProgress,
        squareRangeType,
        customSquareRange,
        fractionQuestionDisplay,
        fractionCorrectAnswer,
        fractionDenominatorRange,
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
        startGame,
        handleKeyPress,
        goToMenu,
        goToSettings,
        updateSettings,
        selectTableRange,
    };
}
