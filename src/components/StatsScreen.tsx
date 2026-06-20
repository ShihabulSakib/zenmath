import { useEffect, useMemo, useState } from 'react';
import type { StatsData, RecentPerformance } from '../hooks/useStats';
import { useToast } from '../hooks/useToast';

interface StatsScreenProps {
    dailyGoal?: number;
    stats: {
        stats: StatsData | null;
        recentPerformance: RecentPerformance[];
        sessions: { date: string; totalQuestions: number }[];
        loading: boolean;
        refreshStats: () => void;
        clearAllData: () => Promise<void>;
        exportBackup: () => Promise<string>;
        importBackup: (backupStr: string) => Promise<void>;
    };
}

function ActivityCalendar({ sessions, goal }: { sessions: { date: string; totalQuestions: number }[]; goal: number }) {
    const [monthIndex, setMonthIndex] = useState(0);

    const activityByDate = useMemo(() => {
        const map: Record<string, number> = {};
        sessions.forEach(s => {
            const d = s.date.split('T')[0];
            map[d] = (map[d] || 0) + 1;
        });
        return map;
    }, [sessions]);

    const now = new Date();
    const targetDate = new Date(now.getFullYear(), now.getMonth() - monthIndex, 1);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const label = targetDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: ({ day: number; date: string } | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        cells.push({ day: d, date: dateStr });
    }

    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="bg-card border border-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-secondary opacity-60">Monthly Activity</h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setMonthIndex(Math.min(monthIndex + 1, 2))}
                        disabled={monthIndex >= 2}
                        className="flex items-center justify-center w-6 h-6 rounded-full text-secondary disabled:opacity-20"
                    >
                        <span className="material-symbols-outlined text-sm">chevron_left</span>
                    </button>
                    <button
                        onClick={() => setMonthIndex(Math.max(monthIndex - 1, 0))}
                        disabled={monthIndex <= 0}
                        className="flex items-center justify-center w-6 h-6 rounded-full text-secondary disabled:opacity-20"
                    >
                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                </div>
            </div>
            <p className="text-[10px] font-bold text-secondary mb-2">{label}</p>
            <div className="grid grid-cols-7 gap-1">
                {['S','M','T','W','T','F','S'].map(d => (
                    <span key={d} className="text-[8px] text-center text-secondary font-mono">{d}</span>
                ))}
                {cells.map((cell, i) =>
                    cell ? (
                        <div
                            key={i}
                            title={`${cell.date}: ${activityByDate[cell.date] || 0} sessions`}
                            className={`aspect-square rounded-sm text-[8px] flex items-center justify-center font-mono ${
                                                cell.date === today ? 'ring-1 ring-primary' : ''
                                            } ${
                                                activityByDate[cell.date] >= goal ? 'bg-correct text-black' :
                                                activityByDate[cell.date] ? 'bg-primary/20 text-secondary' :
                                                cell.date > today ? 'bg-surface text-future' :
                                                'bg-surface text-muted'
                                            }`}
                        >
                            {cell.day}
                        </div>
                    ) : (
                        <div key={i} />
                    )
                )}
            </div>
            <div className="flex items-center gap-3 mt-3 text-[9px] text-secondary">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-surface" /> None</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-primary/20" /> Practiced</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-correct" /> Met goal</span>
            </div>
        </div>
    );
}

export default function StatsScreen({ dailyGoal = 10, stats }: StatsScreenProps) {
    const { stats: data, recentPerformance, sessions, loading, refreshStats, clearAllData, exportBackup, importBackup } = stats;
    const { showToast } = useToast();
    const [isPersisted, setIsPersisted] = useState<boolean | null>(null);

    useEffect(() => {
        refreshStats();
        
        if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persisted) {
            navigator.storage.persisted().then(setIsPersisted).catch(() => setIsPersisted(false));
        } else {
            setIsPersisted(false);
        }
    }, [refreshStats]);

    const handleBackup = async () => {
        try {
            const dataStr = await exportBackup();
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `zenmath-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('Backup successfully exported!');
        } catch (error) {
            console.error('Failed to export backup:', error);
            showToast('Failed to export backup.');
        }
    };

    const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const confirmRestore = window.confirm(
            'Importing this backup will overwrite all current stats, settings, and sessions. Are you sure you want to proceed?'
        );
        if (!confirmRestore) {
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                await importBackup(text);
                showToast('Backup successfully imported!');
            } catch (error: any) {
                console.error('Failed to import backup:', error);
                showToast(error?.message || 'Failed to import backup.');
            } finally {
                event.target.value = '';
            }
        };
        reader.readAsText(file);
    };

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
            <header className="shrink-0 pt-6 pb-3 px-6 flex items-center justify-center sticky top-0 z-20 bg-header backdrop-blur-sm border-b border-nav">
                <h1 className="text-xl font-bold tracking-tight text-main">Statistics</h1>
            </header>

            <main className="flex-1 overflow-y-auto px-6 pb-32">
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

                    {sessions.length > 0 && (
                        <ActivityCalendar sessions={sessions} goal={dailyGoal} />
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

                    <div className="bg-card border border-card rounded-2xl p-5 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase tracking-widest text-secondary opacity-60">Backup & Protection</h3>
                            <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${isPersisted ? 'bg-correct' : 'bg-primary'}`} />
                                <span className={`text-[10px] font-black uppercase tracking-wider ${isPersisted ? 'text-correct' : 'text-primary'}`}>
                                    {isPersisted ? 'Protected' : 'Standard'}
                                </span>
                            </div>
                        </div>

                        <p className="text-[11px] text-secondary leading-relaxed">
                            {isPersisted 
                                ? "Data Protection is active. Chrome will safeguard your statistics and settings from automatic cache-clearing sweeps." 
                                : "Chrome currently treats storage as temporary (it may be cleared during cache cleans). To enable automatic protection, please Install the ZenMath PWA (via the button in your browser address bar) or bookmark the page. Chrome grants this silently once you interact with the app."}
                        </p>

                        <div className="grid grid-cols-2 gap-3 mt-1">
                            <button
                                onClick={handleBackup}
                                className="flex items-center justify-center gap-2 h-11 bg-primary/10 border border-primary/20 text-primary text-xs font-bold rounded-xl hover:bg-primary/20 transition-all cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-sm">download</span>
                                <span>Export Backup</span>
                            </button>
                            <label
                                className="flex items-center justify-center gap-2 h-11 bg-primary/10 border border-primary/20 text-primary text-xs font-bold rounded-xl hover:bg-primary/20 transition-all cursor-pointer text-center"
                            >
                                <span className="material-symbols-outlined text-sm">upload</span>
                                <span>Import Backup</span>
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleRestore}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>

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
