// ─── Math Speech — Number-to-Sprite-Key Conversion ──────────
// Converts numbers and math problems into arrays of sprite keys
// that map to entries in the audio sprite manifest.

/**
 * Converts a number (0–9999) into an array of sprite keys.
 *
 * Examples:
 *   0    → ["0"]
 *   7    → ["7"]
 *   15   → ["15"]
 *   25   → ["20", "5"]
 *   100  → ["1", "hundred"]
 *   125  → ["1", "hundred", "20", "5"]
 *   105  → ["1", "hundred", "5"]
 *   120  → ["1", "hundred", "20"]
 *   1000 → ["1", "thousand"]
 *   2500 → ["2", "thousand", "5", "hundred"]
 *   3456 → ["3", "thousand", "4", "hundred", "50", "6"]
 */
export function numberToSpriteKeys(n: number): string[] {
    if (n < 0) {
        // Handle negative: say "minus" then the absolute value
        return ['minus', ...numberToSpriteKeys(Math.abs(n))];
    }

    if (n === 0) return ['0'];

    const keys: string[] = [];

    // Thousands place (1000–9999)
    const thousands = Math.floor(n / 1000);
    if (thousands > 0) {
        keys.push(String(thousands));
        keys.push('thousand');
        n %= 1000;
    }

    // Hundreds place (100–999)
    const hundreds = Math.floor(n / 100);
    if (hundreds > 0) {
        keys.push(String(hundreds));
        keys.push('hundred');
        n %= 100;
    }

    // Remaining two digits (0–99)
    if (n === 0) {
        // Nothing left to add
    } else if (n <= 19) {
        // 1–19 each have their own sprite
        keys.push(String(n));
    } else {
        // 20–99: tens + optional ones
        const tens = Math.floor(n / 10) * 10;
        const ones = n % 10;
        keys.push(String(tens));
        if (ones > 0) {
            keys.push(String(ones));
        }
    }

    return keys;
}

/** Maps UI operation symbols to sprite keys */
const OPERATION_SPRITE_MAP: Record<string, string> = {
    '+': 'plus',
    '−': 'minus',
    '×': 'times',
    '÷': 'dividedby',
    '²': 'squared',
};

/**
 * Converts a full math problem into an array of sprite keys.
 *
 * Examples:
 *   (25, '×', 5)  → ["20", "5", "times", "5"]
 *   (12, '+', 8)  → ["12", "plus", "8"]
 *   (9, '²', 0)   → ["9", "squared"]
 *
 * For fraction mode, returns an empty array (fractions use
 * the existing Web Speech API for now).
 */
export function problemToSpriteKeys(
    num1: number,
    operation: string,
    num2: number,
    mode?: string,
    fractionQuestionDisplay?: string,
): string[] {
    // Factor-finding mode: use Web Speech fallback
    if (mode === 'factor-finding') {
        return [];
    }

    // Fraction mode: parse "Convert X/Y to decimal" pattern
    if (mode === 'fraction' && fractionQuestionDisplay) {
        const match = fractionQuestionDisplay.match(/(\d+)\/(\d+)/);
        if (match) {
            const numerator = parseInt(match[1], 10);
            const denominator = parseInt(match[2], 10);
            return [
                ...numberToSpriteKeys(numerator),
                'over',
                ...numberToSpriteKeys(denominator),
            ];
        }
        // Fallback: can't parse, return empty (caller will use Web Speech)
        return [];
    }

    // Square mode: "N squared"
    if (operation === '²') {
        return [...numberToSpriteKeys(num1), 'squared'];
    }

    // Standard operations: "num1 <op> num2"
    const opKey = OPERATION_SPRITE_MAP[operation];
    if (!opKey) {
        console.warn(`[mathSpeech] Unknown operation: "${operation}"`);
        return [];
    }

    return [
        ...numberToSpriteKeys(num1),
        opKey,
        ...numberToSpriteKeys(num2),
    ];
}
