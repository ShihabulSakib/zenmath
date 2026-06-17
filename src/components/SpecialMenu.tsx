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
    const [customStart, setCustomStart] = useState('7');
    const [customEnd, setCustomEnd] = useState('9');
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
                        <span className="material-symbols-outlined text-main" style={{ fontSize: 24 }}>
                            arrow_back
                        </span>
                    </button>
                    <div className="flex-1" />
                    <div className="size-10" />
                </header>

                <div className="px-6 pt-4 pb-6">
                    <h1 className="text-main text-2xl font-bold leading-tight tracking-tight uppercase">
                        {mode === 'factor-finding' ? 'Custom Factor Range' : 'Custom Table Range'}
                    </h1>
                    <p className="text-muted text-xs font-semibold mt-1 uppercase tracking-[0.2em]">
                        Enter table numbers (1–100)
                    </p>
                </div>

                <main className="flex-1 px-6 flex flex-col gap-8">
                    <div className="bg-card border border-card rounded-3xl p-6 shadow-sm">
                        <div className="flex flex-col items-center gap-6">
                            <span className="text-[10px] text-secondary font-black uppercase tracking-widest opacity-60">
                                Practice tables from
                            </span>
                            
                            <div className="flex items-center justify-center gap-4 w-full">
                                <div className="flex flex-col items-center gap-2">
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={customStart}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const n = parseInt(val, 10);
                                            if (val === '') {
                                                setCustomStart('');
                                            } else if (!isNaN(n) && n >= 1 && n <= 100) {
                                                setCustomStart(val);
                                            }
                                        }}
                                        className="w-20 p-3 text-3xl font-black text-center bg-surface border border-card rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-main"
                                    />
                                    <span className="text-[9px] text-muted font-bold uppercase tracking-tighter">Start</span>
                                </div>

                                <span className="text-2xl font-black text-main opacity-20">—</span>

                                <div className="flex flex-col items-center gap-2">
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={customEnd}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const n = parseInt(val, 10);
                                            if (val === '') {
                                                setCustomEnd('');
                                            } else if (!isNaN(n) && n >= 1 && n <= 100) {
                                                setCustomEnd(val);
                                            }
                                        }}
                                        className="w-20 p-3 text-3xl font-black text-center bg-surface border border-card rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-main"
                                    />
                                    <span className="text-[9px] text-muted font-bold uppercase tracking-tighter">End</span>
                                </div>
                            </div>
                        </div>
                        
                        {customStart && customEnd && (
                            <p className="text-center text-secondary text-xs mt-6 font-medium uppercase tracking-wide opacity-80">
                                {mode === 'multiplication-table' 
                                    ? `Tables ${customStart} to ${customEnd} (× 1-12)`
                                    : `Factors from Tables ${customStart} to ${customEnd}`
                                }
                            </p>
                        )}
                    </div>

                    <button
                        onClick={() => {
                            const s = parseInt(customStart, 10);
                            const e = parseInt(customEnd, 10);
                            if (!isNaN(s) && !isNaN(e)) {
                                const min = Math.min(s, e);
                                const max = Math.max(s, e);
                                onSelect([min, max]);
                            }
                        }}
                        disabled={!customStart || !customEnd || isNaN(parseInt(customStart, 10)) || isNaN(parseInt(customEnd, 10))}
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
                    <span className="material-symbols-outlined text-main" style={{ fontSize: 24 }}>
                        arrow_back
                    </span>
                </button>
                <div className="flex-1" />
                <div className="size-10" />
            </header>

            <div className="px-6 pt-4 pb-6">
                <h1 className="text-main text-2xl font-bold leading-tight tracking-tight uppercase">
                    Select Range
                </h1>
                <p className="text-muted text-xs font-semibold mt-1 uppercase tracking-[0.2em]">
                    {title}
                </p>
            </div>

            <main className="flex-1 px-6 flex flex-col gap-4 pb-8">
                {ranges.map(({ range, label, subtitle }) => (
                    <button
                        key={label}
                        onClick={() => onSelect(range)}
                        className="group relative flex w-full flex-col justify-between overflow-hidden rounded-xl bg-card border border-card p-5 text-left transition-all active:scale-[0.98] active:bg-primary active:border-primary"
                    >
                        <div className="flex w-full items-start justify-between">
                            <div className="flex flex-col gap-0.5 z-10">
                                <span className="text-main text-3xl font-bold tracking-tighter leading-none group-active:text-on-primary">
                                    {label}
                                </span>
                                <span className="text-secondary text-xs font-semibold tracking-widest uppercase group-active:text-on-primary/90">
                                    {subtitle}
                                </span>
                            </div>
                            <div className="size-2 rounded-full bg-primary opacity-0 group-active:bg-on-primary group-active:opacity-100" />
                        </div>
                    </button>
                ))}

                {isTablesOrFactors && (
                    <button
                        onClick={() => setCustomMode(true)}
                        className="group relative flex w-full flex-col justify-between overflow-hidden rounded-xl bg-card border border-dashed border-primary/40 p-5 text-left transition-all active:scale-[0.98] active:bg-primary/10"
                    >
                        <div className="flex w-full items-start justify-between">
                            <div className="flex flex-col gap-0.5 z-10">
                                <span className="text-main text-3xl font-bold tracking-tighter leading-none">
                                    Custom
                                </span>
                                <span className="text-secondary text-xs font-semibold tracking-widest uppercase">
                                    Range of Tables
                                </span>
                            </div>
                            <span className="material-symbols-outlined text-primary/60" style={{ fontSize: 20 }}>
                                add
                            </span>
                        </div>
                    </button>
                )}
            </main>
        </div>
    );
}
