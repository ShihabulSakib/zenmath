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

/** Gap (in seconds) between sequenced sprites */
const SEQUENCE_GAP = 0.08;

export class AudioSpritePlayer {
    private audioContext: AudioContext | null = null;
    private audioBuffer: AudioBuffer | null = null;
    private spriteMap: Record<string, SpriteEntry> | null = null;
    private activeSources: AudioBufferSourceNode[] = [];
    private _loaded = false;
    private _loadError: string | null = null;
    private _playbackRate = 1.0;

    /** Whether the audio assets have been successfully loaded and decoded */
    get isLoaded(): boolean {
        return this._loaded;
    }

    /** Any error that occurred during loading */
    get loadError(): string | null {
        return this._loadError;
    }

    /** Current playback speed (0.5–2.0) */
    get playbackRate(): number {
        return this._playbackRate;
    }
    set playbackRate(rate: number) {
        this._playbackRate = Math.max(0.5, Math.min(2.0, rate));
    }

    /**
     * Lazily creates or returns the AudioContext.
     * Must be called after a user gesture on mobile Safari.
     */
    private getContext(): AudioContext {
        if (!this.audioContext) {
            this.audioContext = new AudioContext();
        }
        return this.audioContext;
    }

    /**
     * Ensures the AudioContext is in a running state.
     * Browsers may suspend it until a user gesture occurs.
     */
    private async ensureResumed(): Promise<void> {
        const ctx = this.getContext();
        if (ctx.state === 'suspended') {
            await ctx.resume();
        }
    }

    /**
     * Fetches the WAV sprite sheet and JSON manifest, decodes the audio.
     * Call once at application startup. Safe to call multiple times
     * (subsequent calls are no-ops if already loaded).
     */
    async load(spriteUrl: string, mapUrl: string): Promise<void> {
        if (this._loaded) return;

        try {
            const ctx = this.getContext();

            // Fetch both assets in parallel
            const [audioResponse, mapResponse] = await Promise.all([
                fetch(spriteUrl),
                fetch(mapUrl),
            ]);

            if (!audioResponse.ok) {
                throw new Error(`Failed to fetch audio: ${audioResponse.status}`);
            }
            if (!mapResponse.ok) {
                throw new Error(`Failed to fetch sprite map: ${mapResponse.status}`);
            }

            const [audioData, manifest] = await Promise.all([
                audioResponse.arrayBuffer(),
                mapResponse.json() as Promise<SpriteManifest>,
            ]);

            // Decode the WAV into a playable AudioBuffer
            this.audioBuffer = await ctx.decodeAudioData(audioData);
            this.spriteMap = manifest.spritemap;
            this._loaded = true;
            this._loadError = null;
        } catch (error) {
            this._loadError = error instanceof Error ? error.message : 'Unknown audio load error';
            console.warn('[AudioSpritePlayer] Load failed:', this._loadError);
            // Do not crash — feature will simply be unavailable
        }
    }

    /**
     * Stops all currently playing sprite sounds.
     */
    stop(): void {
        for (const source of this.activeSources) {
            try {
                source.stop();
            } catch {
                // Already stopped — ignore
            }
        }
        this.activeSources = [];
    }

    /**
     * Plays a single sprite by its key name.
     * Stops any currently playing sounds first.
     */
    async play(spriteKey: string): Promise<void> {
        if (!this._loaded || !this.audioBuffer || !this.spriteMap) return;

        const entry = this.spriteMap[spriteKey];
        if (!entry) {
            console.warn(`[AudioSpritePlayer] Unknown sprite key: "${spriteKey}"`);
            return;
        }

        await this.ensureResumed();
        this.stop();

        const ctx = this.getContext();
        const source = ctx.createBufferSource();
        source.buffer = this.audioBuffer;
        source.playbackRate.value = this._playbackRate;

        const startSec = entry.start / 1000;
        const durationSec = (entry.end - entry.start) / 1000;

        source.connect(ctx.destination);
        source.start(0, startSec, durationSec);

        this.activeSources.push(source);
        source.onended = () => {
            this.activeSources = this.activeSources.filter(s => s !== source);
        };
    }

    /**
     * Plays an array of sprite keys back-to-back with precise timing.
     * Uses AudioContext scheduling for seamless sequencing.
     */
    async playSequence(spriteKeys: string[]): Promise<void> {
        if (!this._loaded || !this.audioBuffer || !this.spriteMap) return;
        if (spriteKeys.length === 0) return;

        await this.ensureResumed();
        this.stop();

        const ctx = this.getContext();
        let scheduleTime = ctx.currentTime;

        for (const key of spriteKeys) {
            const entry = this.spriteMap[key];
            if (!entry) {
                console.warn(`[AudioSpritePlayer] Skipping unknown sprite key: "${key}"`);
                continue;
            }

            const source = ctx.createBufferSource();
            source.buffer = this.audioBuffer;
            source.playbackRate.value = this._playbackRate;

            const startSec = entry.start / 1000;
            const durationSec = (entry.end - entry.start) / 1000;

            source.connect(ctx.destination);
            source.start(scheduleTime, startSec, durationSec);

            this.activeSources.push(source);
            source.onended = () => {
                this.activeSources = this.activeSources.filter(s => s !== source);
            };

            // Scale timing by inverse of playbackRate (faster rate = shorter real-time duration)
            scheduleTime += (durationSec / this._playbackRate) + SEQUENCE_GAP;
        }
    }

    /**
     * Releases AudioContext resources. Call on unmount if needed.
     */
    async dispose(): Promise<void> {
        this.stop();
        if (this.audioContext) {
            await this.audioContext.close();
            this.audioContext = null;
        }
        this.audioBuffer = null;
        this.spriteMap = null;
        this._loaded = false;
    }
}

// ── Singleton instance ──────────────────────────────────────
// Shared across the entire app so the AudioBuffer is decoded only once.
export const audioSpritePlayer = new AudioSpritePlayer();
