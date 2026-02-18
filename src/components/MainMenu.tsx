import { useTheme } from '../hooks/useTheme';
import type { GameMode } from '../hooks/useGameLogic';

interface MainMenuProps {
    onSelect: (mode: GameMode) => void;
    onSettings: () => void;
}

export default function MainMenu({ onSelect, onSettings }: MainMenuProps) {
    const { theme, toggleTheme } = useTheme();

    const ops: { mode: GameMode; symbol: string; label: string }[] = [
        { mode: 'addition', symbol: '+', label: 'Addition' },
        { mode: 'subtraction', symbol: '−', label: 'Subtraction' },
        { mode: 'multiplication', symbol: '×', label: 'Multiplication' },
        { mode: 'division', symbol: '÷', label: 'Division' },
    ];

    return (
        <div className="flex flex-col h-full relative">
            {/* Header */}
            <header className="shrink-0 pt-12 pb-4 px-6 flex items-center justify-between sticky top-0 z-20 bg-header backdrop-blur-sm">
                <h1 className="text-2xl font-bold tracking-tight text-main">ZenMath</h1>
                <button
                    onClick={toggleTheme}
                    className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-primary/10 transition-colors text-secondary"
                >
                    <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                        {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                    </span>
                </button>
            </header>

            {/* Scrollable content area */}
            <main className="flex-1 overflow-y-auto px-6 pb-24">
                <div className="max-w-lg mx-auto flex flex-col gap-6">
                    {/* Section label */}
                    <div className="py-2">
                        <p className="text-secondary text-sm font-medium uppercase tracking-wider">Select Mode</p>
                    </div>

                    {/* 2×2 Operation grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {ops.map((op) => (
                            <button
                                key={op.mode}
                                onClick={() => onSelect(op.mode)}
                                className="flat-card aspect-square bg-card border border-card rounded-2xl flex flex-col items-center justify-center gap-2 group hover:border-primary/50"
                            >
                                <span className="text-6xl font-light text-primary group-hover:scale-110 transition-transform duration-300">
                                    {op.symbol}
                                </span>
                                <span className="text-sm font-medium text-secondary">{op.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Mixed Operations */}
                    <button
                        onClick={() => onSelect('mixed')}
                        className="flat-card w-full p-6 bg-card border border-card rounded-2xl flex items-center justify-between group hover:border-primary/50"
                    >
                        <div className="flex flex-col items-start gap-1">
                            <span className="text-xl font-semibold text-main group-hover:text-primary transition-colors">
                                Mixed Operations
                            </span>
                            <span className="text-sm text-secondary">Randomized challenge</span>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                            <span className="material-symbols-outlined">shuffle</span>
                        </div>
                    </button>

                    {/* Specialized Practice */}
                    <div className="flex flex-col gap-4">
                        <h2 className="text-secondary text-sm font-medium uppercase tracking-wider">Specialized Practice</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => onSelect('multiplication-table')}
                                className="flat-card aspect-square bg-card border border-card rounded-2xl flex flex-col items-center justify-center gap-3 group hover:border-primary/50"
                            >
                                <span className="material-symbols-outlined text-3xl text-primary group-hover:scale-110 transition-transform duration-300">
                                    grid_on
                                </span>
                                <span className="text-sm font-medium text-secondary">Times Tables</span>
                            </button>
                            <button
                                onClick={() => onSelect('square')}
                                className="flat-card aspect-square bg-card border border-card rounded-2xl flex flex-col items-center justify-center gap-3 group hover:border-primary/50"
                            >
                                <span className="text-3xl font-light text-primary group-hover:scale-110 transition-transform duration-300">
                                    x²
                                </span>
                                <span className="text-sm font-medium text-secondary">Square Numbers</span>
                            </button>
                        </div>
                    </div>

                    {/* Daily Goal – decorative */}
                    <div className="mt-2 p-6 bg-primary/10 rounded-2xl border border-primary/20">
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <h3 className="text-primary font-semibold">Daily Goal</h3>
                                <p className="text-xs text-primary/70 mt-1">Keep your streak alive</p>
                            </div>
                            <span className="text-2xl font-bold text-primary">
                                0<span className="text-sm font-normal text-primary/60">/20</span>
                            </span>
                        </div>
                        <div className="w-full bg-primary/10 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-primary h-1.5 rounded-full transition-all duration-500" style={{ width: '0%' }} />
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
                    <button className="flex flex-col items-center gap-1 p-2 group text-secondary hover:text-main transition-colors">
                        <span className="material-symbols-outlined group-hover:scale-110 transition-transform">bar_chart</span>
                        <span className="text-[10px] font-medium tracking-wide">Statistics</span>
                    </button>
                    <button
                        onClick={onSettings}
                        className="flex flex-col items-center gap-1 p-2 group text-secondary hover:text-main transition-colors"
                    >
                        <span className="material-symbols-outlined group-hover:scale-110 transition-transform">tune</span>
                        <span className="text-[10px] font-medium tracking-wide">Settings</span>
                    </button>
                </div>
            </nav>
        </div>
    );
}
