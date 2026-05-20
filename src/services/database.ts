const DB_NAME = 'zenmath-db';
const DB_VERSION = 1;

export interface Session {
    id: string;
    date: string;
    mode: string;
    totalQuestions: number;
    correct: number;
    avgTimeMs: number;
    difficulty: string;
    duration: number;
}

export interface QuestionRecord {
    id?: number;
    sessionId?: string;
    num1: number;
    num2: number;
    operation: string;
    correctAnswer: number;
    userAnswer: number | null;
    timeMs: number;
    isCorrect: boolean;
    mode: string;
    difficulty: string;
}

export interface DailyStats {
    date: string;
    totalSessions: number;
    totalQuestions: number;
    totalCorrect: number;
    totalTimeMs: number;
    modesPracticed: string[];
}

class ZenMathDB {
    private db: IDBDatabase | null = null;
    private initPromise: Promise<void> | null = null;

    async init(): Promise<void> {
        if (this.db) return;
        if (this.initPromise) return this.initPromise;

        this.initPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                if (!db.objectStoreNames.contains('sessions')) {
                    const sessionsStore = db.createObjectStore('sessions', { keyPath: 'id' });
                    sessionsStore.createIndex('date', 'date', { unique: false });
                    sessionsStore.createIndex('mode', 'mode', { unique: false });
                }

                if (!db.objectStoreNames.contains('questions')) {
                    const questionsStore = db.createObjectStore('questions', { keyPath: 'id', autoIncrement: true });
                    questionsStore.createIndex('sessionId', 'sessionId', { unique: false });
                }
            };
        });

        return this.initPromise;
    }

    async addSession(session: Session): Promise<void> {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction(['sessions'], 'readwrite');
            const sessionStore = tx.objectStore('sessions');
            sessionStore.put(session);

            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    async addQuestions(questions: Omit<QuestionRecord, 'id'>[]): Promise<void> {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction(['questions'], 'readwrite');
            const questionStore = tx.objectStore('questions');

            questions.forEach(q => questionStore.add(q));

            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    async getSessions(limit = 50): Promise<Session[]> {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction(['sessions'], 'readonly');
            const store = tx.objectStore('sessions');
            const request = store.getAll();

            request.onsuccess = () => {
                const sessions = request.result as Session[];
                sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                resolve(sessions.slice(0, limit));
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getSessionsByMode(mode: string): Promise<Session[]> {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction(['sessions'], 'readonly');
            const store = tx.objectStore('sessions');
            const index = store.index('mode');
            const request = index.getAll(mode);

            request.onsuccess = () => {
                const sessions = request.result as Session[];
                sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                resolve(sessions);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getSessionsByDateRange(startDate: string, endDate: string): Promise<Session[]> {
        await this.init();
        const sessions = await this.getSessions(1000);
        return sessions.filter(s => s.date >= startDate && s.date <= endDate);
    }

    async getQuestionsBySession(sessionId: string): Promise<QuestionRecord[]> {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction(['questions'], 'readonly');
            const store = tx.objectStore('questions');
            const index = store.index('sessionId');
            const request = index.getAll(sessionId);

            request.onsuccess = () => resolve(request.result as QuestionRecord[]);
            request.onerror = () => reject(request.error);
        });
    }

    async getOverallStats(): Promise<{
        totalSessions: number;
        totalQuestions: number;
        totalCorrect: number;
        avgAccuracy: number;
        avgTimeMs: number;
        streakDays: number;
        modes: Record<string, { sessions: number; accuracy: number; avgTime: number }>;
    }> {
        await this.init();
        const sessions = await this.getSessions(500);

        const totalQuestions = sessions.reduce((sum, s) => sum + s.totalQuestions, 0);
        const totalCorrect = sessions.reduce((sum, s) => sum + s.correct, 0);
        const totalTimeMs = sessions.reduce((sum, s) => sum + (s.avgTimeMs * s.totalQuestions), 0);

        const modes: Record<string, { sessions: number; correct: number; total: number; timeMs: number }> = {};
        sessions.forEach(s => {
            if (!modes[s.mode]) {
                modes[s.mode] = { sessions: 0, correct: 0, total: 0, timeMs: 0 };
            }
            modes[s.mode].sessions++;
            modes[s.mode].correct += s.correct;
            modes[s.mode].total += s.totalQuestions;
            modes[s.mode].timeMs += s.avgTimeMs * s.totalQuestions;
        });

        const modeStats: Record<string, { sessions: number; accuracy: number; avgTime: number }> = {};
        Object.entries(modes).forEach(([mode, data]) => {
            modeStats[mode] = {
                sessions: data.sessions,
                accuracy: data.total > 0 ? (data.correct / data.total) * 100 : 0,
                avgTime: data.total > 0 ? data.timeMs / data.total : 0,
            };
        });

        const streakDays = this.calculateStreak(sessions);

        return {
            totalSessions: sessions.length,
            totalQuestions,
            totalCorrect,
            avgAccuracy: totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0,
            avgTimeMs: totalQuestions > 0 ? totalTimeMs / totalQuestions : 0,
            streakDays,
            modes: modeStats,
        };
    }

    private calculateStreak(sessions: Session[]): number {
        if (sessions.length === 0) return 0;

        const uniqueDates = [...new Set(sessions.map(s => s.date.split('T')[0]))].sort().reverse();
        let streak = 0;
        const today = new Date().toISOString().split('T')[0];
        let checkDate = today;

        for (const date of uniqueDates) {
            if (date === checkDate || date === new Date(Date.now() - streak * 86400000).toISOString().split('T')[0]) {
                streak++;
                checkDate = new Date(Date.now() - streak * 86400000).toISOString().split('T')[0];
            } else {
                break;
            }
        }

        return streak;
    }

    async getRecentPerformance(days = 7): Promise<{ date: string; accuracy: number; count: number }[]> {
        await this.init();
        const sessions = await this.getSessions(200);

        const endDate = new Date();
        const startDate = new Date(Date.now() - days * 86400000);

        const result: Record<string, { correct: number; total: number }> = {};

        sessions.forEach(s => {
            const sessionDate = new Date(s.date);
            if (sessionDate >= startDate && sessionDate <= endDate) {
                const dateKey = s.date.split('T')[0];
                if (!result[dateKey]) {
                    result[dateKey] = { correct: 0, total: 0 };
                }
                result[dateKey].correct += s.correct;
                result[dateKey].total += s.totalQuestions;
            }
        });

        return Object.entries(result)
            .map(([date, data]) => ({
                date,
                accuracy: data.total > 0 ? (data.correct / data.total) * 100 : 0,
                count: data.total,
            }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }

    async clearAllData(): Promise<void> {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction(['sessions', 'questions'], 'readwrite');
            tx.objectStore('sessions').clear();
            tx.objectStore('questions').clear();
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    async getTodayTotalQuestions(): Promise<number> {
        await this.init();
        const today = new Date().toISOString().split('T')[0];
        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction(['sessions'], 'readonly');
            const store = tx.objectStore('sessions');
            const index = store.index('date');
            const range = IDBKeyRange.bound(today + 'T00:00:00', today + 'T23:59:59');
            const request = index.getAll(range);

            request.onsuccess = () => {
                const sessions = request.result as Session[];
                const total = sessions.reduce((sum, s) => sum + s.totalQuestions, 0);
                resolve(total);
            };
            request.onerror = () => reject(request.error);
        });
    }
}

export const db = new ZenMathDB();