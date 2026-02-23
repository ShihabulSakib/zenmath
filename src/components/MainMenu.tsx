import { useTheme } from '../hooks/useTheme';
import type { GameMode } from '../hooks/useGameLogic';

interface MainMenuProps {
    onSelect: (mode: GameMode) => void;
    onSettings: () => void;
    game: any;
}

export default function MainMenu({ onSelect, onSettings, game }: MainMenuProps) {
    const { theme, toggleTheme } = useTheme();

    const ops: { mode: GameMode; symbol: string; label: string; color: string; glow: string }[] = [
        { mode: 'addition', symbol: '+', label: 'Addition', color: 'text-blue-500', glow: 'icon-glow-blue' },
        { mode: 'subtraction', symbol: '−', label: 'Subtraction', color: 'text-red-500', glow: 'icon-glow-red' },
        { mode: 'multiplication', symbol: '×', label: 'Multiplication', color: 'text-amber-500', glow: 'icon-glow-amber' },
        { mode: 'division', symbol: '÷', label: 'Division', color: 'text-emerald-500', glow: 'icon-glow-emerald' },
    ];

    return (
        <div className="flex flex-col h-full relative bg-surface">
            {/* Header */}
            <header className="shrink-0 pt-6 pb-3 px-6 flex items-center justify-between sticky top-0 z-20 bg-header backdrop-blur-sm border-b border-nav">
                <h1 className="text-xl font-bold tracking-tight text-main">ZenMath</h1>
                <button
                    onClick={toggleTheme}
                    className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-primary/10 transition-colors text-secondary"
                >
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>
                        {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                    </span>
                </button>
            </header>

            {/* Scrollable content area */}
            <main className="flex-1 overflow-y-auto px-6 pb-24">
                <div className="max-w-lg mx-auto flex flex-col gap-6 pt-4">
                    {/* Section label */}
                    <div className="py-1">
                        <p className="text-secondary text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">Select Mode</p>
                    </div>

                    {/* 2×2 Operation grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {ops.map((op) => (
                            <button
                                key={op.mode}
                                onClick={() => onSelect(op.mode)}
                                className="flat-card aspect-square bg-card border border-card rounded-2xl flex flex-col items-center justify-center gap-2 group hover:border-primary/50 transition-all duration-300"
                            >
                                <span className={`text-6xl font-light ${op.color} ${op.glow} group-hover:scale-110 transition-transform duration-300`}>
                                    {op.symbol}
                                </span>
                                <span className="text-sm font-semibold text-secondary group-hover:text-main transition-colors">{op.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Mixed Operations */}
                    <button
                        onClick={() => onSelect('mixed')}
                        className="flat-card w-full p-6 bg-card border border-card rounded-2xl flex items-center justify-between group hover:border-primary/50"
                    >
                        <div className="flex flex-col items-start gap-1">
                            <span className="text-lg font-bold text-main group-hover:text-primary transition-colors">
                                Mixed Operations
                            </span>
                            <span className="text-xs text-secondary font-medium">Randomized challenge</span>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-all icon-glow-purple">
                            <span className="material-symbols-outlined" style={{ fontSize: 28 }}>shuffle</span>
                        </div>
                    </button>

                    {/* Specialized Practice */}
                    <div className="flex flex-col gap-4">
                        <p className="text-secondary text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">Specialized Practice</p>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                onClick={() => onSelect('multiplication-table')}
                                className="flat-card aspect-square bg-card border border-card rounded-2xl flex flex-col items-center justify-center gap-1 group hover:border-primary/50 p-2 text-center"
                            >
                                <span className="material-symbols-outlined text-xl text-orange-500 icon-glow-orange group-hover:scale-110 transition-transform">
                                    grid_on
                                </span>
                                <span className="text-[9px] font-bold text-secondary uppercase tracking-tighter truncate w-full">Tables</span>
                            </button>
                            <button
                                onClick={() => onSelect('square')}
                                className="flat-card aspect-square bg-card border border-card rounded-2xl flex flex-col items-center justify-center gap-1 group hover:border-primary/50 p-2 text-center"
                            >
                                <span className="text-xl font-bold text-cyan-500 icon-glow-cyan group-hover:scale-110 transition-transform">
                                    x²
                                </span>
                                <span className="text-[9px] font-bold text-secondary uppercase tracking-tighter truncate w-full">Squares</span>
                            </button>
                            <button
                                onClick={() => onSelect('fraction')}
                                className="flat-card aspect-square bg-card border border-card rounded-2xl flex flex-col items-center justify-center gap-1 group hover:border-primary/50 p-2 text-center"
                            >
                                <span className="text-xl font-bold text-emerald-500 icon-glow-emerald group-hover:scale-110 transition-transform">
                                    ½
                                </span>
                                <span className="text-[9px] font-bold text-secondary uppercase tracking-tighter truncate w-full">Fractions</span>
                            </button>
                        </div>
                    </div>

                    {/* Daily Goal */}
                    <div className="mt-2 p-6 bg-card border border-card rounded-3xl shadow-sm">
                        <div className="flex justify-between items-center mb-5">
                            <div>
                                <h3 className="text-main font-bold text-lg">Daily Goal</h3>
                                <p className="text-xs text-secondary font-medium mt-0.5">{game.dailyProgress} / {game.settings.dailyGoal} questions today</p>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={game.settings.dailyGoal || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === '') {
                                                game.updateSettings({ ...game.settings, dailyGoal: 0 });
                                                return;
                                            }
                                            const newGoal = parseInt(val, 10);
                                            if (!isNaN(newGoal) && newGoal >= 0 && newGoal <= 100) {
                                                game.updateSettings({ ...game.settings, dailyGoal: newGoal });
                                            }
                                        }}
                                        className="w-16 bg-primary/5 text-xl font-black text-primary text-center rounded-xl border border-primary/20 focus:outline-none focus:ring-4 focus:ring-primary/10 px-2 py-2 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="20"
                                    />
                                </div>
                                <span className="text-[9px] text-secondary mt-1.5 uppercase font-black tracking-widest opacity-60">Target</span>
                            </div>
                        </div>
                        <div className="w-full bg-primary/10 rounded-full h-2.5 overflow-hidden">
                            <div
                                className="bg-primary h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(13,89,242,0.4)]"
                                style={{ width: `${Math.min(100, (game.dailyProgress / (game.settings.dailyGoal || 1)) * 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </main>

            {/* Bottom navigation — full-width, outside the content container */}
            <nav className="shrink-0 bg-nav backdrop-blur-lg border-t border-nav pb-6 pt-3 px-6 z-20">
                <div className="flex justify-around items-center max-w-lg mx-auto">
                    <button className="flex flex-col items-center gap-1 p-2 group">
                        <div className="relative">
                            <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">school</span>
                            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                        </div>
                        <span className="text-[10px] font-medium text-primary tracking-wide">Practice</span>
                    </button>

                    <button
                        onClick={onSettings}
                        className="flex flex-col items-center gap-1 p-2 group text-primary hover:text-primary transition-colors"
                    >
                        <span className="material-symbols-outlined group-hover:scale-110 transition-transform">tune</span>
                        <span className="text-[10px] font-medium tracking-wide">Settings</span>
                    </button>
                </div>
            </nav>
        </div>
    );
}
