import type { GameMode } from '../hooks/useGameLogic';

interface SpecialMenuProps {
    mode: GameMode;
    onSelect: (range: [number, number]) => void;
    onBack: () => void;
}

const ranges: { range: [number, number]; label: string; subtitle: string }[] = [
    { range: [1, 10], label: '1—10', subtitle: 'Standard' },
    { range: [11, 20], label: '11—20', subtitle: 'Advanced' },
    { range: [1, 20], label: '1—20', subtitle: 'Mastery' },
];

export default function SpecialMenu({ mode, onSelect, onBack }: SpecialMenuProps) {
    const title = mode === 'multiplication-table' ? 'Times Tables' : 'Square Numbers';

    return (
        <div className="flex flex-col h-full animate-fade-in">
            {/* Header */}
            <header className="flex items-center justify-between p-6 pb-2">
                <button
                    onClick={onBack}
                    className="group flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-primary/10 transition-colors"
                >
                    <span className="material-symbols-outlined text-main group-hover:text-primary transition-colors" style={{ fontSize: 28 }}>
                        arrow_back
                    </span>
                </button>
                <div className="flex-1" />
                <div className="size-10" />
            </header>

            {/* Title */}
            <div className="px-6 pt-4 pb-8">
                <h1 className="text-main text-[32px] font-bold leading-tight tracking-tight uppercase">
                    Select Range
                </h1>
                <p className="text-muted text-xs font-semibold mt-1 uppercase tracking-[0.2em]">
                    {title}
                </p>
            </div>

            {/* Range cards */}
            <main className="flex-1 px-6 flex flex-col gap-5 pb-8">
                {ranges.map(({ range, label, subtitle }) => (
                    <button
                        key={label}
                        onClick={() => onSelect(range)}
                        className="group relative flex w-full flex-col justify-between overflow-hidden rounded-xl bg-card border border-card p-6 text-left transition-all active:scale-[0.98] active:bg-primary active:border-primary hover:border-primary/50"
                    >
                        <div className="flex w-full items-start justify-between">
                            <div className="flex flex-col gap-1 z-10">
                                <span className="text-main text-5xl font-bold tracking-tighter leading-none group-active:text-white">
                                    {label}
                                </span>
                                <span className="text-secondary text-base font-semibold tracking-widest uppercase group-active:text-white/90">
                                    {subtitle}
                                </span>
                            </div>
                            <div className="size-2.5 rounded-full bg-primary opacity-0 transition-opacity group-hover:opacity-100 group-active:bg-white group-active:opacity-100" />
                        </div>
                    </button>
                ))}
            </main>

            {/* Decorative dots */}
            <div className="p-8">
                <div className="flex items-center justify-center gap-3 opacity-20">
                    <div className="h-1.5 w-1.5 bg-current rounded-full" />
                    <div className="h-1.5 w-1.5 bg-current rounded-full" />
                    <div className="h-1.5 w-1.5 bg-current rounded-full" />
                </div>
            </div>
        </div>
    );
}
