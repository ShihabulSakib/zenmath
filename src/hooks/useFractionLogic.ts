import { useState, useCallback } from 'react';
import type { GameMode } from './useGameLogic';

export interface FractionQuestion {
    type: 'fractionToDecimal' | 'decimalToFraction';
    question: string;
    answer: string;
}

export function useFractionLogic() {
    const [fractionMode, setFractionMode] = useState<'fractionToDecimal' | 'decimalToFraction'>('fractionToDecimal');
    const [denominatorRange, setDenominatorRange] = useState<[number, number]>([2, 10]);

    const generateFractionQuestion = useCallback((): FractionQuestion => {
        let num: number;
        let den: number;

        // Generate a valid fraction (numerator < denominator)
        do {
            num = Math.floor(Math.random() * (denominatorRange[1] - 1)) + 1; // num from 1 to den-1
            den = Math.floor(Math.random() * (denominatorRange[1] - denominatorRange[0] + 1)) + denominatorRange[0];
        } while (num >= den);

        const fractionString = `${num}/${den}`;
        const decimalValue = num / den;
        const decimalString = decimalValue.toFixed(4).replace(/\.?0+$/, ''); // Remove trailing zeros

        if (fractionMode === 'fractionToDecimal') {
            return {
                type: 'fractionToDecimal',
                question: fractionString,
                answer: decimalString,
            };
        } else { // decimalToFraction
            return {
                type: 'decimalToFraction',
                question: decimalString,
                answer: fractionString,
            };
        }
    }, [fractionMode, denominatorRange]);

    return {
        fractionMode,
        setFractionMode,
        denominatorRange,
        setDenominatorRange,
        generateFractionQuestion,
    };
}
