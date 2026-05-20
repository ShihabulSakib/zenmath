import { useEffect } from 'react';
import type { StatsData, RecentPerformance } from '../hooks/useStats';

interface StatsScreenProps {
    onBack: () => void;
    stats: {
        stats: StatsData | null;
        recentPerformance: RecentPerformance[];
        loading: boolean;
        refreshStats: () => void;
        clearAllData: () => Promise<void>;
    };
}

export default function StatsScreen({ onBack, stats }: StatsScreenProps) {
    const { stats: data, recentPerformance, loading, refreshStats, clearAllData } = stats;

    useEffect(() => {
        refreshStats();
    }, [refreshStats]);

    if (loading || !data) {
        return (
            <div className="flex flex-col h-full bg-surface items-center justify-center">
                <span className="material-symbols-outlined text-primary animate-spin" style={{ fontSize: 48 }}>refresh</span>
                <p className="text-secondary mt-4">Loading stats...</p>
            </div>
        );
    }

    const bestMode = Object.entries(data.modes).sort(([, a], [, b]) => b.accuracy - a.accuracy)[0];

    return (
        <div className="flex flex-col h-full bg-surface">
            <header className="shrink-0 pt-6 pb-3 px-6 flex items-center justify-between sticky top-0 z-20 bg-header backdrop-blur-sm border-b border-nav">
                <button onClick={onBack} className="flex items-center justify-center p-2 -ml-2 rounded-full text-secondary">
                    <span className="material-symbols-outlined text-2xl">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold tracking-tight text-main">Statistics</h1>
                <div className="w-10" />
            </header>

            <main className="flex-1 overflow-y-auto px-6 pb-8">
                <div className="max-w-lg mx-auto flex flex-col gap-6 pt-6">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col items-center justify-center p-5 bg-card border border-card rounded-2xl">
                            <p className="text-secondary text-[9px] font-black uppercase tracking-widest opacity-60">Sessions</p>
                            <p className="text-3xl font-black text-main tracking-tight mt-1">{data.totalSessions}</p>
                        </div>
                        <div className="flex flex-col items-center justify-center p-5 bg-card border border-card rounded-2xl">
                            <p className="text-secondary text-[9px] font-black uppercase tracking-widest opacity-60">Questions</p>
                            <p className="text-3xl font-black text-main tracking-tight mt-1">{data.totalQuestions}</p>
                        </div>
                        <div className="flex flex-col items-center justify-center p-5 bg-card border border-card rounded-2xl">
                            <p className="text-secondary text-[9px] font-black uppercase tracking-widest opacity-60">Accuracy</p>
                            <p className="text-3xl font-black text-main tracking-tight mt-1">{data.avgAccuracy.toFixed(0)}%</p>
                        </div>
                        <div className="flex flex-col items-center justify-center p-5 bg-card border border-card rounded-2xl">
                            <p className="text-secondary text-[9px] font-black uppercase tracking-widest opacity-60">Streak</p>
                            <p className="text-3xl font-black text-main tracking-tight mt-1">{data.streakDays}d</p>
                        </div>
                    </div>

                    {recentPerformance.length > 0 && (
                        <div className="bg-card border border-card rounded-2xl p-5">
                            <h3 className="text-xs font-black uppercase tracking-widest text-secondary opacity-60 mb-3">Last 7 Days</h3>
                            <div className="flex items-end gap-2 h-24">
                                {recentPerformance.slice(-7).map((day) => {
                                    const height = Math.max(8, (day.accuracy / 100) * 80);
                                    return (
                                        <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                                            <span className="text-[8px] font-mono text-secondary">{day.count}</span>
                                            <div
                                                className="w-full bg-primary rounded-sm transition-all"
                                                style={{ height: `${height}%` }}
                                            />
                                            <span className="text-[8px] font-mono text-secondary">
                                                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {Object.keys(data.modes).length > 0 && (
                        <div className="bg-card border border-card rounded-2xl p-5">
                            <h3 className="text-xs font-black uppercase tracking-widest text-secondary opacity-60 mb-3">Mode Performance</h3>
                            <div className="flex flex-col gap-2">
                                {Object.entries(data.modes)
                                    .sort(([, a], [, b]) => b.sessions - a.sessions)
                                    .map(([mode, m]) => (
                                        <div key={mode} className="flex items-center justify-between py-2 border-b border-nav last:border-b-0">
                                            <div>
                                                <p className="text-sm font-semibold text-main capitalize">{mode.replace('-', ' ')}</p>
                                                <p className="text-[10px] text-secondary">{m.sessions} sessions</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-sm font-black ${m.accuracy >= 80 ? 'text-correct' : m.accuracy >= 50 ? 'text-primary' : 'text-incorrect'}`}>
                                                    {m.accuracy.toFixed(0)}%
                                                </p>
                                                <p className="text-[10px] text-secondary">{(m.avgTime / 1000).toFixed(1)}s avg</p>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {bestMode && (
                        <div className="bg-card border border-card rounded-2xl p-5">
                            <h3 className="text-xs font-black uppercase tracking-widest text-secondary opacity-60 mb-2">Best Mode</h3>
                            <p className="text-lg font-bold text-main capitalize">{bestMode[0].replace('-', ' ')}</p>
                            <p className="text-xs text-secondary">{bestMode[1].accuracy.toFixed(0)}% accuracy across {bestMode[1].sessions} sessions</p>
                        </div>
                    )}

                    <button
                        onClick={async () => {
                            if (window.confirm('Clear all stats data? This cannot be undone.')) {
                                await clearAllData();
                            }
                        }}
                        className="w-full flex items-center justify-center gap-2 h-12 bg-surface border border-card text-incorrect text-sm font-bold rounded-xl mt-2"
                    >
                        <span className="material-symbols-outlined text-base">delete</span>
                        <span>Clear All Data</span>
                    </button>
                </div>
            </main>
        </div>
    );
}