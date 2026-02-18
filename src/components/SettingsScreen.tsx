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
        onSave({ totalQuestions, timeLimit });
        onBack();
    };

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
                    Settings
                </h1>
            </div>

            <main className="flex-1 px-5 pb-32 flex flex-col gap-6 overflow-y-auto pt-4">
                {/* Session Limits */}
                <section>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-secondary mb-3 px-1 ml-1">
                        Session Limits
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        {/* Question Count */}
                        <div className="bg-input-card border border-card rounded-2xl p-5 flex flex-col justify-between h-32 relative group">
                            <label className="text-sm text-secondary font-semibold tracking-tight">Question Count</label>
                            <div className="flex items-center justify-between mt-auto w-full">
                                <span className="text-4xl font-bold text-input-val leading-none">{totalQuestions}</span>
                                <div className="text-primary/30 group-hover:text-primary/50 transition-colors">
                                    <span className="material-symbols-outlined text-3xl">format_list_numbered</span>
                                </div>
                            </div>
                        </div>
                        {/* Time Limit */}
                        <div className="bg-input-card border border-card rounded-2xl p-5 flex flex-col justify-between h-32 relative group">
                            <label className="text-sm text-secondary font-semibold tracking-tight">Time Limit</label>
                            <div className="flex items-center justify-between mt-auto w-full">
                                <span className="text-4xl font-bold text-input-val leading-none">{timeLimit}</span>
                                <div className="flex flex-col items-center justify-end">
                                    <div className="text-primary/30 group-hover:text-primary/50 transition-colors">
                                        <span className="material-symbols-outlined text-3xl">timer</span>
                                    </div>
                                    <span className="text-xs font-bold text-primary/40 -mt-1">sec</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Questions slider */}
                <section>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-secondary mb-3 px-1 ml-1">
                        Questions per Session
                    </h3>
                    <div className="bg-card border border-card rounded-2xl p-6">
                        <div className="flex justify-between text-sm text-secondary mb-4">
                            <span>1</span>
                            <span className="font-bold text-primary">{totalQuestions}</span>
                            <span>50</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="50"
                            value={totalQuestions}
                            onChange={(e) => setTotalQuestions(parseInt(e.target.value))}
                            className="w-full"
                        />
                    </div>
                </section>

                {/* Timer slider */}
                <section>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-secondary mb-3 px-1 ml-1">
                        Time per Question
                    </h3>
                    <div className="bg-card border border-card rounded-2xl p-6">
                        <div className="flex justify-between text-sm text-secondary mb-4">
                            <span>5s</span>
                            <span className="font-bold text-primary">{timeLimit}s</span>
                            <span>60s</span>
                        </div>
                        <input
                            type="range"
                            min="5"
                            max="60"
                            value={timeLimit}
                            onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                            className="w-full"
                        />
                    </div>
                </section>
            </main>

            {/* Fixed bottom CTA */}
            <div className="fixed bottom-0 left-0 w-full bg-header backdrop-blur-xl p-5 pb-10 z-20">
                <button
                    onClick={handleSave}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-lg py-4 px-6 rounded-2xl shadow-lg shadow-primary/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    <span>Save Settings</span>
                </button>
            </div>
        </div>
    );
}
