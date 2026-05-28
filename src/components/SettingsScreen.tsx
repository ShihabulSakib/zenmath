import { useState, useEffect } from 'react';
import { isTTSSupported, getAvailableVoices, speakTest, cancelSpeech, type VoiceOption } from '../utils/speech';
import { audioSpritePlayer } from '../services/audio';
import { requestNotificationPermission, getTodayProgress, showLocalNotification, TIME_SLOTS, invalidateSettingsCache, type TimeSlotInfo } from '../services/notifications';
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
}

export default function SettingsScreen({ settings, onSave, onBack, audioSpriteLoaded }: SettingsScreenProps) {
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
    const [notificationTimes, setNotificationTimes] = useState<string[]>(settings.notificationTimes && settings.notificationTimes.length > 0 ? settings.notificationTimes : [TIME_SLOTS[2].value]);
    const [voices, setVoices] = useState<VoiceOption[]>([]);
    const { showToast } = useToast();

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
        
        // Request permission when saving if notifications are enabled
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
        <div className="flex flex-col h-full animate-fade-in">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-header backdrop-blur-sm px-4 pt-6 pb-2 flex items-center justify-between">
                <button
                    onClick={() => { cancelSpeech(); onBack(); }}
                    className="flex items-center justify-center p-2 -ml-2 rounded-full"
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
                        <div className="flex justify-between items-center mb-8 px-1">
                            <span className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-60">Selection</span>
                            <span className="bg-primary text-on-primary px-3 py-1 rounded-lg text-xs font-bold">{totalQuestions} Questions</span>
                        </div>
                        <div className="px-2">
                            <RangeSlider
                                value={totalQuestions}
                                min={1}
                                max={50}
                                onChange={setTotalQuestions}
                            />
                        </div>
                        <div className="flex justify-between text-[10px] font-black text-secondary mt-3 px-2 uppercase tracking-widest opacity-30">
                            <span>1</span>
                            <span>50</span>
                        </div>
                    </div>
                </section>

                {/* Timer slider */}
                <section>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-secondary mb-4 px-1 ml-1 opacity-70">
                        Time per Question
                    </h3>
                    <div className="bg-card border border-card rounded-3xl p-6 pb-8 shadow-sm">
                        <div className="flex justify-between items-center mb-8 px-1">
                            <span className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-60">Time Limit</span>
                            <span className="bg-primary text-on-primary px-3 py-1 rounded-lg text-xs font-bold">{timeLimit} Seconds</span>
                        </div>
                        <div className="px-2">
                            <RangeSlider
                                value={timeLimit}
                                min={6}
                                max={60}
                                onChange={setTimeLimit}
                            />
                        </div>
                        <div className="flex justify-between text-[10px] font-black text-secondary mt-3 px-2 uppercase tracking-widest opacity-30">
                            <span>6s</span>
                            <span>60s</span>
                        </div>
                    </div>
                </section>

                {/* Training Settings */}
                <section>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-secondary mb-4 px-1 ml-1 opacity-70">
                        Training
                    </h3>

                    <ToggleCard
                        enabled={adaptiveDifficulty}
                        onChange={setAdaptiveDifficulty}
                        label="Adaptive Difficulty"
                        description='Auto-increase difficulty when accuracy {">"}85%'
                        icon="trending_up"
                    />

                    <ToggleCard
                        enabled={showStreak}
                        onChange={setShowStreak}
                        label="Streak Counter"
                        description="Show consecutive correct answer streak"
                        icon="local_fire_department"
                    />
                </section>

                {/* Notifications Section */}
                <section>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-secondary mb-4 px-1 ml-1 opacity-70">
                        Notifications
                    </h3>
                    
                    <div className="bg-card border border-card rounded-3xl p-5 shadow-sm mb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary" style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}>notifications</span>
                                <div>
                                    <span className="text-sm font-bold text-main">Daily Reminder</span>
                                    <p className="text-[10px] text-secondary opacity-60 mt-0.5">
                                        {getTodayProgress().goalAchieved 
                                            ? 'Goal achieved! Great job!' 
                                            : `${getTodayProgress().goal - getTodayProgress().count} exercises to go`}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={async () => {
                                    if (!notificationsEnabled) {
                                        if ('Notification' in window) {
                                            const perm = await Notification.requestPermission();
                                            if (perm === 'granted') {
                                                setNotificationsEnabled(true);
                                            } else {
                                                showToast('Please allow notifications in browser settings');
                                            }
                                        } else {
                                            showToast('Notifications not supported in this browser');
                                        }
                                    } else {
                                        setNotificationsEnabled(false);
                                    }
                                }}
                                className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${notificationsEnabled ? 'bg-primary' : 'bg-toggle-off'}`}
                                role="switch"
                                aria-checked={notificationsEnabled}
                            >
                                <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${notificationsEnabled ? 'translate-x-5' : ''}`} />
                            </button>
                        </div>
                    </div>
                    
                    {notificationsEnabled && (
                        <div className="bg-card border border-card rounded-3xl p-5 shadow-sm animate-fade-in">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-primary/40" style={{ fontSize: 18 }}>schedule</span>
                                <span className="text-xs text-secondary font-bold uppercase tracking-wider opacity-60">Reminder Times</span>
                            </div>

                            {/* Grouped time slots by period */}
                            {(['morning', 'midday', 'afternoon', 'evening', 'night'] as TimeSlotInfo['period'][]).map((period) => {
                                const periodSlots = TIME_SLOTS.filter(s => s.period === period);
                                if (periodSlots.length === 0) return null;
                                return (
                                    <div key={period} className="mb-3 last:mb-0">
                                        <div className="text-[9px] font-black uppercase tracking-widest text-secondary opacity-40 mb-2 ml-1">
                                            {period === 'morning' ? 'Morning' :
                                             period === 'midday' ? 'Midday' :
                                             period === 'afternoon' ? 'Afternoon' :
                                             period === 'evening' ? 'Evening' : 'Night'}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {periodSlots.map((slot) => (
                                                <button
                                                    key={slot.value}
                                                    onClick={() => {
                                                        invalidateSettingsCache();
                                                        if (notificationTimes.includes(slot.value)) {
                                                            setNotificationTimes(notificationTimes.filter(t => t !== slot.value));
                                                        } else {
                                                            setNotificationTimes([...notificationTimes, slot.value]);
                                                        }
                                                    }}
                                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                                        notificationTimes.includes(slot.value)
                                                            ? 'bg-primary text-on-primary'
                                                            : 'bg-primary/10 text-secondary border border-primary/20'
                                                    }`}
                                                >
                                                    {slot.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}

                            <p className="text-[10px] text-secondary opacity-40 mt-3 ml-1">
                                Send up to 3 reminders at these times if goal not met
                            </p>

                            {/* Next scheduled notification */}
                            {notificationTimes.length > 0 && (() => {
                                const now = new Date();
                                const currentMinutes = now.getHours() * 60 + now.getMinutes();
                                const upcoming = notificationTimes
                                    .map(t => {
                                        const [h, m] = t.split(':').map(Number);
                                        return { time: t, totalMinutes: h * 60 + m };
                                    })
                                    .filter(t => t.totalMinutes > currentMinutes)
                                    .sort((a, b) => a.totalMinutes - b.totalMinutes);
                                if (upcoming.length > 0) {
                                    const slot = TIME_SLOTS.find(s => s.value === upcoming[0].time);
                                    return (
                                        <p className="text-[10px] font-bold text-primary mt-2 ml-1">
                                            Next reminder: {slot ? slot.label : upcoming[0].time}
                                        </p>
                                    );
                                }
                                return null;
                            })()}

                            {/* Message preview */}
                            {(() => {
                                const { goal, count } = getTodayProgress();
                                const remaining = Math.max(0, goal - count);
                                const now = new Date();
                                const hour = now.getHours();
                                const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
                                return (
                                    <div className="mt-4 bg-surface border border-card rounded-2xl p-3">
                                        <div className="text-[9px] font-black uppercase tracking-widest text-secondary opacity-40 mb-1">Message Preview</div>
                                        <p className="text-xs text-secondary opacity-80">
                                            {remaining > 0
                                                ? `"${greeting}! ${remaining} of ${goal} exercises remaining."`
                                                : '"Goal achieved! Great job!"'}
                                        </p>
                                    </div>
                                );
                            })()}

                            {('Notification' in window) && (
                                <button
                                    onClick={() => {
                                        const { goal, count } = getTodayProgress();
                                        const remaining = Math.max(0, goal - count);
                                        showLocalNotification(
                                            remaining > 0
                                                ? 'ZenMath — Practice Reminder'
                                                : 'ZenMath — Goal Achieved',
                                            remaining > 0 
                                                ? `${remaining} of ${goal} exercises remaining`
                                                : 'Great job! You\'ve met your daily goal!'
                                        );
                                    }}
                                    className="mt-4 w-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold py-3 px-4 rounded-2xl active:scale-[0.98] transition-transform"
                                >
                                    Test Notification
                                </button>
                            )}
                        </div>
                    )}
                </section>

                {/* Voice Settings — only shown when TTS is supported */}
                {showTTS && (
                    <section>
                        <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-secondary mb-4 px-1 ml-1 opacity-70">
                            Voice Settings
                        </h3>

                        {/* TTS Toggle */}
                        <div className="bg-card border border-card rounded-3xl p-5 shadow-sm mb-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-primary" style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}>record_voice_over</span>
                                    <div>
                                        <span className="text-sm font-bold text-main">Read Aloud</span>
                                        <p className="text-[10px] text-secondary opacity-60 mt-0.5">Speak questions during gameplay</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        const newTtsState = !ttsEnabled;
                                        setTtsEnabled(newTtsState);
                                        // When enabling TTS, default Listen Only to ON.
                                        // When disabling TTS, Listen Only must also be OFF.
                                        setListenOnlyMode(newTtsState);
                                    }}
                                    className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${ttsEnabled ? 'bg-primary' : 'bg-toggle-off'}`}
                                    role="switch"
                                    aria-checked={ttsEnabled}
                                >
                                    <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${ttsEnabled ? 'translate-x-5' : ''}`} />
                                </button>
                            </div>
                        </div>

                        {/* Audio Sprite Toggle — only when TTS is enabled and sprites are loaded */}
                        {ttsEnabled && audioSpriteLoaded && (
                            <div className="bg-card border border-card rounded-3xl p-5 shadow-sm mb-4 animate-fade-in">
                                <ToggleSwitch
                                    enabled={audioSpriteEnabled}
                                    onChange={setAudioSpriteEnabled}
                                    label="HD Voice"
                                    description="Pre-recorded audio sprites (works offline)"
                                    icon="graphic_eq"
                                />
                            </div>
                        )}

                        {/* Sprite Speed — only when HD Voice is enabled */}
                        {ttsEnabled && audioSpriteEnabled && audioSpriteLoaded && (
                            <div className="bg-card border border-card rounded-3xl p-6 pb-8 shadow-sm mb-4 animate-fade-in">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary/40" style={{ fontSize: 18 }}>speed</span>
                                        <span className="text-xs text-secondary font-bold uppercase tracking-wider opacity-60">Voice Speed</span>
                                    </div>
                                    <span className="text-sm text-primary font-black">{spriteSpeed.toFixed(2)}×</span>
                                </div>
                                <div className="px-2">
                                    <RangeSlider
                                        value={spriteSpeed}
                                        min={1}
                                        max={2}
                                        step={0.25}
                                        onChange={setSpriteSpeed}
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] font-black text-secondary mt-2 px-2 uppercase tracking-widest opacity-40">
                                    <span>1.0x</span>
                                    <span>1.25x</span>
                                    <span>1.5x</span>
                                    <span>1.75x</span>
                                    <span>2.0x</span>
                                </div>
                            </div>
                        )}

                        {/* Listen Only Mode — only when TTS is enabled */}
                        {ttsEnabled && (
                            <div className="bg-card border border-card rounded-3xl p-5 shadow-sm mb-4 animate-fade-in">
                                <ToggleSwitch
                                    enabled={listenOnlyMode}
                                    onChange={setListenOnlyMode}
                                    label="Listen Only"
                                    description="Hide questions — practice by ear"
                                    icon="visibility_off"
                                />
                            </div>
                        )}

                        {ttsEnabled && !audioSpriteEnabled && (
                            <div className="flex flex-col gap-4 animate-fade-in">
                                {/* Speech Rate */}
                                <div className="bg-card border border-card rounded-3xl p-6 pb-8 shadow-sm">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary/40" style={{ fontSize: 18 }}>speed</span>
                                            <span className="text-xs text-secondary font-bold uppercase tracking-wider opacity-60">Speed</span>
                                        </div>
                                        <span className="text-sm text-primary font-black">{speechRate.toFixed(2)}×</span>
                                    </div>
                                    <div className="px-2">
                                        <RangeSlider
                                            value={speechRate}
                                            min={0.25}
                                            max={2.0}
                                            step={0.25}
                                            onChange={setSpeechRate}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] font-black text-secondary mt-2 px-2 uppercase tracking-widest opacity-40">
                                        <span>0.25x</span>
                                        <span>1.0x</span>
                                        <span>2.0x</span>
                                    </div>
                                </div>

                                {/* Voice Selection */}
                                {voices.length > 0 && (
                                    <div className="bg-card border border-card rounded-3xl p-5 shadow-sm">
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="material-symbols-outlined text-primary/40" style={{ fontSize: 18 }}>mic</span>
                                            <span className="text-xs text-secondary font-bold uppercase tracking-wider opacity-60">Voice</span>
                                        </div>
                                        <select
                                            value={preferredVoiceURI}
                                            onChange={(e) => setPreferredVoiceURI(e.target.value)}
                                            className="w-full bg-surface border border-card rounded-2xl px-4 py-3 text-sm text-main font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        >
                                            <option value="">System Default</option>
                                            {voices.map((v) => (
                                                <option key={v.voiceURI} value={v.voiceURI}>
                                                    {v.name} {v.isLocal ? '⚡' : '☁️'}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-[10px] text-secondary opacity-40 mt-2 ml-1">
                                            ⚡ = Offline &nbsp; ☁️ = Requires network
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Test Button — always shown when TTS is enabled */}
                        {ttsEnabled && (
                            <button
                                onClick={handleTest}
                                className="bg-card border border-card rounded-3xl p-4 shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform mt-4"
                            >
                                <span className="material-symbols-outlined text-primary" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>play_circle</span>
                                <span className="text-sm font-bold text-primary">Test Voice</span>
                            </button>
                        )}
                    </section>
                )}
            </main>

            {/* Fixed bottom CTA */}
            <div className="fixed bottom-0 left-0 w-full bg-header backdrop-blur-xl p-5 pb-10 z-20">
                <button
                    onClick={handleSave}
                    className="w-full bg-primary text-on-primary font-bold text-lg py-4 px-6 rounded-2xl active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    <span>Save Settings</span>
                </button>
            </div>
        </div>
    );
}
