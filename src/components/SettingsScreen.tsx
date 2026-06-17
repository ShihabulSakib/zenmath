import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';
import { isTTSSupported, getAvailableVoices, speakTest, cancelSpeech, type VoiceOption } from '../utils/speech';
import { audioSpritePlayer } from '../services/audio';
import { 
    requestNotificationPermission, 
    getTodayProgress, 
    showLocalNotification, 
    TIME_SLOTS, 
    invalidateSettingsCache, 
    subscribeToPush,
    unsubscribeFromPush,
    type TimeSlotInfo 
} from '../services/notifications';
import { useToast } from '../hooks/useToast';
import ToggleSwitch, { ToggleCard } from './ToggleSwitch';
import RangeSlider from './RangeSlider';

interface SettingsScreenProps {
    settings: {
        totalQuestions: number;
        timeLimit: number;
        dailyGoal: number;
        ttsEnabled: boolean;
        audioSpriteEnabled: boolean;
        spriteSpeed: number;
        listenOnlyMode: boolean;
        speechRate: number;
        preferredVoiceURI: string;
        adaptiveDifficulty: boolean;
        showStreak: boolean;
        notificationsEnabled: boolean;
        notificationTimes: string[];
    };
    onSave: (settings: any) => void;
    onBack: () => void;
    audioSpriteLoaded: boolean;
    onLoadAudioSprites: () => void;
}

