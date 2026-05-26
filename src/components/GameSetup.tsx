import type { Difficulty, GameMode } from '../hooks/useGameLogic';
import RangeSlider from './RangeSlider';

interface GameSetupProps {
    mode: GameMode;
    digits: number;
    difficulty: Difficulty;
    allowRemainder: boolean;
    mixedOps: boolean[];
    allowNegativeResults: boolean;
    onDigitsChange: (d: number) => void;
    onDifficultyChange: (d: Difficulty) => void;
    onAllowRemainderChange: (v: boolean) => void;
    onMixedOpsChange: (ops: boolean[]) => void;
    onAllowNegativeResultsChange: (v: boolean) => void;
    squareRangeType: 'fixed' | 'custom';
    customSquareRange: [number, number];
    onSquareRangeTypeChange: (type: 'fixed' | 'custom') => void;
    onCustomSquareRangeChange: (range: [number, number]) => void;
    fractionDenominatorRange: [number, number];
    onFractionDenominatorRangeChange: (range: [number, number]) => void;
    fractionNumeratorRange: [number, number];
    onFractionNumeratorRangeChange: (range: [number, number]) => void;
    onStart: () => void;
    onBack: () => void;
}

const modeLabels: Record<string, string> = {
    addition: 'Addition',
    subtraction: 'Subtraction',
    multiplication: 'Multiplication',
    division: 'Division',
    mixed: 'Mixed Operations',
    square: 'Square Numbers',
    fraction: 'Fractions',
    percentage: 'Percentages',
    'square-root': 'Square Roots',
    approximation: 'Estimation',
    'number-series': 'Number Series',
    ratio: 'Ratios',
    'chain-calculation': 'Chain Calculation',
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
    allowNegativeResults,
    squareRangeType,
    customSquareRange,
    onDigitsChange,
    onDifficultyChange,
    onAllowRemainderChange,
    onMixedOpsChange,
    onAllowNegativeResultsChange,
    onSquareRangeTypeChange,
    onCustomSquareRangeChange,
    fractionDenominatorRange,
    onFractionDenominatorRangeChange,
    fractionNumeratorRange,
    onFractionNumeratorRangeChange,
    onStart,
    onBack,
}: GameSetupProps) {
    const diffIdx = difficultyLevels.findIndex(d => d.value === difficulty);

    return (
        <div className="flex flex-col h-full animate-fade-in">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-header backdrop-blur-sm px-4 pt-6 pb-2 flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center justify-center p-2 -ml-2 rounded-full"
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
                                            className={`absolute top-[2px] left-[2px] w-7 h-7 rounded-full transition-transform ${mixedOps[i] ? 'bg-black' : 'bg-white'}`}
                                            style={{ transform: mixedOps[i] ? 'translateX(20px)' : 'translateX(0)' }}
                                        />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Number of digits — only for operations that use generateNumber() */}
                {['addition', 'subtraction', 'multiplication', 'division', 'mixed'].includes(mode) && (
                    <section>
                        <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-secondary mb-4 px-1 ml-1 opacity-70">
                            Number of Digits
                        </h3>
                        <div className="flex gap-3 justify-between">
                            {[1, 2, 3, 4, 5].map(d => (
                                <button
                                    key={d}
                                    onClick={() => onDigitsChange(d)}
                                    className={`flex-1 aspect-square max-w-[64px] rounded-2xl font-bold text-xl transition-all duration-200 ${digits === d
                                        ? 'bg-primary text-on-primary scale-105'
                                        : 'bg-card border border-card text-secondary active:scale-95'
                                        }`}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                {/* Square Range Selector */}
                {mode === 'square' && (
                    <section>
                        <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-secondary mb-4 px-1 ml-1 opacity-70">
                            Square Range
                        </h3>
                        <div className="bg-card border border-card rounded-3xl p-6 shadow-sm">
                            <div className="flex gap-3 mb-6">
                                <button
                                    onClick={() => onSquareRangeTypeChange('fixed')}
                                    className={`flex-1 py-4 rounded-2xl font-bold transition-all duration-200 ${squareRangeType === 'fixed'
                                        ? 'bg-primary text-on-primary'
                                        : 'bg-surface/50 border border-card text-secondary'
                                        }`}
                                >
                                    1 to 25
                                </button>
                                <button
                                    onClick={() => onSquareRangeTypeChange('custom')}
                                    className={`flex-1 py-4 rounded-2xl font-bold transition-all duration-200 ${squareRangeType === 'custom'
                                        ? 'bg-primary text-on-primary'
                                        : 'bg-surface/50 border border-card text-secondary'
                                        }`}
                                >
                                    Custom
                                </button>
                            </div>

                            {squareRangeType === 'custom' && (
                                <div className="flex justify-between items-center gap-6 mt-4 animate-scale-in">
                                    <div className="flex-1 flex flex-col gap-2">
                                        <span className="text-[10px] text-secondary uppercase font-black text-center tracking-widest opacity-60">Min</span>
                                        <input
                                            type="number"
                                            min="1"
                                            max="999"
                                            value={customSquareRange[0]}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value, 10);
                                                if (!isNaN(val) && val >= 1 && val <= customSquareRange[1]) {
                                                    onCustomSquareRangeChange([val, customSquareRange[1]]);
                                                }
                                            }}
                                            className="w-full p-4 text-2xl font-black text-center bg-input-card border border-card rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-main"
                                        />
                                    </div>
                                    <span className="text-primary font-black text-2xl mt-6">/</span>
                                    <div className="flex-1 flex flex-col gap-2">
                                        <span className="text-[10px] text-secondary uppercase font-black text-center tracking-widest opacity-60">Max</span>
                                        <input
                                            type="number"
                                            min={customSquareRange[0]}
                                            max="999"
                                            value={customSquareRange[1]}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value, 10);
                                                if (!isNaN(val) && val >= customSquareRange[0] && val <= 999) {
                                                    onCustomSquareRangeChange([customSquareRange[0], val]);
                                                }
                                            }}
                                            className="w-full p-4 text-2xl font-black text-center bg-input-card border border-card rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-main"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* Difficulty slider */}
                <section>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-secondary mb-4 px-1 ml-1 opacity-70">
                        Difficulty
                    </h3>
                    <div className="bg-card border border-card rounded-3xl p-6 pb-10 shadow-sm">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-secondary mb-10 px-1 opacity-80">
                            {difficultyLevels.map((d, i) => (
                                <span
                                    key={d.value}
                                    className={`transition-all duration-300 ${i === diffIdx ? 'text-primary scale-110' : ''}`}
                                >
                                    {d.label}
                                </span>
                            ))}
                        </div>
                        <div className="relative px-2">
                            <RangeSlider
                                value={diffIdx}
                                min={0}
                                max={2}
                                onChange={(val) => onDifficultyChange(difficultyLevels[Math.round(val)].value)}
                            />
                        </div>
                    </div>
                </section>


                {/* Subtraction mode toggle */}
                {mode === 'subtraction' && (
                    <section>
                        <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-secondary mb-4 px-1 ml-1 opacity-70">
                            Subtraction Mode
                        </h3>
                        <div className="bg-card border border-card rounded-3xl overflow-hidden shadow-sm">
                            <div className="flex items-center justify-between p-5">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary">
                                        <span className="material-symbols-outlined" style={{ fontSize: 24 }}>remove</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-base font-bold text-main">Negative Results</span>
                                        <span className="text-[10px] text-secondary font-black uppercase tracking-widest mt-0.5">{allowNegativeResults ? 'State A: Forced' : 'State B: Positive Only'}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onAllowNegativeResultsChange(!allowNegativeResults)}
                                    className={`w-[56px] h-8 rounded-full relative transition-all duration-300 ${allowNegativeResults ? 'bg-primary' : 'bg-toggle-off'
                                        }`}
                                >
                                    <div
                                        className={`absolute top-[3px] left-[3px] w-6.5 h-6.5 rounded-full transition-transform duration-300 shadow-sm ${allowNegativeResults ? 'bg-black translateX(24px)' : 'bg-white translateX(0)'}`}
                                        style={{ transform: allowNegativeResults ? 'translateX(24px)' : 'translateX(0)' }}
                                    />
                                </button>
                            </div>
                        </div>
                    </section>
                )}

                {/* Division mode toggle */}
                {mode === 'division' && (
                    <section>
                        <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-secondary mb-4 px-1 ml-1 opacity-70">
                            Division Mode
                        </h3>
                        <div className="bg-card border border-card rounded-3xl overflow-hidden shadow-sm">
                            <div className="flex items-center justify-between p-5">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary">
                                        <span className="material-symbols-outlined" style={{ fontSize: 24 }}>calculate</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-base font-bold text-main">Allow Remainders</span>
                                        <span className="text-[10px] text-secondary font-black uppercase tracking-widest mt-0.5">Include non-exact</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onAllowRemainderChange(!allowRemainder)}
                                    className={`w-[56px] h-8 rounded-full relative transition-all duration-300 ${allowRemainder ? 'bg-primary' : 'bg-toggle-off'
                                        }`}
                                >
                                    <div
                                        className={`absolute top-[3px] left-[3px] w-6.5 h-6.5 rounded-full transition-transform duration-300 shadow-sm ${allowRemainder ? 'bg-black' : 'bg-white'}`}
                                        style={{ transform: allowRemainder ? 'translateX(24px)' : 'translateX(0)' }}
                                    />
                                </button>
                            </div>
                        </div>
                    </section>
                )}

                {/* Fraction Range */}
                {mode === 'fraction' && (
                    <section>
                        <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-secondary mb-4 px-1 ml-1 opacity-70">
                            Maximum Denominator
                        </h3>
                        <div className="bg-card border border-card rounded-3xl p-6 shadow-sm">
                            <div className="grid grid-cols-2 gap-4">
                                {[2, 4, 6, 8, 10].map(den => (
                                    <button
                                        key={den}
                                        onClick={() => onFractionDenominatorRangeChange([2, den])}
                                        className={`py-4 rounded-2xl font-black text-xl transition-all duration-200 ${fractionDenominatorRange[1] === den
                                            ? 'bg-primary text-on-primary scale-[1.02]'
                                            : 'bg-surface/50 border border-card text-secondary'
                                            }`}
                                    >
                                        {den}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-secondary mb-4 mt-8 px-1 ml-1 opacity-70">
                            Maximum Numerator
                        </h3>
                        <div className="bg-card border border-card rounded-3xl p-6 shadow-sm">
                            <div className="grid grid-cols-2 gap-4">
                                {[2, 4, 6, 8, 10].map(num => (
                                    <button
                                        key={num}
                                        onClick={() => onFractionNumeratorRangeChange([1, num])}
                                        className={`py-4 rounded-2xl font-black text-xl transition-all duration-200 ${fractionNumeratorRange[1] === num
                                            ? 'bg-primary text-on-primary scale-[1.02]'
                                            : 'bg-surface/50 border border-card text-secondary'
                                            }`}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            </main>

            {/* Fixed bottom CTA */}
            <div className="fixed bottom-0 left-0 w-full bg-header backdrop-blur-xl p-5 pb-10 z-20">
                <button
                    onClick={onStart}
                    className="w-full bg-primary text-on-primary font-bold text-lg py-4 px-6 rounded-2xl active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    <span>Start Practice</span>
                    <span className="material-symbols-outlined text-on-primary">arrow_forward</span>
                </button>
            </div>
        </div>
    );
}
