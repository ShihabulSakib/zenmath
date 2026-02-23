import { useCallback } from 'react';

export interface FractionLogicProps {
    generateFractionQuestion: () => { question: string; answer: string; type: 'fractionToDecimal' | 'decimalToFraction' };
}

export function useFractionLogic(minNumerator: number, maxNumerator: number, minDenominator: number, maxDenominator: number): FractionLogicProps {

    const generateFractionQuestion = useCallback(() => {
        const type: 'fractionToDecimal' | 'decimalToFraction' = Math.random() < 0.5 ? 'fractionToDecimal' : 'decimalToFraction';

        // Helper to find GCD
        const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

        // Let's generate a pool of possible valid fractions to avoid the bias
        // where 1/2 gets generated too often because it's the simplified version of 2/4, 3/6, 4/8, etc.
        const possibleFractions: { n: number, d: number }[] = [];

        for (let d = minDenominator; d <= maxDenominator; d++) {
            for (let n = minNumerator; n <= Math.min(maxNumerator, d - 1); n++) {
                // Only add irreducible fractions to the pool
                if (gcd(n, d) === 1) {
                    possibleFractions.push({ n, d });
                }
            }
        }

        // Add a fallback in case there somehow are no irreducible fractions
        if (possibleFractions.length === 0) {
            possibleFractions.push({ n: 1, d: 2 });
        }

        // Pick a random irreducible fraction from the pool
        const selected = possibleFractions[Math.floor(Math.random() * possibleFractions.length)];
        const simplifiedNumerator = selected.n;
        const simplifiedDenominator = selected.d;

        if (type === 'fractionToDecimal') {
            const question = `${simplifiedNumerator}/${simplifiedDenominator}`;
            // Convert to decimal and remove trailing zeros, up to 4 decimal places
            const rawVal = simplifiedNumerator / simplifiedDenominator;
            const answer = parseFloat(rawVal.toFixed(4)).toString();

            return { question, answer, type };
        } else { // decimalToFraction
            const rawVal = simplifiedNumerator / simplifiedDenominator;
            const question = parseFloat(rawVal.toFixed(4)).toString();
            const answer = `${simplifiedNumerator}/${simplifiedDenominator}`;

            return { question, answer, type };
        }
    }, [minNumerator, maxNumerator, minDenominator, maxDenominator]);

    return { generateFractionQuestion };
}
