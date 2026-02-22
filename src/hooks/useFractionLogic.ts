import { useCallback } from 'react';

export interface FractionLogicProps {
    generateFractionQuestion: () => { question: string; answer: string; type: 'fractionToDecimal' | 'decimalToFraction' };
}

export function useFractionLogic(minDenominator: number, maxDenominator: number): FractionLogicProps {

    const generateFractionQuestion = useCallback(() => {
        const type: 'fractionToDecimal' | 'decimalToFraction' = Math.random() < 0.5 ? 'fractionToDecimal' : 'decimalToFraction';

        // Helper to find GCD
        const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

        // Generate a random denominator within the allowed range
        const denominator = Math.floor(Math.random() * (maxDenominator - minDenominator + 1)) + minDenominator;

        // Generate numerator, ensuring it's less than denominator
        let numerator = Math.floor(Math.random() * (denominator - 1)) + 1; // 1 to denominator-1

        // Simplify fraction
        const commonDivisor = gcd(numerator, denominator);
        const simplifiedNumerator = numerator / commonDivisor;
        const simplifiedDenominator = denominator / commonDivisor;

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
    }, [minDenominator, maxDenominator]);

    return { generateFractionQuestion };
}
