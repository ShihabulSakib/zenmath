import type { Difficulty, Operation } from '../hooks/useGameLogic';

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

export function randomInRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getOperationSymbol(op: Operation): string {
    switch (op) {
        case '+': return '+';
        case '-': return '−';
        case '*': return '×';
        case '/': return '÷';
    }
}

export function modeToOperation(mode: string): Operation {
    switch (mode) {
        case 'addition': return '+';
        case 'subtraction': return '-';
        case 'multiplication': return '*';
        case 'division': return '/';
        default: return '+';
    }
}

function generateNumber(
    digits: number,
    diff: Difficulty,
    operation: Operation,
    isSecondNum: boolean
): number {
    let min = 1;
    for (let i = 0; i < digits - 1; i++) min *= 10;
    const max = min * 10 - 1;

    let num = randomInRange(min, max);

    if (diff === 'hard') {
        const choice = Math.floor(Math.random() * 4);
        switch (choice) {
            case 0:
                num = Math.floor(num / 10) * 10 + 9;
                if (num > max) num = max;
                break;
            case 1:
                num = Math.floor(num / 10) * 10 + 1;
                if (num < min) num = min;
                break;
            case 2:
                if (Math.random() < 0.5) {
                    num = min + randomInRange(0, 2);
                } else {
                    num = max - randomInRange(0, 2);
                }
                break;
            case 3:
                break;
        }
    } else if (diff === 'easy' && operation === '*' && isSecondNum) {
        num = randomInRange(2, 9);
    }

    return num;
}

export function generateQuestion(
    operation: Operation,
    digits: number,
    diff: Difficulty,
    allowRemainder: boolean,
    allowNegativeResults: boolean
): { num1: number; num2: number; answer: number } {
    let num1 = generateNumber(digits, diff, operation, false);
    let num2 = generateNumber(digits, diff, operation, true);
    let answer: number;

    switch (operation) {
        case '+':
            answer = num1 + num2;
            break;
        case '-':
            if (allowNegativeResults) {
                if (num1 >= num2) [num1, num2] = [num2, num1];
                if (num1 === num2) num2 += 1;
            } else {
                if (num1 < num2) [num1, num2] = [num2, num1];
            }
            answer = num1 - num2;
            break;
        case '*':
            answer = num1 * num2;
            break;
        case '/':
            if (!allowRemainder) {
                const divDigits = Math.max(1, Math.floor(digits / 2));
                num2 = generateNumber(divDigits, diff, operation, true);
                const targetMin = Math.pow(10, digits - 1);
                const targetMax = Math.pow(10, digits) - 1;
                const qMin = Math.max(1, Math.ceil(targetMin / num2));
                const qMax = Math.max(qMin, Math.floor(targetMax / num2));
                const q = randomInRange(qMin, qMax);
                num1 = num2 * q;
                answer = q;
            } else {
                answer = Math.floor(num1 / num2);
            }
            break;
        default:
            answer = 0;
    }

    return { num1, num2, answer };
}

export function generatePercentageQuestion(diff: Difficulty): { question: string; answer: number } {
    if (diff === 'easy') {
        const easyPcts = [10, 25, 50, 75];
        const pct = easyPcts[randomInRange(0, easyPcts.length - 1)];
        let baseValue: number;
        let answer: number;
        if (pct === 75) {
            const m = randomInRange(2, 12);
            baseValue = m * 4;
            answer = baseValue * 3 / 4;
        } else if (pct === 25) {
            const m = randomInRange(2, 10);
            baseValue = m * 4;
            answer = baseValue / 4;
        } else if (pct === 50) {
            const m = randomInRange(2, 10);
            baseValue = m * 2;
            answer = baseValue / 2;
        } else {
            const m = randomInRange(2, 10);
            baseValue = m * 10;
            answer = baseValue / 10;
        }
        return { question: `${pct}% of ${baseValue}`, answer };
    }

    const type = Math.random() < 0.5 ? 'percentOf' : 'whatPercent';
    if (type === 'percentOf') {
        const pct = randomInRange(1, 20) * 5;
        const multiplier = 100 / gcd(pct, 100);
        const k = randomInRange(1, Math.floor(100 / multiplier));
        const value = k * multiplier;
        const answer = (pct * value) / 100;
        return { question: `${pct}% of ${value}`, answer };
    } else {
        const pct = randomInRange(1, 20) * 5;
        const multiplier = 100 / gcd(pct, 100);
        const k = randomInRange(1, Math.floor(100 / multiplier));
        const value = k * multiplier;
        const result = (value * pct) / 100;
        return { question: `${result} is what % of ${value}`, answer: pct };
    }
}

