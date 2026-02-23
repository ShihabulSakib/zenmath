import { useState } from 'react';
import type { GameSettings } from '../hooks/useGameLogic';

interface SettingsScreenProps {
    settings: GameSettings;
    onSave: (settings: GameSettings) => void;
    onBack: () => void;
}

export default function SettingsScreen({ settings, onSave, onBack }: SettingsScreenProps) {
    const [totalQuestions, setTotalQuestions] = useState(settings.totalQuestions);
    const [timeLimit, setTimeLimit] = useState(settings.timeLimit);

    const handleSave = () => {
        onSave({ ...settings, totalQuestions, timeLimit });
        onBack();
    };

    return (
        <div className="flex flex-col h-full animate-fade-in">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-header backdrop-blur-sm px-4 pt-6 pb-2 flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center justify-center p-2 -ml-2 rounded-full"
                >
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: 24 }}>arrow_back_ios_new</span>
                </button>
                <h1 className="text-xl font-bold tracking-tight text-center flex-1 pr-10 text-main">
                    Settings
                </h1>
            </div>

            <main className="flex-1 px-5 pb-32 flex flex-col gap-6 overflow-y-auto pt-4">
                {/* Session Limits */}
                <section>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-secondary mb-4 px-1 ml-1 opacity-70">
                        Session Configuration
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        {/* Question Count */}
                        <div className="bg-card border border-card rounded-3xl p-5 flex flex-col justify-between h-36 shadow-sm relative group overflow-hidden">
                            <label className="text-xs text-secondary font-bold uppercase tracking-wider opacity-60">Count</label>
                            <div className="flex items-end justify-between mt-auto w-full relative z-10">
                                <span className="text-5xl font-black text-main leading-none tracking-tighter">{totalQuestions}</span>
                                <div className="text-primary/20">
                                    <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>format_list_numbered</span>
                                </div>
                            </div>
                            <div className="absolute -bottom-4 -right-4 size-20 bg-primary/5 rounded-full blur-2xl" />
                        </div>
                        {/* Time Limit */}
                        <div className="bg-card border border-card rounded-3xl p-5 flex flex-col justify-between h-36 shadow-sm relative group overflow-hidden">
                            <label className="text-xs text-secondary font-bold uppercase tracking-wider opacity-60">Time</label>
                            <div className="flex items-end justify-between mt-auto w-full relative z-10">
                                <span className="text-5xl font-black text-main leading-none tracking-tighter">{timeLimit}</span>
                                <div className="flex flex-col items-center justify-end">
                                    <div className="text-primary/20">
                                        <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>timer</span>
                                    </div>
                                    <span className="text-[9px] font-black text-primary/40 uppercase tracking-widest -mt-1">sec</span>
                                </div>
                            </div>
                            <div className="absolute -bottom-4 -right-4 size-20 bg-primary/5 rounded-full blur-2xl" />
                        </div>
                    </div>
                </section>

                {/* Questions slider */}
                <section>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-secondary mb-4 px-1 ml-1 opacity-70">
                        Questions per Session
                    </h3>
                    <div className="bg-card border border-card rounded-3xl p-6 pb-8 shadow-sm">
                        <div className="flex justify-between text-[10px] font-black text-secondary mb-8 px-2 uppercase tracking-widest opacity-60">
                            <span>1</span>
                            <span className="text-sm text-primary font-black scale-125">{totalQuestions}</span>
                            <span>50</span>
                        </div>
                        <div className="px-2">
                            <input
                                type="range"
                                min="1"
                                max="50"
                                value={totalQuestions}
                                onChange={(e) => setTotalQuestions(parseInt(e.target.value))}
                                style={{ "--range-progress": `${((totalQuestions - 1) / 49) * 100}%` } as React.CSSProperties}
                            />
                        </div>
                    </div>
                </section>

                {/* Timer slider */}
                <section>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-secondary mb-4 px-1 ml-1 opacity-70">
                        Time per Question
                    </h3>
                    <div className="bg-card border border-card rounded-3xl p-6 pb-8 shadow-sm">
                        <div className="flex justify-between text-[10px] font-black text-secondary mb-8 px-2 uppercase tracking-widest opacity-60">
                            <span>5s</span>
                            <span className="text-sm text-primary font-black scale-125">{timeLimit}s</span>
                            <span>60s</span>
                        </div>
                        <div className="px-2">
                            <input
                                type="range"
                                min="6"
                                max="60"
                                value={timeLimit}
                                onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                                style={{ "--range-progress": `${((timeLimit - 6) / 54) * 100}%` } as React.CSSProperties}
                            />
                        </div>
                    </div>
                </section>
            </main>

            {/* Fixed bottom CTA */}
            <div className="fixed bottom-0 left-0 w-full bg-header backdrop-blur-xl p-5 pb-10 z-20">
                <button
                    onClick={handleSave}
                    className="w-full bg-primary text-white font-bold text-lg py-4 px-6 rounded-2xl shadow-lg shadow-primary/30 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    <span>Save Settings</span>
                </button>
            </div>
        </div>
    );
}
