import Keypad from './Keypad';

interface GameScreenProps {
    num1: number;
    num2: number;
    operation: string;
    userInput: string;
    timeRemaining: number;
    currentQuestion: number;
    totalQuestions: number;
    feedback: 'none' | 'correct' | 'incorrect' | 'timeout';
    correctAnswer: number | string; // Updated to allow string for fractions
    onKey: (key: string) => void;
    onQuit: () => void;
    mode: GameMode;
    fractionQuestionDisplay: string; // New prop
    fractionCorrectAnswer: string; // New prop
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
    mode, // Destructure mode prop
    fractionQuestionDisplay, // Destructure new prop
    fractionCorrectAnswer, // Destructure new prop
}: GameScreenProps) {
    const progress = ((currentQuestion - 1) / totalQuestions) * 100;
    const isSquareOp = operation === '²';
    const showNegative = operation === '−';
    const showFraction = mode === 'fraction'; // Determine showFraction based on mode
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
                        <div className="h-1.5 w-full bg-midnight-border rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary rounded-full transition-all duration-300 ease-linear"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                    <div className="flex justify-between items-center text-xs font-mono tracking-wider text-muted uppercase">
                        <span>Q {currentQuestion}/{totalQuestions}</span>
                        <button
                            onClick={onQuit}
                            className="flex items-center gap-1 text-muted hover:text-incorrect transition-colors"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                            <span>Quit</span>
                        </button>
                    </div>
                </header>

                {/* Question display */}
                <section className="flex-1 flex flex-col items-center justify-center p-6 relative">
                    {/* Subtle gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none opacity-30" />

                    <div className="relative z-10 flex flex-col items-center gap-8">
                        {/* Question */}
                        <h1 className="font-mono text-5xl sm:text-6xl font-bold text-main tracking-tight text-center leading-tight">
                            {mode === 'fraction' ? (
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
                    showFraction={showFraction} // Pass the showFraction prop
                />
            </div>
        </div>
    );
}
