import { useRef, useLayoutEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import type { GameMode, GameSettings } from '../hooks/useGameLogic';
import { canDecreaseGoal } from '../services/notifications';
import ProgressBar from './ProgressBar';

const SCROLL_STORAGE_KEY = 'zenmath-menu-scroll-position';

interface MainMenuProps {
    onSelect: (mode: GameMode) => void;
    game: {
        dailyProgress: number;
        settings: GameSettings;
        updateSettings: (s: GameSettings) => void;
    };
}

export default function MainMenu({ onSelect, game }: MainMenuProps) {
    const { theme, toggleTheme } = useTheme();
    const mainRef = useRef<HTMLDivElement>(null);

    // Handle Scroll Restoration with increased robustness
    useLayoutEffect(() => {
        const container = mainRef.current;
        if (!container) return;

        // 1. Restore position with a retry mechanism to handle layout shifts
        const savedPosition = sessionStorage.getItem(SCROLL_STORAGE_KEY);
        if (savedPosition) {
            const targetPos = parseInt(savedPosition, 10);
            let attempts = 0;
            const maxAttempts = 15; // Increased attempts for slower devices
            
            const performRestoration = () => {
                if (!container) return;
                
                container.scrollTop = targetPos;
                
                // Check if we've reached the target OR if we're at the bottom
                const reachedTarget = Math.abs(container.scrollTop - targetPos) < 2;
                const atBottom = Math.abs(container.scrollTop + container.clientHeight - container.scrollHeight) < 2;

                if (!reachedTarget && !atBottom && attempts < maxAttempts) {
                    attempts++;
                    requestAnimationFrame(performRestoration);
                } else if (attempts >= maxAttempts || atBottom) {
                    // If we can't reach the target after max attempts, 
                    // sync the ACTUAL position back to storage to prevent stale data.
                    sessionStorage.setItem(SCROLL_STORAGE_KEY, String(container.scrollTop));
                }
            };

            requestAnimationFrame(performRestoration);
            const timeoutId = setTimeout(performRestoration, 150);
            return () => clearTimeout(timeoutId);
        }

        // 2. Setup scroll listener for saving
        let scrollTimeout: ReturnType<typeof setTimeout>;
        const handleScroll = () => {
            // Use a small debounce to avoid hammering sessionStorage
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                if (container) {
                    sessionStorage.setItem(SCROLL_STORAGE_KEY, String(container.scrollTop));
                }
            }, 50);
        };

        container.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            clearTimeout(scrollTimeout);
            container.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const ops: { mode: GameMode; symbol: string; label: string; color: string; glow: string }[] = [
        { mode: 'addition', symbol: '+', label: 'Addition', color: 'text-primary', glow: 'icon-glow-blue' },
        { mode: 'subtraction', symbol: '-', label: 'Subtraction', color: 'text-primary/90', glow: 'icon-glow-red' },
        { mode: 'multiplication', symbol: '×', label: 'Multiplication', color: 'text-primary/80', glow: 'icon-glow-amber' },
        { mode: 'division', symbol: '÷', label: 'Division', color: 'text-primary/70', glow: 'icon-glow-emerald' },
    ];

    return (
        <div className="flex flex-col h-full relative bg-surface">
            {/* Header */}
            <header className="shrink-0 pt-6 pb-3 px-6 flex items-center justify-between sticky top-0 z-20 bg-header backdrop-blur-sm border-b border-nav">
                <h1 className="text-xl font-bold tracking-tight text-main">ZenMath</h1>
                <button
                    onClick={toggleTheme}
                    className="flex items-center justify-center w-8 h-8 rounded-full text-secondary"
                >
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>
                        {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                    </span>
                </button>
            </header>

            {/* Scrollable content area */}
            <main ref={mainRef} className="flex-1 overflow-y-auto px-6 pb-24">
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
                                className="flat-card aspect-square bg-card border border-card rounded-2xl flex flex-col items-center justify-center gap-2"
                            >
                                <span className={`text-5xl font-thin-ops ${op.color} ${op.glow}`}>
                                    {op.symbol}
                                </span>
                                <span className="text-sm font-semibold text-secondary">{op.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Mixed Operations */}
                    <button
                        onClick={() => onSelect('mixed')}
                        className="flat-card w-full p-6 bg-card border border-card rounded-2xl flex items-center justify-between"
                    >
                        <div className="flex flex-col items-start gap-1">
                            <span className="text-lg font-bold text-main">
                                Mixed Operations
                            </span>
                            <span className="text-xs text-secondary font-medium">Randomized challenge</span>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary icon-glow-purple">
                            <span className="material-symbols-outlined" style={{ fontSize: 28 }}>shuffle</span>
                        </div>
                    </button>

                    {/* Specialized Practice */}
                    <div className="flex flex-col gap-4">
                        <p className="text-secondary text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">Specialized Practice</p>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                onClick={() => onSelect('multiplication-table')}
                                className="flat-card aspect-square bg-card border border-card rounded-2xl flex flex-col items-center justify-center gap-1 p-2 text-center"
                            >
                                <span className="material-symbols-outlined text-xl text-primary/80 icon-glow-orange">
                                    grid_on
                                </span>
                                <span className="text-[8px] font-medium text-secondary/70 uppercase tracking-tight truncate w-full">Tables</span>
                            </button>
                            <button
                                onClick={() => onSelect('factor-finding')}
                                className="flat-card aspect-square bg-card border border-card rounded-2xl flex flex-col items-center justify-center gap-1 p-2 text-center"
                            >
                                <span className="material-symbols-outlined text-xl text-primary/75 icon-glow-purple">
                                    exposure
                                </span>
                                <span className="text-[8px] font-medium text-secondary/70 uppercase tracking-tight truncate w-full">Factors</span>
                            </button>
                            <button
                                onClick={() => onSelect('square')}
                                className="flat-card aspect-square bg-card border border-card rounded-2xl flex flex-col items-center justify-center gap-1 p-2 text-center"
                            >
                                <span className="text-xl font-thin-ops text-primary/70 icon-glow-cyan">
                                    x²
                                </span>
                                <span className="text-[8px] font-medium text-secondary/70 uppercase tracking-tight truncate w-full">Squares</span>
                            </button>
                            <button
                                onClick={() => onSelect('fraction')}
                                className="flat-card aspect-square bg-card border border-card rounded-2xl flex flex-col items-center justify-center gap-1 p-2 text-center"
                            >
                                <span className="text-xl font-thin-ops text-primary/60 icon-glow-emerald">
                                    ½
                                </span>
                                <span className="text-[8px] font-medium text-secondary/70 uppercase tracking-tight truncate w-full">Fractions</span>
                            </button>
                            <button
                                onClick={() => onSelect('percentage')}
                                className="flat-card aspect-square bg-card border border-card rounded-2xl flex flex-col items-center justify-center gap-1 p-2 text-center"
                            >
                                <span className="text-xl font-thin-ops text-primary/90 icon-glow-purple">
                                    %
                                </span>
                                <span className="text-[8px] font-medium text-secondary/70 uppercase tracking-tight truncate w-full">Percent</span>
                            </button>
                            <button
                                onClick={() => onSelect('square-root')}
                                className="flat-card aspect-square bg-card border border-card rounded-2xl flex flex-col items-center justify-center gap-1 p-2 text-center"
                            >
                                <span className="text-xl font-thin-ops text-primary/80 icon-glow-cyan">
                                    √
                                </span>
                                <span className="text-[8px] font-medium text-secondary/70 uppercase tracking-tight truncate w-full">Roots</span>
                            </button>
                            <button
                                onClick={() => onSelect('number-series')}
                                className="flat-card aspect-square bg-card border border-card rounded-2xl flex flex-col items-center justify-center gap-1 p-2 text-center"
                            >
                                <span className="material-symbols-outlined text-xl text-primary/75 icon-glow-blue">
                                    linear_scale
                                </span>
                                <span className="text-[8px] font-medium text-secondary/70 uppercase tracking-tight truncate w-full">Series</span>
                            </button>
                            <button
                                onClick={() => onSelect('ratio')}
                                className="flat-card aspect-square bg-card border border-card rounded-2xl flex flex-col items-center justify-center gap-1 p-2 text-center"
                            >
                                <span className="text-xl font-thin-ops text-primary/65 icon-glow-emerald">
                                    ::
                                </span>
                                <span className="text-[8px] font-medium text-secondary/70 uppercase tracking-tight truncate w-full">Ratio</span>
                            </button>
                            <button
                                onClick={() => onSelect('chain-calculation')}
                                className="flat-card aspect-square bg-card border border-card rounded-2xl flex flex-col items-center justify-center gap-1 p-2 text-center"
                            >
                                <span className="material-symbols-outlined text-xl text-primary/85 icon-glow-red">
                                    multiple_stop
                                </span>
                                <span className="text-[8px] font-medium text-secondary/70 uppercase tracking-tight truncate w-full">Chain</span>
                            </button>
                        </div>
                    </div>

                    {/* Daily Goal */}
                    <div className="mt-2 p-6 bg-card border border-card rounded-3xl shadow-sm">
                        <div className="flex justify-between items-center mb-5">
                            <div>
                                <h3 className="text-main font-bold text-lg">Daily Goal</h3>
                                <p className="text-xs text-secondary font-medium mt-0.5">
                                    {game.dailyProgress} / {game.settings.dailyGoal} sessions today
                                    {game.dailyProgress >= game.settings.dailyGoal && (
                                        <span className="ml-2 text-emerald-500">✓</span>
                                    )}
                                </p>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="relative flex items-center gap-1">
                                    {!canDecreaseGoal() && (
                                        <span className="material-symbols-outlined text-amber-500" 
                                              style={{ fontSize: 16 }}
                                              title="Complete today's goal to lower it"
                                        >lock</span>
                                    )}
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={game.settings.dailyGoal || ''}
                                        disabled={!canDecreaseGoal()}
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
                                        className={`w-16 bg-primary/5 text-xl font-black text-primary text-center rounded-xl border border-primary/20 focus:outline-none focus:ring-4 focus:ring-primary/10 px-2 py-2 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${!canDecreaseGoal() ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        placeholder="10"
                                    />
                                </div>
                                <span className="text-[9px] text-secondary mt-1.5 uppercase font-black tracking-widest opacity-60">
                                    {canDecreaseGoal() ? 'Target' : 'Complete goal to change'}
                                </span>
                            </div>
                        </div>
                        <ProgressBar value={game.dailyProgress} max={game.settings.dailyGoal || 1} />
                    </div>
                </div>
            </main>
        </div>
    );
}
