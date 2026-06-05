import { useState, useEffect, useCallback } from 'react';
import { db, type Session, type QuestionRecord } from '../services/database';

export interface StatsData {
    totalSessions: number;
    totalQuestions: number;
    totalCorrect: number;
    avgAccuracy: number;
    avgTimeMs: number;
    streakDays: number;
    modes: Record<string, { sessions: number; accuracy: number; avgTime: number }>;
}

export interface RecentPerformance {
    date: string;
    accuracy: number;
    count: number;
}

export function useStats() {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [recentPerformance, setRecentPerformance] = useState<RecentPerformance[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshStats = useCallback(async () => {
        setLoading(true);
        try {
            const [statsData, recent, sessionList] = await Promise.all([
                db.getOverallStats(),
                db.getRecentPerformance(30),
                db.getSessions(500),
            ]);
            setStats(statsData);
            setRecentPerformance(recent);
            setSessions(sessionList);
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshStats();
    }, [refreshStats]);

    const saveSession = useCallback(async (
        mode: string,
        totalQuestions: number,
        correct: number,
        avgTimeMs: number,
        difficulty: string,
        questions: QuestionRecord[]
    ) => {
        const session: Session = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            mode,
            totalQuestions,
            correct,
            avgTimeMs,
            difficulty,
            duration: avgTimeMs * totalQuestions,
        };

        await db.addSession(session);
        await db.addQuestions(questions.map(q => ({ ...q, sessionId: session.id })));
        await refreshStats();
    }, [refreshStats]);

    const getSessionsByMode = useCallback(async (mode: string) => {
        return db.getSessionsByMode(mode);
    }, []);

    const getSessionsByDateRange = useCallback(async (start: string, end: string) => {
        return db.getSessionsByDateRange(start, end);
    }, []);

    const getQuestionsBySession = useCallback(async (sessionId: string) => {
        return db.getQuestionsBySession(sessionId);
    }, []);

    const clearAllData = useCallback(async () => {
        await db.clearAllData();
        await refreshStats();
    }, [refreshStats]);

    return {
        stats,
        recentPerformance,
        sessions,
        loading,
        refreshStats,
        saveSession,
        getSessionsByMode,
        getSessionsByDateRange,
        getQuestionsBySession,
        clearAllData,
    };
}