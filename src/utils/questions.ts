import type { Difficulty, Operation } from '../hooks/useGameLogic';

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
                const qMin = Math.ceil(targetMin / num2);
                const qMax = Math.floor(targetMax / num2);
                const q = randomInRange(Math.max(1, qMin), Math.max(1, qMin, qMax));
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
        const multiplier = pct === 25 ? 4 : pct === 50 ? 2 : pct === 75 ? 4/3 : 10;
        const baseNum = pct === 75 ? randomInRange(2, 12) : randomInRange(2, 10);
        const baseValue = Math.round(baseNum * multiplier);
        const answer = Math.round((pct / 100) * baseValue);
        return { question: `${pct}% of ${baseValue}`, answer };
    }

    const type = Math.random() < 0.5 ? 'percentOf' : 'whatPercent';
    if (type === 'percentOf') {
        const pct = randomInRange(1, 20) * 5;
        const value = randomInRange(10, 50 + (diff === 'hard' ? 50 : 0));
        const answer = Math.round((pct * value) / 100);
        return { question: `${pct}% of ${value}`, answer };
    } else {
        const pct = randomInRange(1, 20) * 5;
        const result = randomInRange(2, 20);
        const value = Math.round((result * 100) / pct);
        const answer = pct;
        return { question: `${result} is what % of ${value}`, answer };
    }
}

export function generateSquareRootQuestion(diff: Difficulty): { question: string; answer: number } {
    let maxRoot = diff === 'easy' ? 15 : diff === 'medium' ? 25 : 40;
    const root = randomInRange(2, maxRoot);
    const perfect = diff === 'hard' ? Math.random() > 0.7 : Math.random() > 0.5;
    let num: number;

    if (perfect || diff === 'easy') {
        num = root * root;
    } else {
        const offset = randomInRange(-3, 3);
        num = (root + offset) * (root + offset);
        if (num < 1) num = root * root;
    }

    return { question: `√${num}`, answer: root };
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
            exactAnswer = num1 >= num2 ? num1 - num2 : num2 - num1;
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