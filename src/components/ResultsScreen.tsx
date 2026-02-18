import type { QuestionResult } from '../hooks/useGameLogic';

interface ResultsScreenProps {
    score: number;
    totalQuestions: number;
    percentage: number;
    avgTime: number;
    results: QuestionResult[];
    onPlayAgain: () => void;
    onMenu: () => void;
}

export default function ResultsScreen({
    score,
    totalQuestions,
    percentage,
    avgTime,
    results,
    onPlayAgain,
    onMenu,
}: ResultsScreenProps) {
    const totalTime = results.reduce((sum, r) => sum + r.timeTaken, 0);

    return (
        <div className="flex flex-col min-h-screen animate-fade-in">
            {/* Header */}
            <header className="flex items-center justify-between p-4 pt-6 sticky top-0 z-10 bg-header backdrop-blur-md">
                <button
                    onClick={onMenu}
                    className="flex items-center justify-center p-2 -ml-2 rounded-full hover:bg-primary/10 transition-colors text-secondary"
                >
                    <span className="material-symbols-outlined text-2xl">arrow_back</span>
                </button>
                <h2 className="text-sm uppercase tracking-widest font-semibold text-secondary">Session Results</h2>
                <div className="w-10" />
            </header>

            <main className="flex-1 flex flex-col justify-center items-center px-6 pb-12 w-full max-w-md mx-auto">
                {/* Big score */}
                <div className="flex flex-col items-center mb-12">
                    <span className="text-secondary text-sm font-medium mb-2 uppercase tracking-wide">Accuracy</span>
                    <div className="relative flex items-center justify-center">
                        <h1 className="text-[80px] leading-none font-black tracking-tighter text-main">
                            {score}<span className="text-muted mx-2 text-[60px] font-bold">/</span>{totalQuestions}
                        </h1>
                    </div>
                    <div className="mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold border border-primary/20">
                        <span className="material-symbols-outlined text-base">
                            {percentage >= 80 ? 'check_circle' : percentage >= 50 ? 'info' : 'error'}
                        </span>
                        <span>{Math.round(percentage)}% Correct</span>
                    </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 gap-4 w-full mb-12">
                    <div className="flex flex-col items-center justify-center p-6 bg-stat-card border border-stat rounded-xl">
                        <div className="p-2 mb-3 bg-primary/10 rounded-full text-primary">
                            <span className="material-symbols-outlined">timer</span>
                        </div>
                        <p className="text-secondary text-xs font-semibold uppercase tracking-wider mb-1">Total Time</p>
                        <p className="text-3xl font-bold text-main tracking-tight">{totalTime}s</p>
                    </div>
                    <div className="flex flex-col items-center justify-center p-6 bg-stat-card border border-stat rounded-xl">
                        <div className="p-2 mb-3 bg-primary/10 rounded-full text-primary">
                            <span className="material-symbols-outlined">avg_pace</span>
                        </div>
                        <p className="text-secondary text-xs font-semibold uppercase tracking-wider mb-1">Avg. Time</p>
                        <p className="text-3xl font-bold text-main tracking-tight">{avgTime.toFixed(1)}s</p>
                    </div>
                </div>

                {/* Result bar visualization */}
                <div className="w-full mb-10 flex gap-1.5 h-1.5 rounded-full overflow-hidden bg-midnight-border">
                    {results.map((r, i) => (
                        <div
                            key={i}
                            className={`h-full flex-1 ${r.isCorrect ? 'bg-correct opacity-80' : 'bg-incorrect opacity-60'
                                }`}
                        />
                    ))}
                </div>

                {/* Actions */}
                <div className="flex flex-col w-full gap-4">
                    <button
                        onClick={onPlayAgain}
                        className="w-full flex items-center justify-center gap-2 h-14 bg-primary hover:opacity-90 active:scale-[0.98] text-white text-base font-bold rounded-lg transition-all shadow-lg shadow-primary/20"
                    >
                        <span className="material-symbols-outlined">refresh</span>
                        <span>Retry Session</span>
                    </button>
                    <button
                        onClick={onMenu}
                        className="w-full flex items-center justify-center gap-2 h-14 bg-transparent border border-card text-main hover:bg-primary/5 active:scale-[0.98] text-base font-semibold rounded-lg transition-all"
                    >
                        <span className="material-symbols-outlined">menu</span>
                        <span>Menu</span>
                    </button>
                </div>
            </main>
        </div>
    );
}
