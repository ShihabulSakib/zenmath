// ─── TTS Utility — Web Speech API ────────────────────────────
// 100% offline, no external APIs. Uses native speechSynthesis.

/** Feature detection */
export function isTTSSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** Cancel any ongoing speech */
export function cancelSpeech(): void {
    if (isTTSSupported()) {
        window.speechSynthesis.cancel();
    }
}

/**
 * Translate math notation to natural spoken language.
 * e.g. "12 ÷ 4" → "12 divided by 4", "5²" → "5 squared"
 */
export function translateMathToText(
    num1: number,
    num2: number,
    operation: string,
    mode: string,
    fractionQuestionDisplay?: string
): string {
    // Fraction mode — use the display string
    if (mode === 'fraction' && fractionQuestionDisplay) {
        // Convert fraction display like "Convert 3/4 to decimal" to spoken form
        return fractionQuestionDisplay
            .replace(/(\d+)\/(\d+)/g, '$1 over $2');
    }

    // Square mode
    if (operation === '²') {
        return `${num1} squared`;
    }

    // Map operation symbols to spoken words
    const opMap: Record<string, string> = {
        '+': 'plus',
        '−': 'minus',
        '×': 'times',
        '÷': 'divided by',
    };

    const spokenOp = opMap[operation] || operation;
    return `${num1} ${spokenOp} ${num2}`;
}

/**
 * Speak a text string using the Web Speech API.
 * Cancels any pending speech before starting to prevent overlap.
 */
export function speakQuestion(
    text: string,
    rate: number = 1.0,
    voiceURI?: string
): void {
    if (!isTTSSupported()) return;

    // Cancel pending speech to prevent overlap
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to find the preferred voice
    if (voiceURI) {
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v => v.voiceURI === voiceURI);
        if (preferred) {
            utterance.voice = preferred;
        }
        // If preferred not found, fall back to first local voice or default
        if (!preferred) {
            const fallback = voices.find(v => v.localService && v.lang.startsWith(navigator.language.split('-')[0]));
            if (fallback) {
                utterance.voice = fallback;
            }
        }
    }

    window.speechSynthesis.speak(utterance);
}

export interface VoiceOption {
    name: string;
    voiceURI: string;
    lang: string;
    isLocal: boolean; // true = works offline
}

/**
 * Get available voices, filtered to the user's language.
 * Returns a promise that resolves when voices are loaded
 * (handles the async `onvoiceschanged` edge case).
 */
export function getAvailableVoices(): Promise<VoiceOption[]> {
    return new Promise((resolve) => {
        if (!isTTSSupported()) {
            resolve([]);
            return;
        }

        const mapVoices = (): VoiceOption[] => {
            const voices = window.speechSynthesis.getVoices();
            const userLang = navigator.language.split('-')[0]; // e.g. "en"

            return voices
                .filter(v => v.lang.startsWith(userLang))
                .map(v => ({
                    name: v.name,
                    voiceURI: v.voiceURI,
                    lang: v.lang,
                    isLocal: v.localService,
                }));
        };

        // Most browsers populate voices synchronously after first interaction
        const voices = mapVoices();
        if (voices.length > 0) {
            resolve(voices);
            return;
        }

        // Some browsers (Chrome) need to wait for onvoiceschanged
        const handleVoicesChanged = () => {
            window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
            resolve(mapVoices());
        };
        window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

        // Safety timeout — resolve with empty if voices never load
        setTimeout(() => {
            window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
            resolve(mapVoices());
        }, 2000);
    });
}

/**
 * Speak a short test phrase with the given voice settings.
 */
export function speakTest(rate: number, voiceURI?: string): void {
    speakQuestion('12 times 8', rate, voiceURI);
}