export function generateSquareRootQuestion(diff: Difficulty, range?: [number, number]): { question: string; answer: number } {
    let minRoot: number;
    let maxRoot: number;

    if (range) {
        [minRoot, maxRoot] = range;
    } else {
        const diffRanges: Record<Difficulty, [number, number]> = {
            easy: [1, 10],
            medium: [11, 25],
            hard: [26, 35],
        };
        [minRoot, maxRoot] = diffRanges[diff];
    }

    const root = randomInRange(minRoot, maxRoot);
    return { question: `√${root * root}`, answer: root };
}

const POW10 = [1, 10, 100, 1000, 10000];

export function generateApproximationQuestion(diff: Difficulty): { question: string; answer: number } {
    const ops: Operation[] = ['+', '-', '*'];
    const op = ops[Math.floor(Math.random() * (diff === 'easy' ? 2 : 3))];

    const digitsCount = diff === 'easy' ? 2 : diff === 'medium' ? 3 : 4;
    const min = POW10[digitsCount - 1];
    const max = POW10[digitsCount] - 1;
    const num1 = randomInRange(min, max);
    const num2 = randomInRange(min, max);

    let exactAnswer: number;
    switch (op) {
        case '+': exactAnswer = num1 + num2; break;
        case '-':
            if (num1 < num2) [num1, num2] = [num2, num1];
            exactAnswer = num1 - num2;
            break;
        default: exactAnswer = num1 * num2;
    }

    return { question: `${num1} ${getOperationSymbol(op)} ${num2} ≈ ?`, answer: exactAnswer };
}

export function generateNumberSeriesQuestion(diff: Difficulty): { question: string; answer: number } {
    const length = diff === 'easy' ? 5 : 6;
    const patterns = ['arithmetic', 'geometric', 'square', 'fibonacci'];
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    let series: number[] = [];

    switch (pattern) {
        case 'arithmetic': {
            const start = randomInRange(1, 20);
            const diff2 = randomInRange(2, 10);
            series = Array.from({ length }, (_, i) => start + i * diff2);
            break;
        }
        case 'geometric': {
            const start = randomInRange(1, 5);
            const ratio = randomInRange(2, 3);
            series = [];
            let val = start;
            for (let i = 0; i < length; i++) {
                if (val > 1000) {
                    series = [1, 2, 4, 8, 16, 32].slice(0, length);
                    break;
                }
                series.push(val);
                val *= ratio;
            }
            break;
        }
        case 'square': {
            const start = randomInRange(1, 5);
            series = Array.from({ length }, (_, i) => (start + i) * (start + i));
            break;
        }
        case 'fibonacci': {
            series = [1, 1, 2, 3, 5, 8, 13, 21].slice(0, length);
            break;
        }
    }

    if (series.length < length) {
        const start = randomInRange(1, 10);
        const diff2 = randomInRange(2, 5);
        series = Array.from({ length }, (_, i) => start + i * diff2);
    }

    const missingIndex = Math.floor(length / 2);
    const answer = series[missingIndex];
    series[missingIndex] = -1;

    return { question: series.map(n => n === -1 ? '?' : n).join(', '), answer };
}

export function generateRatioQuestion(diff: Difficulty): { question: string; answer: number } {
    const type = Math.random() < 0.5 ? 'findRatio' : 'findValue';

    if (type === 'findRatio') {
        const a = randomInRange(2, diff === 'hard' ? 20 : 10);
        const b = randomInRange(2, diff === 'hard' ? 20 : 10);
        const mult = randomInRange(2, 5);
        return { question: `If A:B = ${a}:${b}, then A:${b * mult} = ?`, answer: a * mult };
    } else {
        const ratio = randomInRange(2, diff === 'hard' ? 10 : 5);
        const a = randomInRange(2, 10) * ratio;
        return { question: `In ratio ${ratio}:1, if first number is ${a}, second = ?`, answer: a / ratio };
    }
}

export function generateChainCalculationQuestion(diff: Difficulty): { question: string; answer: number } {
    const operations: Operation[] = ['+', '-', '*'];
    const numOps = diff === 'easy' ? 2 : 3;
    const numbers = [randomInRange(2, diff === 'easy' ? 9 : 20)];

    for (let i = 0; i < numOps; i++) {
        numbers.push(randomInRange(2, diff === 'easy' ? 9 : 15));
    }

    let answer = numbers[0];
    let q = `${numbers[0]}`;

    for (let i = 0; i < numOps; i++) {
        const op = operations[randomInRange(0, operations.length - 1)];
        const n = numbers[i + 1];
        q += ` ${getOperationSymbol(op)} ${n}`;
        switch (op) {
            case '+': answer += n; break;
            case '-': answer -= n; break;
            case '*': answer *= n; break;
        }
    }

    return { question: q, answer: Math.round(answer) };
}