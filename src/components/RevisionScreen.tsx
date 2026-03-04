import { useState } from 'react';
import { ChevronDown, Grid3X3, Hash, Percent } from 'lucide-react';

interface RevisionScreenProps {
    onBack: () => void;
}

type TabId = 'tables' | 'squares' | 'fractions';

const TABS: { id: TabId; label: string; icon: typeof Grid3X3 }[] = [
    { id: 'tables', label: 'Tables', icon: Grid3X3 },
    { id: 'squares', label: 'Squares', icon: Hash },
    { id: 'fractions', label: 'Fractions', icon: Percent },
];

// ─── Data ────────────────────────────────────────────────────
const COMMON_FRACTIONS = [
    { fraction: '1/2', decimal: '0.5' },
    { fraction: '1/3', decimal: '0.333' },
    { fraction: '1/4', decimal: '0.25' },
    { fraction: '1/5', decimal: '0.2' },
    { fraction: '1/6', decimal: '0.167' },
    { fraction: '1/7', decimal: '0.143' },
    { fraction: '1/8', decimal: '0.125' },
    { fraction: '1/9', decimal: '0.111' },
    { fraction: '1/10', decimal: '0.1' },
    { fraction: '2/3', decimal: '0.667' },
    { fraction: '2/4', decimal: '0.5' },
    { fraction: '2/5', decimal: '0.4' },
    { fraction: '2/6', decimal: '0.333' },
    { fraction: '2/7', decimal: '0.286' },
    { fraction: '2/8', decimal: '0.25' },
    { fraction: '2/9', decimal: '0.222' },
    { fraction: '2/10', decimal: '0.2' },
    { fraction: '3/4', decimal: '0.75' },
    { fraction: '3/5', decimal: '0.6' },
    { fraction: '3/6', decimal: '0.5' },
    { fraction: '3/7', decimal: '0.429' },
    { fraction: '3/8', decimal: '0.375' },
    { fraction: '3/9', decimal: '0.333' },
    { fraction: '3/10', decimal: '0.3' },
    { fraction: '4/5', decimal: '0.8' },
    { fraction: '4/6', decimal: '0.667' },
    { fraction: '4/7', decimal: '0.571' },
    { fraction: '4/8', decimal: '0.5' },
    { fraction: '4/9', decimal: '0.444' },
    { fraction: '4/10', decimal: '0.4' },
    { fraction: '5/6', decimal: '0.833' },
    { fraction: '5/7', decimal: '0.714' },
    { fraction: '5/8', decimal: '0.625' },
    { fraction: '5/9', decimal: '0.556' },
    { fraction: '5/10', decimal: '0.5' },
    { fraction: '6/7', decimal: '0.857' },
    { fraction: '6/8', decimal: '0.75' },
    { fraction: '6/9', decimal: '0.667' },
    { fraction: '6/10', decimal: '0.6' },
    { fraction: '7/8', decimal: '0.875' },
    { fraction: '7/9', decimal: '0.778' },
    { fraction: '7/10', decimal: '0.7' },
    { fraction: '8/9', decimal: '0.889' },
    { fraction: '8/10', decimal: '0.8' },
    { fraction: '9/10', decimal: '0.9' }
];

// ─── Sub-components ──────────────────────────────────────────

function MultiplicationTables() {
    const [openTable, setOpenTable] = useState<number | null>(null);

    return (
        <div className="flex flex-col gap-3 animate-scale-in">
            {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                <div key={n} className="bg-card border border-card rounded-xl overflow-hidden">
                    <button
                        onClick={() => setOpenTable(prev => (prev === n ? null : n))}
                        className="w-full flex items-center justify-between px-4 py-4"
                    >
                        <span className="text-base font-bold text-main">{n} × Table</span>
                        <ChevronDown
                            size={18}
                            className={`text-secondary transition-transform duration-200 ${openTable === n ? 'rotate-180' : ''
                                }`}
                        />
                    </button>
                    {openTable === n && (
                        <div className="px-5 pb-4 animate-scale-in">
                            <div className="flex flex-col gap-1 mt-1">
                                {Array.from({ length: 12 }, (_, j) => j + 1).map(m => (
                                    <div key={m} className={`font-mono text-sm py-1 flex items-center ${m % 2 === 0 ? 'opacity-90' : ''}`}>
                                        <span className="text-main w-8 text-right font-bold">{n}</span>
                                        <span className="text-muted mx-2">×</span>
                                        <span className="text-main w-8 text-right font-bold">{m}</span>
                                        <span className="text-muted mx-2">=</span>
                                        <span className="text-primary font-black text-base">{n * m}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

function SquareNumbers() {
    return (
        <div className="animate-scale-in">
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {Array.from({ length: 25 }, (_, i) => i + 1).map(n => (
                    <div
                        key={n}
                        className="bg-card border border-card rounded-2xl p-3 flex flex-col items-center justify-center gap-0.5"
                    >
                        <span className="font-mono text-base font-bold text-main">
                            {n}<sup className="text-[10px]">2</sup>
                        </span>
                        <span className="font-mono text-xs text-primary font-bold">
                            = {n * n}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function CommonFractions() {
    return (
        <div className="animate-scale-in">
            <div className="bg-card border border-card rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-2 px-5 py-3 border-b border-card">
                    <span className="text-[10px] font-black uppercase tracking-widest text-secondary opacity-60">Fraction</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-secondary opacity-60 text-right">Decimal</span>
                </div>
                {/* Rows */}
                {COMMON_FRACTIONS.map((f, i) => (
                    <div
                        key={f.fraction}
                        className={`grid grid-cols-2 px-5 py-2.5 items-center ${i % 2 === 1 ? 'bg-surface/30' : ''
                            } ${i < COMMON_FRACTIONS.length - 1 ? 'border-b border-card/50' : ''}`}
                    >
                        <span className="font-mono text-sm font-bold text-main">{f.fraction}</span>
                        <span className="font-mono text-sm text-secondary text-right">{f.decimal}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────

export default function RevisionScreen({ onBack }: RevisionScreenProps) {
    const [activeTab, setActiveTab] = useState<TabId>('tables');

    return (
        <div className="flex flex-col h-full animate-fade-in">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-header backdrop-blur-sm px-4 pt-6 pb-0 flex flex-col">
                <div className="flex items-center justify-between pb-3">
                    <button
                        onClick={onBack}
                        className="flex items-center justify-center p-2 -ml-2 rounded-full"
                    >
                        <span className="material-symbols-outlined text-main" style={{ fontSize: 24 }}>arrow_back_ios_new</span>
                    </button>
                    <h1 className="text-xl font-bold tracking-tight text-center flex-1 pr-10 text-main">
                        Revision
                    </h1>
                </div>

                {/* Tab bar */}
                <div className="flex gap-1 bg-card/50 rounded-xl p-1 mx-1">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${isActive
                                    ? 'bg-primary text-on-primary'
                                    : 'text-secondary'
                                    }`}
                            >
                                <Icon size={14} className={isActive ? "text-on-primary" : ""} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab content */}
            <main className="flex-1 px-5 pb-12 overflow-y-auto pt-5">
                {activeTab === 'tables' && <MultiplicationTables />}
                {activeTab === 'squares' && <SquareNumbers />}
                {activeTab === 'fractions' && <CommonFractions />}
            </main>
        </div>
    );
}
