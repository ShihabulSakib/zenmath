import type { Difficulty, GameMode } from '../hooks/useGameLogic';

interface GameSetupProps {
    mode: GameMode;
    digits: number;
    difficulty: Difficulty;
    allowRemainder: boolean;
    mixedOps: boolean[];
    onDigitsChange: (d: number) => void;
    onDifficultyChange: (d: Difficulty) => void;
    onAllowRemainderChange: (v: boolean) => void;
    onMixedOpsChange: (ops: boolean[]) => void;
    onStart: () => void;
    onBack: () => void;
}

const modeLabels: Record<string, string> = {
    addition: 'Addition',
    subtraction: 'Subtraction',
    multiplication: 'Multiplication',
    division: 'Division',
    mixed: 'Mixed Operations',
};

const difficultyLevels: { value: Difficulty; label: string }[] = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
];

const mixedOpLabels = [
    { icon: 'add', label: 'Addition' },
    { icon: 'remove', label: 'Subtraction' },
    { icon: 'close', label: 'Multiplication' },
    { icon: 'percent', label: 'Division' },
];

export default function GameSetup({
    mode,
    digits,
    difficulty,
    allowRemainder,
    mixedOps,
    onDigitsChange,
    onDifficultyChange,
    onAllowRemainderChange,
    onMixedOpsChange,
    onStart,
    onBack,
}: GameSetupProps) {
    const diffIdx = difficultyLevels.findIndex(d => d.value === difficulty);

    return (
        <div className="flex flex-col h-full animate-fade-in">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-header backdrop-blur-sm px-4 pt-12 pb-2 flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center justify-center p-2 -ml-2 rounded-full hover:bg-primary/10 transition-colors"
                >
                    <span className="material-symbols-outlined text-main" style={{ fontSize: 24 }}>arrow_back_ios_new</span>
                </button>
                <h1 className="text-xl font-bold tracking-tight text-center flex-1 pr-10 text-main">
                    {modeLabels[mode] || 'Setup'}
                </h1>
            </div>

            <main className="flex-1 px-5 pb-32 flex flex-col gap-6 overflow-y-auto pt-4">
                {/* Mixed operations toggles */}
                {mode === 'mixed' && (
                    <section>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-secondary mb-3 px-1 ml-1">
                            Arithmetic Operations
                        </h3>
                        <div className="bg-card border border-card rounded-2xl overflow-hidden divide-y divide-midnight-border">
                            {mixedOpLabels.map((op, i) => (
                                <div
                                    key={op.label}
                                    className="flex items-center justify-between p-4 py-3.5 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                                            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{op.icon}</span>
                                        </div>
                                        <span className="text-base font-medium text-main">{op.label}</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const next = [...mixedOps];
                                            next[i] = !next[i];
                                            // Ensure at least one is selected
                                            if (next.some(v => v)) onMixedOpsChange(next);
                                        }}
                                        className={`w-[52px] h-8 rounded-full relative transition-colors ${mixedOps[i] ? 'bg-primary' : 'bg-toggle-off'
                                            }`}
                                    >
                                        <div
                                            className="absolute top-[2px] left-[2px] w-7 h-7 rounded-full bg-white transition-transform"
                                            style={{ transform: mixedOps[i] ? 'translateX(20px)' : 'translateX(0)' }}
                                        />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Number of digits — only for non-mixed modes */}
                {mode !== 'mixed' && (
                    <section>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-secondary mb-3 px-1 ml-1">
                            Number of Digits
                        </h3>
                        <div className="flex gap-3">
                            {[1, 2, 3, 4, 5].map(d => (
                                <button
                                    key={d}
                                    onClick={() => onDigitsChange(d)}
                                    className={`flex-1 h-12 rounded-xl font-semibold text-lg transition-all ${digits === d
                                            ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                            : 'bg-card border border-card text-secondary hover:border-primary/30'
                                        }`}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                {/* Difficulty slider */}
                <section>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-secondary mb-3 px-1 ml-1">
                        Difficulty
                    </h3>
                    <div className="bg-card border border-card rounded-2xl p-6 pb-8">
                        <div className="flex justify-between text-sm font-medium text-secondary mb-6 px-1">
                            {difficultyLevels.map((d, i) => (
                                <span
                                    key={d.value}
                                    className={i === diffIdx ? 'text-primary font-bold' : ''}
                                >
                                    {d.label}
                                </span>
                            ))}
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="2"
                            value={diffIdx}
                            onChange={(e) => onDifficultyChange(difficultyLevels[parseInt(e.target.value)].value)}
                            className="w-full"
                        />
                    </div>
                </section>

                {/* Division mode toggle */}
                {mode === 'division' && (
                    <section>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-secondary mb-3 px-1 ml-1">
                            Division Mode
                        </h3>
                        <div className="bg-card border border-card rounded-2xl overflow-hidden">
                            <div className="flex items-center justify-between p-4 py-3.5">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>calculate</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-base font-medium text-main">Allow Remainders</span>
                                        <span className="text-xs text-secondary">Include non-exact divisions</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onAllowRemainderChange(!allowRemainder)}
                                    className={`w-[52px] h-8 rounded-full relative transition-colors ${allowRemainder ? 'bg-primary' : 'bg-toggle-off'
                                        }`}
                                >
                                    <div
                                        className="absolute top-[2px] left-[2px] w-7 h-7 rounded-full bg-white transition-transform"
                                        style={{ transform: allowRemainder ? 'translateX(20px)' : 'translateX(0)' }}
                                    />
                                </button>
                            </div>
                        </div>
                    </section>
                )}
            </main>

            {/* Fixed bottom CTA */}
            <div className="fixed bottom-0 left-0 w-full bg-header backdrop-blur-xl p-5 pb-10 z-20">
                <button
                    onClick={onStart}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-lg py-4 px-6 rounded-2xl shadow-lg shadow-primary/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    <span>Start Practice</span>
                    <span className="material-symbols-outlined">arrow_forward</span>
                </button>
            </div>
        </div>
    );
}
