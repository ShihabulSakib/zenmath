import { useState, useEffect } from 'react';
import type { GameSettings } from '../hooks/useGameLogic';
import { isTTSSupported, getAvailableVoices, speakTest, cancelSpeech, type VoiceOption } from '../Utils/speech';
import { audioSpritePlayer } from '../services/audio';

interface SettingsScreenProps {
    settings: GameSettings;
    onSave: (settings: GameSettings) => void;
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
    const [voices, setVoices] = useState<VoiceOption[]>([]);

    // Load available voices
    useEffect(() => {
        if (isTTSSupported()) {
            getAvailableVoices().then(setVoices);
        }
    }, []);

    const handleSave = () => {
        cancelSpeech();
        audioSpritePlayer.stop();
        onSave({ ...settings, totalQuestions, timeLimit, ttsEnabled, audioSpriteEnabled, spriteSpeed, listenOnlyMode, speechRate, preferredVoiceURI });
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
                                    onClick={() => setTtsEnabled(!ttsEnabled)}
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
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-primary" style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}>graphic_eq</span>
                                        <div>
                                            <span className="text-sm font-bold text-main">HD Voice</span>
                                            <p className="text-[10px] text-secondary opacity-60 mt-0.5">Pre-recorded audio sprites (works offline)</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setAudioSpriteEnabled(!audioSpriteEnabled)}
                                        className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${audioSpriteEnabled ? 'bg-primary' : 'bg-toggle-off'}`}
                                        role="switch"
                                        aria-checked={audioSpriteEnabled}
                                    >
                                        <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${audioSpriteEnabled ? 'translate-x-5' : ''}`} />
                                    </button>
                                </div>
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
                                    <span className="text-sm text-primary font-black">{spriteSpeed.toFixed(1)}×</span>
                                </div>
                                <div className="px-2">
                                    <input
                                        type="range"
                                        min="0.5"
                                        max="2.0"
                                        step="0.1"
                                        value={spriteSpeed}
                                        onChange={(e) => setSpriteSpeed(parseFloat(e.target.value))}
                                        style={{ "--range-progress": `${((spriteSpeed - 0.5) / 1.5) * 100}%` } as React.CSSProperties}
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] font-black text-secondary mt-2 px-2 uppercase tracking-widest opacity-40">
                                    <span>Slow</span>
                                    <span>Fast</span>
                                </div>
                            </div>
                        )}

                        {/* Listen Only Mode — only when TTS is enabled */}
                        {ttsEnabled && (
                            <div className="bg-card border border-card rounded-3xl p-5 shadow-sm mb-4 animate-fade-in">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-primary" style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}>visibility_off</span>
                                        <div>
                                            <span className="text-sm font-bold text-main">Listen Only</span>
                                            <p className="text-[10px] text-secondary opacity-60 mt-0.5">Hide questions — practice by ear</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setListenOnlyMode(!listenOnlyMode)}
                                        className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${listenOnlyMode ? 'bg-primary' : 'bg-toggle-off'}`}
                                        role="switch"
                                        aria-checked={listenOnlyMode}
                                    >
                                        <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${listenOnlyMode ? 'translate-x-5' : ''}`} />
                                    </button>
                                </div>
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
                                        <span className="text-sm text-primary font-black">{speechRate.toFixed(1)}×</span>
                                    </div>
                                    <div className="px-2">
                                        <input
                                            type="range"
                                            min="0.5"
                                            max="2.0"
                                            step="0.1"
                                            value={speechRate}
                                            onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                                            style={{ "--range-progress": `${((speechRate - 0.5) / 1.5) * 100}%` } as React.CSSProperties}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] font-black text-secondary mt-2 px-2 uppercase tracking-widest opacity-40">
                                        <span>Slow</span>
                                        <span>Fast</span>
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
                    className="w-full bg-primary text-white font-bold text-lg py-4 px-6 rounded-2xl shadow-lg shadow-primary/30 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    <span>Save Settings</span>
                </button>
            </div>
        </div>
    );
}
