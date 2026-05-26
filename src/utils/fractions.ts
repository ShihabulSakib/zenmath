const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

interface IrreducibleFraction {
    n: number;
    d: number;
}

const poolCache = new Map<string, IrreducibleFraction[]>();

function buildPoolKey(minN: number, maxN: number, minD: number, maxD: number): string {
    return `${minN},${maxN},${minD},${maxD}`;
}

function buildIrreduciblePool(
    minNumerator: number,
    maxNumerator: number,
    minDenominator: number,
    maxDenominator: number,
): IrreducibleFraction[] {
    const key = buildPoolKey(minNumerator, maxNumerator, minDenominator, maxDenominator);
    const cached = poolCache.get(key);
    if (cached) return cached;

    const pool: IrreducibleFraction[] = [];
    for (let d = minDenominator; d <= maxDenominator; d++) {
        for (let n = minNumerator; n <= Math.min(maxNumerator, d - 1); n++) {
            if (gcd(n, d) === 1) {
                pool.push({ n, d });
            }
        }
    }

    if (pool.length === 0) {
        pool.push({ n: 1, d: 2 });
    }

    poolCache.set(key, pool);
    return pool;
}

export function generateFractionQuestion(
    minNumerator: number,
    maxNumerator: number,
    minDenominator: number,
    maxDenominator: number,
): { question: string; answer: string; type: 'fractionToDecimal' | 'decimalToFraction' } {
    const type: 'fractionToDecimal' | 'decimalToFraction' = Math.random() < 0.5
        ? 'fractionToDecimal'
        : 'decimalToFraction';

    const pool = buildIrreduciblePool(minNumerator, maxNumerator, minDenominator, maxDenominator);
    const selected = pool[Math.floor(Math.random() * pool.length)];
    const { n: simplifiedNumerator, d: simplifiedDenominator } = selected;

    if (type === 'fractionToDecimal') {
        const question = `${simplifiedNumerator}/${simplifiedDenominator}`;
        const rawVal = simplifiedNumerator / simplifiedDenominator;
        const answer = parseFloat(rawVal.toFixed(4)).toString();
        return { question, answer, type };
    } else {
        const rawVal = simplifiedNumerator / simplifiedDenominator;
        const question = parseFloat(rawVal.toFixed(4)).toString();
        const answer = `${simplifiedNumerator}/${simplifiedDenominator}`;
        return { question, answer, type };
    }
}

export function clearFractionPoolCache(): void {
    poolCache.clear();
}
