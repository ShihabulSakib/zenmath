import Keypad from './Keypad';
import type { GameMode } from '../hooks/useGameLogic';
import ProgressBar from './ProgressBar';

interface GameScreenProps {
    num1: number;
    num2: number;
    operation: string;
    userInput: string;
    timeRemaining: number;
    currentQuestion: number;
    totalQuestions: number;
    feedback: 'none' | 'correct' | 'incorrect' | 'timeout';
    correctAnswer: number | string;
    onKey: (key: string) => void;
    onQuit: () => void;
    mode: GameMode;
    fractionQuestionDisplay: string;
    fractionCorrectAnswer: string;
    ttsEnabled: boolean;
    listenOnlyMode: boolean;
    onSpeak: () => void;
    streak: number;
    showStreak: boolean;
    currentQuestionTimeElapsed: number; // ms
}

export default function GameScreen({
    num1,
    num2,
    operation,
    userInput,
    timeRemaining,
    currentQuestion,
    totalQuestions,
    feedback,
    correctAnswer,
    onKey,
    onQuit,
    mode,
    fractionQuestionDisplay,
    fractionCorrectAnswer,
    ttsEnabled,
    listenOnlyMode,
    onSpeak,
    streak,
    showStreak,
    currentQuestionTimeElapsed,
}: GameScreenProps) {
    const isSquareOp = operation === '²';
    const showNegative = operation === '−';
    const showFraction = mode === 'fraction';
    const showNewModes = ['percentage', 'square-root', 'approximation', 'number-series', 'ratio', 'chain-calculation'].includes(mode);
    const isTimeLow = timeRemaining <= 5 && timeRemaining > 0;

    // Format timer as mm:ss
    const min = Math.floor(timeRemaining / 60);
    const sec = timeRemaining % 60;
    const timerStr = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;

    // Feedback styling
    const feedbackClass =
        feedback === 'correct' ? 'flash-correct' :
            feedback === 'incorrect' ? 'flash-incorrect' :
                feedback === 'timeout' ? 'flash-timeout' : '';

    return (
        <div className={`flex flex-col h-full w-full overflow-hidden ${feedbackClass}`}>
            {/* Main area — dark bg */}
            <main className="flex-1 flex flex-col relative bg-surface">
                {/* Header: timer + progress */}
                <header className="w-full pt-6 pb-2 px-6 flex flex-col gap-4 z-10">
                    <div className="w-full flex items-center gap-3">
                        <span className={`text-xs font-mono text-secondary font-medium whitespace-nowrap ${isTimeLow ? 'timer-warning text-incorrect' : ''}`}>
                            {timerStr}
                        </span>
                        <ProgressBar value={currentQuestion - 1} max={totalQuestions} glow={false} />
                    </div>
                    <div className="flex justify-between items-center text-xs font-mono tracking-wider text-muted uppercase">
                        <span>Q {currentQuestion}/{totalQuestions}</span>
                        <div className="flex items-center gap-4">
                            {showStreak && streak > 1 && (
                                <span className="flex items-center gap-1 text-primary font-black">
                                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                                    <span className="text-sm">{streak}</span>
                                </span>
                            )}
                            {currentQuestionTimeElapsed > 0 && (
                                <span className="text-[10px] text-secondary font-mono">
                                    {(currentQuestionTimeElapsed / 1000).toFixed(1)}s
                                </span>
                            )}
                            </div>
                        <div className="flex items-center gap-3">
                            {ttsEnabled && (
                                <button
                                    onClick={onSpeak}
                                    className="flex items-center justify-center p-1 rounded-full active:scale-90 transition-transform"
                                    aria-label="Replay question audio"
                                >
                                    <span className="material-symbols-outlined text-primary" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>volume_up</span>
                                </button>
                            )}
                            <button
                                onClick={onQuit}
                                className="flex items-center gap-1 text-muted"
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                                <span>Quit</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Question display */}
                <section className="flex-1 flex flex-col items-center justify-center p-6 relative">
                    {/* Subtle gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none opacity-30" />

                    <div className="relative z-10 flex flex-col items-center gap-8">
                        {/* Question */}
                        <h1 className="font-mono text-5xl sm:text-6xl font-bold text-main tracking-tight text-center leading-tight">
                            {listenOnlyMode && feedback === 'none' ? (
                                <div className="flex flex-col items-center gap-3">
                                    <span className="material-symbols-outlined text-primary/30" style={{ fontSize: 48, fontVariationSettings: "'FILL' 1" }}>headphones</span>
                                    <span className="text-lg font-medium text-secondary/50 tracking-wide">Listen...</span>
                                </div>
                            ) : showNewModes || mode === 'fraction' ? (
                                <>{fractionQuestionDisplay}</>
                            ) : isSquareOp ? (
                                <>
                                    {num1}<span className="text-primary text-3xl align-super">²</span>
                                </>
                            ) : (
                                <>
                                    {num1} <span className="text-primary">{operation}</span> {num2}
                                </>
                            )}
                        </h1>

                        {/* Answer display */}
                        <div className="flex items-end justify-center h-16 min-w-[120px]">
                            {feedback === 'none' ? (
                                userInput ? (
                                    <span className="font-mono text-4xl text-primary font-medium">
                                        {userInput}
                                    </span>
                                ) : (
                                    <span className="font-mono text-4xl text-primary font-medium animate-pulse">_</span>
                                )
                            ) : feedback === 'correct' ? (
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-correct text-3xl">check_circle</span>
                                    <span className="font-mono text-3xl text-correct font-bold">Correct!</span>
                                </div>
                            ) : feedback === 'timeout' ? (
                                <div className="flex flex-col items-center gap-1">
                                    <span className="material-symbols-outlined text-timeout text-3xl">timer_off</span>
                                    <span className="font-mono text-xl text-timeout">Time's Up</span>
                                    <span className="font-mono text-lg text-muted">Answer: {mode === 'fraction' ? fractionCorrectAnswer : correctAnswer}</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-1">
                                    <span className="material-symbols-outlined text-incorrect text-3xl">cancel</span>
                                    <span className="font-mono text-xl text-incorrect">{userInput}</span>
                                    <span className="font-mono text-lg text-muted">Answer: {mode === 'fraction' ? fractionCorrectAnswer : correctAnswer}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </main>

            {/* Keypad — warm area, takes ~45% */}
            <div className="h-[45%] flex flex-col">
                <Keypad
                    onKey={onKey}
                    disabled={feedback !== 'none'}
                    showNegative={showNegative}
                    showFraction={showFraction}
                />
            </div>
        </div>
    );
}
