import { useState } from 'react';

interface SpecialMenuProps {
    mode: string;
    onSelect: (range: [number, number]) => void;
    onBack: () => void;
}

const ranges: { range: [number, number]; label: string; subtitle: string }[] = [
    { range: [1, 10], label: '1—10', subtitle: 'Standard' },
    { range: [11, 20], label: '11—20', subtitle: 'Advanced' },
    { range: [1, 20], label: '1—20', subtitle: 'Mastery' },
];

export default function SpecialMenu({ mode, onSelect, onBack }: SpecialMenuProps) {
    const [customMode, setCustomMode] = useState(false);
    const [customValue, setCustomValue] = useState('7');
    const title = mode === 'multiplication-table' ? 'Times Tables' : mode === 'factor-finding' ? 'Finding Factors' : 'Square Numbers';
    const isTablesOrFactors = mode === 'multiplication-table' || mode === 'factor-finding';

    if (customMode) {
        return (
            <div className="flex flex-col h-full animate-fade-in">
                <header className="flex items-center justify-between p-6 pb-2">
                    <button
                        onClick={() => setCustomMode(false)}
                        className="group flex size-10 shrink-0 items-center justify-center rounded-full"
                    >
                        <span className="material-symbols-outlined text-main" style={{ fontSize: 28 }}>
                            arrow_back
                        </span>
                    </button>
                    <div className="flex-1" />
                    <div className="size-10" />
                </header>

                <div className="px-6 pt-4 pb-8">
                    <h1 className="text-main text-[32px] font-bold leading-tight tracking-tight uppercase">
                        {mode === 'factor-finding' ? 'Custom Factor Table' : 'Custom Table'}
                    </h1>
                    <p className="text-muted text-xs font-semibold mt-1 uppercase tracking-[0.2em]">
                        Enter a number (1–20)
                    </p>
                </div>

                <main className="flex-1 px-6 flex flex-col gap-8">
                    <div className="bg-card border border-card rounded-3xl p-6 shadow-sm">
                        <div className="flex flex-col items-center gap-4">
                            <span className="text-[10px] text-secondary font-black uppercase tracking-widest opacity-60">
                                {isTablesOrFactors ? 'Practice the' : 'Square numbers up to'}
                            </span>
                            <input
                                type="number"
                                min="1"
                                max="20"
                                value={customValue}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const n = parseInt(val, 10);
                                    if (val === '') {
                                        setCustomValue('');
                                    } else if (!isNaN(n) && n >= 1 && n <= 20) {
                                        setCustomValue(val);
                                    }
                                }}
                                className="w-32 p-4 text-5xl font-black text-center bg-surface border border-card rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-main"
                            />
                        </div>
                        {mode === 'multiplication-table' && customValue && (
                            <p className="text-center text-secondary text-xs mt-4 font-medium">
                                {customValue} × 1 through {customValue} × 12
                            </p>
                        )}
                        {mode === 'factor-finding' && customValue && (
                            <p className="text-center text-secondary text-xs mt-4 font-medium">
                                Find factors of the {customValue} × Table
                            </p>
                        )}
                    </div>

                    <button
                        onClick={() => {
                            const n = parseInt(customValue, 10);
                            if (!isNaN(n) && n >= 1 && n <= 20) {
                                onSelect([n, n]);
                            }
                        }}
                        disabled={!customValue || isNaN(parseInt(customValue, 10))}
                        className="w-full bg-primary text-on-primary font-bold text-lg py-4 px-6 rounded-2xl active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-40"
                    >
                        <span>Start Practice</span>
                        <span className="material-symbols-outlined text-on-primary">arrow_forward</span>
                    </button>
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full animate-fade-in">
            <header className="flex items-center justify-between p-6 pb-2">
                <button
                    onClick={onBack}
                    className="group flex size-10 shrink-0 items-center justify-center rounded-full"
                >
                    <span className="material-symbols-outlined text-main" style={{ fontSize: 28 }}>
                        arrow_back
                    </span>
                </button>
                <div className="flex-1" />
                <div className="size-10" />
            </header>

            <div className="px-6 pt-4 pb-8">
                <h1 className="text-main text-[32px] font-bold leading-tight tracking-tight uppercase">
                    Select Range
                </h1>
                <p className="text-muted text-xs font-semibold mt-1 uppercase tracking-[0.2em]">
                    {title}
                </p>
            </div>

            <main className="flex-1 px-6 flex flex-col gap-5 pb-8">
                {ranges.map(({ range, label, subtitle }) => (
                    <button
                        key={label}
                        onClick={() => onSelect(range)}
                        className="group relative flex w-full flex-col justify-between overflow-hidden rounded-xl bg-card border border-card p-6 text-left transition-all active:scale-[0.98] active:bg-primary active:border-primary"
                    >
                        <div className="flex w-full items-start justify-between">
                            <div className="flex flex-col gap-1 z-10">
                                <span className="text-main text-5xl font-bold tracking-tighter leading-none group-active:text-on-primary">
                                    {label}
                                </span>
                                <span className="text-secondary text-base font-semibold tracking-widest uppercase group-active:text-on-primary/90">
                                    {subtitle}
                                </span>
                            </div>
                            <div className="size-2.5 rounded-full bg-primary opacity-0 group-active:bg-on-primary group-active:opacity-100" />
                        </div>
                    </button>
                ))}

                {isTablesOrFactors && (
                    <button
                        onClick={() => setCustomMode(true)}
                        className="group relative flex w-full flex-col justify-between overflow-hidden rounded-xl bg-card border border-dashed border-primary/40 p-6 text-left transition-all active:scale-[0.98] active:bg-primary/10"
                    >
                        <div className="flex w-full items-start justify-between">
                            <div className="flex flex-col gap-1 z-10">
                                <span className="text-main text-5xl font-bold tracking-tighter leading-none">
                                    Custom
                                </span>
                                <span className="text-secondary text-base font-semibold tracking-widest uppercase">
                                    Single Table
                                </span>
                            </div>
                            <span className="material-symbols-outlined text-primary/60" style={{ fontSize: 24 }}>
                                add
                            </span>
                        </div>
                    </button>
                )}
            </main>

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
