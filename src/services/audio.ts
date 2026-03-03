// ─── Audio Sprite Player — Web Audio API ─────────────────────
// Low-latency, offline-capable audio sprite playback using a single
// pre-decoded AudioBuffer and a JSON sprite map.

/** Shape of each sprite entry in the JSON manifest */
interface SpriteEntry {
    start: number;  // milliseconds
    end: number;    // milliseconds
    loop: boolean;
}

/** Shape of the JSON manifest file */
interface SpriteManifest {
    resources: string[];
    spritemap: Record<string, SpriteEntry>;
}

/** Gap (in seconds) between sequenced sprites at 1.0x speed */
const BASE_SEQUENCE_GAP = 0.08;
/** Micro-fade duration (in seconds) to prevent digital clicks */
const FADE_TIME = 0.005;

type AudioTier = '10' | '125' | '15' | '175' | '20';

interface TierData {
    buffer: AudioBuffer;
    map: Record<string, SpriteEntry>;
}

export class AudioSpritePlayer {
    private audioContext: AudioContext | null = null;
    private tiers: Map<AudioTier, TierData> = new Map();
    private loadingTiers: Map<AudioTier, Promise<void>> = new Map();
    private activeSources: { source: AudioBufferSourceNode; gain: GainNode }[] = [];
    private _playbackRate = 1.0;
    private _baseLoaded = false;
    private _loadError: string | null = null;

    /** Whether at least the base 1.0x assets are loaded */
    get isLoaded(): boolean {
        return this._baseLoaded;
    }

    get loadError(): string | null {
        return this._loadError;
    }

    /** Current playback speed (0.5–2.5) */
    get playbackRate(): number {
        return this._playbackRate;
    }
    set playbackRate(rate: number) {
        this._playbackRate = Math.max(0.5, Math.min(2.5, rate));
    }

    private getContext(): AudioContext {
        if (!this.audioContext) {
            this.audioContext = new AudioContext();
        }
        return this.audioContext;
    }

    private async ensureResumed(): Promise<void> {
        const ctx = this.getContext();
        if (ctx.state === 'suspended') {
            await ctx.resume();
        }
    }

    /**
     * Determines which anchor tier to use based on the current playback rate.
     */
    private getBestTier(): AudioTier {
        if (this._playbackRate >= 1.88) return '20';
        if (this._playbackRate >= 1.63) return '175';
        if (this._playbackRate >= 1.38) return '15';
        if (this._playbackRate >= 1.13) return '125';
        return '10';
    }

    /**
     * Internal loader for a specific tier.
     */
    private async loadTier(tier: AudioTier): Promise<void> {
        if (this.tiers.has(tier)) return;

        // Prevent redundant fetches
        const existingLoad = this.loadingTiers.get(tier);
        if (existingLoad) return existingLoad;

        const loadPromise = (async () => {
            try {
                const ctx = this.getContext();
                const suffix = tier === '10' ? '' : `_${tier}`;
                const audioUrl = `/audio/game_audio_sprite${suffix}.wav`;
                const mapUrl = tier === '10' 
                    ? '/audio/game_audio_sprite_wav.json' 
                    : `/audio/game_audio_sprite${suffix}.json`;

                const [audioRes, mapRes] = await Promise.all([fetch(audioUrl), fetch(mapUrl)]);
                if (!audioRes.ok || !mapRes.ok) throw new Error(`Failed to load tier ${tier}`);

                const [audioData, manifest] = await Promise.all([
                    audioRes.arrayBuffer(),
                    mapRes.json() as Promise<SpriteManifest>
                ]);

                const buffer = await ctx.decodeAudioData(audioData);
                this.tiers.set(tier, { buffer, map: manifest.spritemap });
                if (tier === '10') {
                    this._baseLoaded = true;
                    this._loadError = null;
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown audio load error';
                console.warn(`[AudioSpritePlayer] Tier ${tier} failed:`, message);
                if (tier === '10') {
                    this._loadError = message;
                }
            } finally {
                this.loadingTiers.delete(tier);
            }
        })();

        this.loadingTiers.set(tier, loadPromise);
        return loadPromise;
    }

    /**
     * Public entry point to ensure at least the base tier is loaded.
     */
    async load(): Promise<void> {
        await this.loadTier('10');
    }

    /**
     * Stops all sounds with a quick fade-out to prevent clicks.
     */
    stop(): void {
        const ctx = this.getContext();
        const now = ctx.currentTime;

        for (const { source, gain } of this.activeSources) {
            try {
                gain.gain.cancelScheduledValues(now);
                gain.gain.linearRampToValueAtTime(0, now + FADE_TIME);
                source.stop(now + FADE_TIME);
            } catch { /* Ignore */ }
        }
        this.activeSources = [];
    }

    /**
     * Plays a sequence of sprites using anchor-tier selection and signal smoothing.
     */
    async playSequence(spriteKeys: string[]): Promise<void> {
        if (spriteKeys.length === 0) return;

        const tier = this.getBestTier();
        // Lazy load the tier if it's not ready
        if (!this.tiers.has(tier)) {
            await this.loadTier(tier);
        }

        // Get data from the best available tier (fallback to 1.0 if requested failed)
        const data = this.tiers.get(tier) || this.tiers.get('10');
        if (!data) return;

        await this.ensureResumed();
        this.stop();

        const ctx = this.getContext();
        const anchorRate = tier === '20' ? 2.0 : (tier === '175' ? 1.75 : (tier === '15' ? 1.5 : (tier === '125' ? 1.25 : 1.0)));
        const relativeRate = this._playbackRate / anchorRate;
        const scaledGap = BASE_SEQUENCE_GAP / this._playbackRate;

        let scheduleTime = ctx.currentTime + 0.01; // Tiny offset to ensure smooth start

        for (const key of spriteKeys) {
            const entry = data.map[key];
            if (!entry) continue;

            const source = ctx.createBufferSource();
            const gainNode = ctx.createGain();

            source.buffer = data.buffer;
            source.playbackRate.value = relativeRate;

            const startSec = entry.start / 1000;
            const durationSec = (entry.end - entry.start) / 1000;
            const realDuration = durationSec / relativeRate;

            // Connect and Smooth: Gain Ramping
            source.connect(gainNode);
            gainNode.connect(ctx.destination);

            // 5ms Fade-in
            gainNode.gain.setValueAtTime(0, scheduleTime);
            gainNode.gain.linearRampToValueAtTime(1, scheduleTime + FADE_TIME);

            // 5ms Fade-out
            gainNode.gain.setValueAtTime(1, scheduleTime + realDuration - FADE_TIME);
            gainNode.gain.linearRampToValueAtTime(0, scheduleTime + realDuration);

            source.start(scheduleTime, startSec, durationSec);
            source.stop(scheduleTime + realDuration);

            const activeEntry = { source, gain: gainNode };
            this.activeSources.push(activeEntry);

            source.onended = () => {
                this.activeSources = this.activeSources.filter(s => s !== activeEntry);
            };

            scheduleTime += realDuration + scaledGap;
        }
    }

    /**
     * Simplified single play (mostly for test buttons).
     */
    async play(spriteKey: string): Promise<void> {
        await this.playSequence([spriteKey]);
    }

    async dispose(): Promise<void> {
        this.stop();
        if (this.audioContext) {
            await this.audioContext.close();
            this.audioContext = null;
        }
        this.tiers.clear();
    }
}

// ── Singleton instance ──────────────────────────────────────
// Shared across the entire app so the AudioBuffer is decoded only once.
export const audioSpritePlayer = new AudioSpritePlayer();
