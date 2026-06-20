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
    correctAnswer: number | string;
    userAnswer: number | string | null;
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

        // Request storage persistence if supported to prevent browser from clearing stats during cache sweeps
        if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
            navigator.storage.persisted().then(persisted => {
                if (!persisted) {
                    navigator.storage.persist().then(granted => {
                        console.log(`[ZenMathDB] Storage persistence granted: ${granted}`);
                    }).catch(err => {
                        console.error('[ZenMathDB] Failed to request storage persistence:', err);
                    });
                } else {
                    console.log('[ZenMathDB] Storage is already persistent');
                }
            }).catch(err => {
                console.error('[ZenMathDB] Failed to check storage persistence:', err);
            });
        }

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

    async exportBackup(): Promise<string> {
        await this.init();
        
        const sessions = await new Promise<Session[]>((resolve, reject) => {
            const tx = this.db!.transaction(['sessions'], 'readonly');
            const request = tx.objectStore('sessions').getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(tx.error || new Error('Failed to get sessions'));
        });

        const questions = await new Promise<QuestionRecord[]>((resolve, reject) => {
            const tx = this.db!.transaction(['questions'], 'readonly');
            const request = tx.objectStore('questions').getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(tx.error || new Error('Failed to get questions'));
        });

        const lsKeys = [
            'zenmath-settings',
            'zenmath-daily-progress',
            'zenmath-notification-sent-times',
            'zenmath-notification-permission',
            'zenmath-theme',
            'zenmath-notification-times'
        ];
        const lsData: Record<string, string | null> = {};
        lsKeys.forEach(key => {
            lsData[key] = localStorage.getItem(key);
        });

        const backup = {
            type: 'zenmath-backup',
            version: 1,
            exportedAt: new Date().toISOString(),
            localStorage: lsData,
            sessions,
            questions,
        };

        return JSON.stringify(backup, null, 2);
    }

    async importBackup(backupStr: string): Promise<void> {
        await this.init();
        let backup: any;
        try {
            backup = JSON.parse(backupStr);
        } catch (e) {
            throw new Error('Invalid JSON format. Please upload a valid ZenMath backup file.');
        }

        if (!backup || backup.type !== 'zenmath-backup' || backup.version !== 1) {
            throw new Error('Invalid backup file. This file does not appear to be a ZenMath backup.');
        }

        // 1. Clear database stores
        await this.clearAllData();

        // 2. Restore localStorage data
        if (backup.localStorage) {
            Object.entries(backup.localStorage).forEach(([key, val]) => {
                if (val === null) {
                    localStorage.removeItem(key);
                } else {
                    localStorage.setItem(key, val as string);
                }
            });
        }

        // 3. Restore sessions
        if (Array.isArray(backup.sessions) && backup.sessions.length > 0) {
            await new Promise<void>((resolve, reject) => {
                const tx = this.db!.transaction(['sessions'], 'readwrite');
                const store = tx.objectStore('sessions');
                let err: any = null;
                backup.sessions.forEach((s: any) => {
                    const req = store.put(s);
                    req.onerror = () => { err = req.error; };
                });
                tx.oncomplete = () => {
                    if (err) reject(err);
                    else resolve();
                };
                tx.onerror = () => reject(tx.error || new Error('Failed to write sessions'));
            });
        }

        // 4. Restore questions
        if (Array.isArray(backup.questions) && backup.questions.length > 0) {
            await new Promise<void>((resolve, reject) => {
                const tx = this.db!.transaction(['questions'], 'readwrite');
                const store = tx.objectStore('questions');
                let err: any = null;
                backup.questions.forEach((q: any) => {
                    const req = store.put(q);
                    req.onerror = () => { err = req.error; };
                });
                tx.oncomplete = () => {
                    if (err) reject(err);
                    else resolve();
                };
                tx.onerror = () => reject(tx.error || new Error('Failed to write questions'));
            });
        }
    }
}

export const db = new ZenMathDB();