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

            <main className="flex-1 flex flex-col justify-center items-center px-6 pb-12 w-full max-w-sm mx-auto">
                {/* Big score */}
                <div className="flex flex-col items-center mb-10">
                    <span className="text-secondary text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-70">Performance</span>
                    <div className="relative flex items-center justify-center">
                        <h1 className="text-[72px] leading-none font-black tracking-tighter text-main">
                            {score}<span className="text-primary mx-1 text-[50px] font-bold opacity-30">/</span>{totalQuestions}
                        </h1>
                    </div>
                    <div className="mt-4 flex items-center gap-2 px-4 py-1.5 rounded-xl bg-primary/5 text-primary text-[11px] font-black border border-primary/10">
                        <span className="material-symbols-outlined text-sm">
                            {percentage >= 80 ? 'stars' : percentage >= 50 ? 'check_circle' : 'bolt'}
                        </span>
                        <span className="uppercase tracking-widest">{Math.round(percentage)}% Accuracy</span>
                    </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 gap-3 w-full mb-8">
                    <div className="flex flex-col items-center justify-center p-5 bg-card border border-card rounded-2xl shadow-sm relative group overflow-hidden">
                        <div className="p-2 mb-2 bg-primary/10 rounded-xl text-primary z-10">
                            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>timer</span>
                        </div>
                        <p className="text-secondary text-[9px] font-black uppercase tracking-widest mb-0.5 z-10 opacity-60">Total Time</p>
                        <p className="text-2xl font-black text-main tracking-tight z-10">{totalTime}s</p>
                        <div className="absolute -bottom-4 -right-4 size-12 bg-primary/5 rounded-full blur-xl" />
                    </div>
                    <div className="flex flex-col items-center justify-center p-5 bg-card border border-card rounded-2xl shadow-sm relative group overflow-hidden">
                        <div className="p-2 mb-2 bg-primary/10 rounded-xl text-primary z-10">
                            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>avg_pace</span>
                        </div>
                        <p className="text-secondary text-[9px] font-black uppercase tracking-widest mb-0.5 z-10 opacity-60">Avg. Time</p>
                        <p className="text-2xl font-black text-main tracking-tight z-10">{avgTime.toFixed(1)}s</p>
                        <div className="absolute -bottom-4 -right-4 size-12 bg-primary/5 rounded-full blur-xl" />
                    </div>
                </div>

                {/* Result bar visualization */}
                <div className="w-full mb-8 flex gap-1 h-1.5 rounded-full overflow-hidden bg-midnight-border/50">
                    {results.map((r, i) => (
                        <div
                            key={i}
                            className={`h-full flex-1 transition-all duration-500 ${r.isCorrect ? 'bg-correct' : 'bg-incorrect opacity-40'
                                }`}
                        />
                    ))}
                </div>

                {/* Actions */}
                <div className="flex flex-col w-full gap-3">
                    <button
                        onClick={onPlayAgain}
                        className="w-full flex items-center justify-center gap-2 h-14 bg-primary hover:bg-primary/90 active:scale-[0.98] text-white text-base font-black rounded-xl transition-all shadow-lg shadow-primary/30"
                    >
                        <span className="material-symbols-outlined text-xl">refresh</span>
                        <span className="uppercase tracking-widest text-sm">Retry Session</span>
                    </button>
                    <button
                        onClick={onMenu}
                        className="w-full flex items-center justify-center gap-2 h-14 bg-surface border border-card text-main hover:bg-primary/5 active:scale-[0.98] text-base font-bold rounded-xl transition-all"
                    >
                        <span className="material-symbols-outlined text-xl">home</span>
                        <span className="uppercase tracking-widest text-sm">Menu</span>
                    </button>
                </div>
            </main>
        </div>
    );
}