export default function SettingsScreen({ settings, onSave, onBack, audioSpriteLoaded, onLoadAudioSprites }: SettingsScreenProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [totalQuestions, setTotalQuestions] = useState(settings.totalQuestions);
    const [timeLimit, setTimeLimit] = useState(settings.timeLimit);
    const [ttsEnabled, setTtsEnabled] = useState(settings.ttsEnabled);
    const [audioSpriteEnabled, setAudioSpriteEnabled] = useState(settings.audioSpriteEnabled);
    const [spriteSpeed, setSpriteSpeed] = useState(settings.spriteSpeed);
    const [listenOnlyMode, setListenOnlyMode] = useState(settings.listenOnlyMode);
    const [speechRate, setSpeechRate] = useState(settings.speechRate);
    const [preferredVoiceURI, setPreferredVoiceURI] = useState(settings.preferredVoiceURI);
    const [adaptiveDifficulty, setAdaptiveDifficulty] = useState(settings.adaptiveDifficulty);
    const [showStreak, setShowStreak] = useState(settings.showStreak);
    const [notificationsEnabled, setNotificationsEnabled] = useState(settings.notificationsEnabled);
    const [notificationTimes, setNotificationTimes] = useState<string[]>(settings.notificationTimes || []);
    const [voices, setVoices] = useState<VoiceOption[]>([]);
    const { showToast } = useToast();

    // Calculate timeline progress
    const timelineProgress = useMemo(() => {
        const now = new Date();
        const hour = now.getHours();
        const minutes = now.getMinutes();
        const totalMinutes = hour * 60 + minutes;
        
        const start = 480; // 8 AM
        const end = 1200;  // 8 PM
        const progress = Math.max(0, Math.min(100, ((totalMinutes - start) / (end - start)) * 100));
        return progress;
    }, []);

    // Load available voices
    useEffect(() => {
        if (isTTSSupported()) {
            getAvailableVoices().then(setVoices);
        }
    }, []);

    const handleSave = async () => {
        cancelSpeech();
        audioSpritePlayer.stop();
        invalidateSettingsCache();
        
        if (notificationsEnabled && Notification.permission !== 'granted') {
            const perm = await requestNotificationPermission();
            if (perm !== 'granted') {
                setNotificationsEnabled(false);
            }
        }
        
        onSave({
            ...settings, 
            totalQuestions, 
            timeLimit, 
            ttsEnabled, 
            audioSpriteEnabled, 
            spriteSpeed, 
            listenOnlyMode, 
            speechRate, 
            preferredVoiceURI, 
            adaptiveDifficulty, 
            showStreak,
            notificationsEnabled,
            notificationTimes
        });
        onBack();
    };

    const handleTest = () => {
        if (audioSpriteEnabled && audioSpriteLoaded) {
            audioSpritePlayer.playbackRate = spriteSpeed;
            audioSpritePlayer.playSequence(['12', 'times', '8']);
        } else {
            speakTest(speechRate, preferredVoiceURI);
        }
    };

    const showTTS = isTTSSupported();

    return (
        <div className="flex flex-col h-full overflow-hidden bg-surface">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl px-4 pt-8 pb-4 flex items-center justify-between">
                <button 
                    onClick={onBack}
                    className="size-10 rounded-full flex items-center justify-center text-main active:bg-card transition-colors"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-lg font-bold tracking-tight text-main">Settings</h1>
                <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-transform"
                >
                    Save
                </button>
            </header>

            <main className="flex-1 px-5 pb-52 overflow-y-auto pt-6 space-y-10">
                {/* Session Configuration */}
                <section className="space-y-4">
                    <header className="px-1">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary opacity-40">Session Limits</h3>
                    </header>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <motion.div 
                            whileTap={{ scale: 0.98 }}
                            className="bg-card border border-card rounded-3xl p-5 flex flex-col justify-between h-36 shadow-sm relative overflow-hidden"
                        >
                            <label className="text-[10px] text-secondary font-black uppercase tracking-widest opacity-40">Count</label>
                            <div className="flex items-end justify-between mt-auto w-full relative z-10">
                                <span className="text-5xl font-black text-main leading-none tracking-tighter">{totalQuestions}</span>
                                <span className="material-symbols-outlined text-primary/20 text-4xl">format_list_numbered</span>
                            </div>
                            <div className="absolute -bottom-4 -right-4 size-20 bg-primary/5 rounded-full blur-3xl" />
                        </motion.div>

                        <motion.div 
                            whileTap={{ scale: 0.98 }}
                            className="bg-card border border-card rounded-3xl p-5 flex flex-col justify-between h-36 shadow-sm relative overflow-hidden"
                        >
                            <label className="text-[10px] text-secondary font-black uppercase tracking-widest opacity-40">Time</label>
                            <div className="flex items-end justify-between mt-auto w-full relative z-10">
                                <span className="text-5xl font-black text-main leading-none tracking-tighter">{timeLimit}</span>
                                <div className="flex flex-col items-end">
                                    <span className="material-symbols-outlined text-primary/20 text-4xl">timer</span>
                                    <span className="text-[8px] font-black text-primary/30 uppercase tracking-[0.3em] -mt-1">SEC</span>
                                </div>
                            </div>
                            <div className="absolute -bottom-4 -right-4 size-20 bg-primary/5 rounded-full blur-3xl" />
                        </motion.div>
                    </div>

                    <div className="bg-card border border-card rounded-3xl p-6 space-y-8">
                        <div className="space-y-6">
                            <div className="flex justify-between items-center px-1">
                                <span className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-40">Session Questions</span>
                                <span className="text-sm font-bold text-primary">{totalQuestions}</span>
                            </div>
                            <RangeSlider value={totalQuestions} min={1} max={50} onChange={setTotalQuestions} />
                        </div>

                        <div className="space-y-6">
                            <div className="flex justify-between items-center px-1">
                                <span className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-40">Time Limit</span>
                                <span className="text-sm font-bold text-primary">{timeLimit}s</span>
                            </div>
                            <RangeSlider value={timeLimit} min={6} max={60} onChange={setTimeLimit} />
                        </div>
                    </div>
                </section>

                {/* Training Settings */}
                <section className="space-y-4">
                    <header className="px-1">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary opacity-40">Training Behavior</h3>
                    </header>

                    <ToggleCard
                        enabled={adaptiveDifficulty}
                        onChange={setAdaptiveDifficulty}
                        label="Adaptive Difficulty"
                        description='Auto-adjust based on performance'
                        icon="trending_up"
                    />

                    <ToggleCard
                        enabled={showStreak}
                        onChange={setShowStreak}
                        label="Streak Counter"
                        description="Show correct answer sequence"
                        icon="local_fire_department"
                    />
                </section>

                {/* Notifications Section */}
                <section className="space-y-4">
                    <header className="px-1">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary opacity-40">Notifications</h3>
                    </header>
                    
                    <div className="bg-card border border-card rounded-3xl p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`size-10 rounded-2xl flex items-center justify-center transition-colors ${notificationsEnabled ? 'bg-primary/10 text-primary' : 'bg-surface text-secondary/40'}`}>
                                    <span className="material-symbols-outlined" style={{ fontVariationSettings: notificationsEnabled ? "'FILL' 1" : "'FILL' 0" }}>notifications</span>
                                </div>
                                <div>
                                    <span className="text-sm font-bold text-main">Daily Reminder</span>
                                    <p className="text-[10px] text-secondary opacity-50 mt-0.5">
                                        {getTodayProgress().goalAchieved 
                                            ? 'Daily goal completed!' 
                                            : `${getTodayProgress().goal - getTodayProgress().count} sessions remaining`}
                                    </p>
                                </div>
                            </div>
                            <ToggleSwitch 
                                enabled={notificationsEnabled} 
                                onChange={async (val) => {
                                    if (val) {
                                        const perm = await requestNotificationPermission();
                                        if (perm === 'granted') {
                                            setNotificationsEnabled(true);
                                            await subscribeToPush();
                                        } else {
                                            showToast('Permissions required');
                                        }
                                    } else {
                                        setNotificationsEnabled(false);
                                        await unsubscribeFromPush();
                                    }
                                }} 
                            />
                        </div>
                    </div>
                    
                    <AnimatePresence>
                        {notificationsEnabled && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: 'auto' }}
                                exit={{ opacity: 0, y: 10, height: 0 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                className="overflow-hidden space-y-4"
                            >
                                {/* Timeline Card */}
                                <div className="bg-card border border-card rounded-3xl p-6 shadow-sm">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary/40" style={{ fontSize: 18 }}>history_toggle_off</span>
                                            <span className="text-xs text-secondary font-bold uppercase tracking-wider opacity-60">Smart Timeline</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-primary/5 px-2.5 py-1 rounded-full border border-primary/10">
                                            <div className="size-1.5 rounded-full bg-primary" />
                                            <span className="text-[9px] font-black text-primary uppercase tracking-widest">
                                                {notificationTimes.length} Active
                                            </span>
                                        </div>
                                    </div>

                                    <div className="relative flex flex-col gap-6">
                                        {/* The Glow Timeline Line */}
                                        <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-primary/5 rounded-full" />
                                        <motion.div 
                                            className={`absolute left-[19px] top-4 w-0.5 bg-primary rounded-full ${isDark ? 'shadow-[0_0_10px_rgba(228,228,231,0.5)]' : 'shadow-[0_0_10px_rgba(0,0,0,0.1)]'}`}
                                            initial={{ height: 0 }}
                                            animate={{ height: `${timelineProgress}%` }}
                                            style={{ maxHeight: 'calc(100% - 32px)' }}
                                            transition={{ duration: 1, ease: 'easeOut' }}
                                        />

                                        {(['morning', 'midday', 'afternoon', 'evening', 'night'] as TimeSlotInfo['period'][]).map((period) => {
                                            const periodSlots = TIME_SLOTS.filter(s => s.period === period);
                                            const isActive = periodSlots.some(s => notificationTimes.includes(s.value));
                                            const periodIcon = 
                                                period === 'morning' ? 'light_mode' :
                                                period === 'midday' ? 'wb_sunny' :
                                                period === 'afternoon' ? 'wb_twilight' :
                                                period === 'evening' ? 'nights_stay' : 'bedtime';
                                            
                                            return (
                                                <div key={period} className="relative flex items-start gap-5 z-10">
                                                    <motion.div 
                                                        animate={{ scale: isActive ? 1.05 : 1 }}
                                                        className={`size-10 rounded-2xl flex items-center justify-center border-2 shadow-lg transition-colors ${
                                                            isActive 
                                                                ? 'bg-primary border-primary text-on-primary' 
                                                                : 'bg-card border-card text-secondary/30'
                                                        }`}
                                                    >
                                                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                                                            {periodIcon}
                                                        </span>
                                                    </motion.div>
                                                    
                                                    <div className="flex-1 space-y-2.5">
                                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-secondary opacity-30">
                                                            {period}
                                                        </span>
                                                        <div className="flex flex-wrap gap-2">
                                                            {periodSlots.map((slot) => (
                                                                <motion.button
                                                                    key={slot.value}
                                                                    whileTap={{ scale: 0.95 }}
                                                                    onClick={() => {
                                                                        invalidateSettingsCache();
                                                                        if (notificationTimes.includes(slot.value)) {
                                                                            setNotificationTimes(notificationTimes.filter(t => t !== slot.value));
                                                                        } else {
                                                                            if (notificationTimes.length >= 3) {
                                                                                showToast('Limit: 3 reminders');
                                                                                return;
                                                                            }
                                                                            setNotificationTimes([...notificationTimes, slot.value]);
                                                                        }
                                                                    }}
                                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                                                        notificationTimes.includes(slot.value)
                                                                            ? 'bg-primary text-on-primary border-primary shadow-[0_4px_12px_rgba(var(--color-brand-rgb),0.3)]'
                                                                            : 'bg-surface border-card text-secondary opacity-60'
                                                                    }`}
                                                                >
                                                                    {slot.label}
                                                                </motion.button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Status & Rescue Card */}
                                <div className="bg-card border border-card rounded-3xl p-5 shadow-sm space-y-4">
                                    <div className="flex items-center justify-between px-1">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary/40" style={{ fontSize: 18 }}>cloud_done</span>
                                            <span className="text-xs text-secondary font-bold uppercase tracking-wider opacity-60">Sync Health</span>
                                        </div>
                                        <button 
                                            onClick={async () => {
                                                const { subscribeToPush } = await import('../services/notifications');
                                                const success = await subscribeToPush();
                                                if (success) showToast('Cloud sync restored');
                                                else showToast('Sync failed');
                                            }}
                                            className="text-[9px] font-black text-primary uppercase tracking-[0.2em] bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10 active:scale-95 transition-transform"
                                        >
                                            Fix / Resync
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-surface rounded-2xl p-3 border border-card flex items-center gap-3">
                                            <div className="size-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)] animate-pulse" />
                                            <span className="text-[10px] font-bold text-main">Local OK</span>
                                        </div>
                                        <div className="bg-surface rounded-2xl p-3 border border-card flex items-center gap-3">
                                            <div className={`size-2 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.4)] ${Notification.permission === 'granted' ? 'bg-green-500 shadow-green-500/40' : 'bg-red-500 shadow-red-500/40'}`} />
                                            <span className="text-[10px] font-bold text-main">Cloud OK</span>
                                        </div>
                                    </div>

                                    <motion.button
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            const { goal, count } = getTodayProgress();
                                            const remaining = Math.max(0, goal - count);
                                            showLocalNotification('ZenMath Test', remaining > 0 ? `${remaining} sessions to go!` : 'Goal met!');
                                        }}
                                        className="w-full bg-primary text-on-primary text-sm font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl"
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>send</span>
                                        Send Test Signal
                                    </motion.button>

                                    {/* Discreet Dev Tools */}
                                    <div className="pt-4 border-t border-card/50 flex items-center justify-between px-1">
                                        <span className="text-[8px] font-black text-secondary uppercase tracking-[0.3em] opacity-20">Dev Diagnostics</span>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={async () => {
                                                    const reg = await navigator.serviceWorker.ready;
                                                    reg.active?.postMessage({ type: 'TEST_PERIODIC_CHECK' });
                                                }}
                                                className="size-7 bg-surface rounded-lg flex items-center justify-center text-secondary/40 active:text-primary transition-colors"
                                            >
                                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>restart_alt</span>
                                            </button>
                                            <button 
                                                onClick={async () => {
                                                    const { triggerTestPush, subscribeToPush } = await import('../services/notifications');
                                                    await subscribeToPush();
                                                    await triggerTestPush();
                                                }}
                                                className="size-7 bg-surface rounded-lg flex items-center justify-center text-secondary/40 active:text-primary transition-colors"
                                            >
                                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>cloud_sync</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>

                {/* Voice Settings */}
                {showTTS && (
                    <section className="space-y-4">
                        <header className="px-1">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary opacity-40">Audio & Voice</h3>
                        </header>

                        <ToggleCard
                            enabled={ttsEnabled}
                            onChange={(v) => {
                                setTtsEnabled(v);
                                if (v) setListenOnlyMode(true);
                            }}
                            label="Speech Output"
                            description="Voice guidance during practice"
                            icon="record_voice_over"
                        />

                        {ttsEnabled && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="space-y-4"
                            >
                                <div className="bg-card border border-card rounded-3xl p-5">
                                    <ToggleSwitch
                                        enabled={audioSpriteEnabled}
                                        onChange={(v) => {
                                            if (v && !audioSpriteLoaded) onLoadAudioSprites();
                                            setSpriteSpeed(1.25); // Default speed for sprites
                                            setAudioSpriteEnabled(v);
                                        }}
                                        label="HD Audio (Studio)"
                                        description={audioSpriteLoaded ? "Crystal clear offline voice" : "Optimizing assets..."}
                                        icon="graphic_eq"
                                    />
                                </div>

                                {audioSpriteEnabled && audioSpriteLoaded ? (
                                    <div className="bg-card border border-card rounded-3xl p-6 space-y-6">
                                        <div className="flex justify-between items-center px-1">
                                            <span className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-40">Voice Speed</span>
                                            <span className="text-sm font-bold text-primary">{spriteSpeed.toFixed(2)}x</span>
                                        </div>
                                        <RangeSlider value={spriteSpeed} min={1} max={2} step={0.25} onChange={setSpriteSpeed} />
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="bg-card border border-card rounded-3xl p-6 space-y-6">
                                            <div className="flex justify-between items-center px-1">
                                                <span className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-40">Speech Rate</span>
                                                <span className="text-sm font-bold text-primary">{speechRate.toFixed(2)}x</span>
                                            </div>
                                            <RangeSlider value={speechRate} min={0.25} max={2} step={0.25} onChange={setSpeechRate} />
                                        </div>

                                        {voices.length > 0 && (
                                            <div className="bg-card border border-card rounded-3xl p-5">
                                                <select
                                                    value={preferredVoiceURI}
                                                    onChange={(e) => setPreferredVoiceURI(e.target.value)}
                                                    className="w-full bg-surface border border-card rounded-2xl px-4 py-3 text-sm text-main font-medium appearance-none outline-none"
                                                >
                                                    <option value="">System Default</option>
                                                    {voices.map((v) => (
                                                        <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <ToggleCard
                                    enabled={listenOnlyMode}
                                    onChange={setListenOnlyMode}
                                    label="Listen-Only Mode"
                                    description="No numbers shown — practice by ear"
                                    icon="visibility_off"
                                />

                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleTest}
                                    className="w-full bg-card border border-card rounded-3xl p-4 text-primary font-bold text-sm flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
                                    Test Voice Configuration
                                </motion.button>
                            </motion.div>
                        )}
                    </section>
                )}
            </main>
        </div>
    );
}
