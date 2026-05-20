import { useState, useEffect } from 'react';
import { db, type Session } from '../services/database';

interface HistoryScreenProps {
    onBack: () => void;
}

const MODE_FILTERS = ['all', 'addition', 'subtraction', 'multiplication', 'division', 'mixed', 'multiplication-table', 'square', 'fraction', 'percentage', 'square-root', 'approximation', 'number-series', 'ratio', 'chain-calculation'];

export default function HistoryScreen({ onBack }: HistoryScreenProps) {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
    const [modeFilter, setModeFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const s = await db.getSessions(100);
            setSessions(s);
            setLoading(false);
        }
        load();
    }, []);

    useEffect(() => {
        let filtered = modeFilter === 'all'
            ? sessions
            : sessions.filter(s => s.mode === modeFilter);
        setFilteredSessions(filtered);
    }, [sessions, modeFilter]);

    return (
        <div className="flex flex-col h-full bg-surface">
            <header className="shrink-0 pt-6 pb-3 px-6 flex items-center justify-between sticky top-0 z-20 bg-header backdrop-blur-sm border-b border-nav">
                <button onClick={onBack} className="flex items-center justify-center p-2 -ml-2 rounded-full text-secondary">
                    <span className="material-symbols-outlined text-2xl">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold tracking-tight text-main">History</h1>
                <div className="w-10" />
            </header>

            <main className="flex-1 overflow-y-auto px-6 pb-8">
                <div className="max-w-lg mx-auto pt-4">
                    <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
                        {MODE_FILTERS.map(f => (
                            <button
                                key={f}
                                onClick={() => setModeFilter(f)}
                                className={`shrink-0 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-full border transition-all ${
                                    modeFilter === f
                                        ? 'bg-primary text-on-primary border-primary'
                                        : 'bg-card text-secondary border-card'
                                }`}
                            >
                                {f === 'all' ? 'All' : f.replace('-', ' ')}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <span className="material-symbols-outlined text-primary animate-spin" style={{ fontSize: 36 }}>refresh</span>
                        </div>
                    ) : filteredSessions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-secondary">
                            <span className="material-symbols-outlined text-5xl mb-3 opacity-30">history</span>
                            <p className="text-sm font-medium">No sessions found</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {filteredSessions.map((session) => {
                                const accuracy = session.totalQuestions > 0
                                    ? (session.correct / session.totalQuestions) * 100
                                    : 0;
                                return (
                                    <div key={session.id} className="bg-card border border-card rounded-2xl p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-bold text-main capitalize">
                                                    {session.mode.replace('-', ' ')}
                                                </p>
                                                <p className="text-[10px] text-secondary mt-0.5">
                                                    {new Date(session.date).toLocaleDateString('en-US', {
                                                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-black text-main">
                                                    {session.correct}<span className="text-xs text-secondary font-medium">/{session.totalQuestions}</span>
                                                </p>
                                                <p className={`text-[10px] font-bold ${accuracy >= 80 ? 'text-correct' : accuracy >= 50 ? 'text-primary' : 'text-incorrect'}`}>
                                                    {accuracy.toFixed(0)}%
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 mt-2 text-[10px] text-secondary">
                                            <span>{(session.avgTimeMs / 1000).toFixed(1)}s avg</span>
                                            <span>{session.difficulty}</span>
                                            <span>{(session.duration / 1000).toFixed(0)}s total</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}