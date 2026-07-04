import { useMemo, useState, useCallback } from 'react';

interface HorizonWaveProps {
    sessions: { date: string; totalQuestions: number; correct?: number; avgTimeMs?: number }[];
}

interface DayBucket {
    date: string;        // 'YYYY-MM-DD'
    label: string;       // e.g. 'Mon'
    questions: number;
    correct: number;
    accuracy: number;
    avgSpeed: number;    // seconds
    sessions: number;
}

/**
 * HorizonWave — A lightweight, pure-SVG area chart component
 * showing question volume over the last 10 days.
 *
 * Design philosophy:
 * - Zero external dependencies (no chart libraries)
 * - GPU-accelerated SVG rendering (smooth on low-end Android)
 * - Monotone cubic spline interpolation for natural curves
 * - CSS-only animations (no JS animation loops)
 * - Touch-friendly tap targets for mobile
 */
export default function HorizonWave({ sessions }: HorizonWaveProps) {
    const [activeIdx, setActiveIdx] = useState<number | null>(null);

    // ── Aggregate sessions into day buckets (last 10 days) ──────────
    const buckets = useMemo<DayBucket[]>(() => {
        const now = new Date();
        const days: DayBucket[] = [];

        for (let i = 9; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3);
            days.push({
                date: dateStr,
                label: dayLabel,
                questions: 0,
                correct: 0,
                accuracy: 0,
                avgSpeed: 0,
                sessions: 0,
            });
        }

        // Bucket sessions by date
        sessions.forEach(s => {
            const sDate = s.date.split('T')[0];
            const bucket = days.find(d => d.date === sDate);
            if (bucket) {
                bucket.questions += s.totalQuestions;
                bucket.correct += (s as any).correct ?? 0;
                bucket.sessions += 1;
                // Accumulate total time for weighted average
                if ((s as any).avgTimeMs) {
                    bucket.avgSpeed += ((s as any).avgTimeMs / 1000) * s.totalQuestions;
                }
            }
        });

        // Compute derived stats
        days.forEach(d => {
            d.accuracy = d.questions > 0 ? Math.round((d.correct / d.questions) * 100) : 0;
            d.avgSpeed = d.questions > 0 ? d.avgSpeed / d.questions : 0;
        });

        return days;
    }, [sessions]);

    // ── Derived metrics ─────────────────────────────────────────────
    const { maxQ, totalQ, peakDay, avgDaily } = useMemo(() => {
        let max = 0;
        let total = 0;
        let peakIdx = 0;
        buckets.forEach((b, i) => {
            total += b.questions;
            if (b.questions > max) {
                max = b.questions;
                peakIdx = i;
            }
        });
        return {
            maxQ: Math.max(max, 1), // avoid div-by-zero
            totalQ: total,
            peakDay: buckets[peakIdx],
            avgDaily: Math.round(total / 10),
        };
    }, [buckets]);

    // ── SVG dimensions ──────────────────────────────────────────────
    const W = 340;
    const H = 120;
    const PAD_X = 8;
    const PAD_TOP = 12;
    const PAD_BOTTOM = 4;
    const chartW = W - PAD_X * 2;
    const chartH = H - PAD_TOP - PAD_BOTTOM;

    // Map buckets to SVG coordinate points
    const points = useMemo(() => {
        return buckets.map((b, i) => ({
            x: PAD_X + (i / (buckets.length - 1)) * chartW,
            y: PAD_TOP + chartH - (b.questions / maxQ) * chartH,
        }));
    }, [buckets, maxQ, chartW, chartH]);

    // ── Monotone cubic interpolation (Fritsch-Carlson) ──────────────
    // Produces a smooth, overshoot-free curve that respects data monotonicity
    const svgPath = useMemo(() => {
        const n = points.length;
        if (n < 2) return '';

        // Compute slopes
        const dx: number[] = [];
        const dy: number[] = [];
        const m: number[] = [];

        for (let i = 0; i < n - 1; i++) {
            dx.push(points[i + 1].x - points[i].x);
            dy.push(points[i + 1].y - points[i].y);
            m.push(dy[i] / dx[i]);
        }

        // Compute tangents using Fritsch-Carlson method
        const tangents: number[] = [m[0]];
        for (let i = 1; i < n - 1; i++) {
            if (m[i - 1] * m[i] <= 0) {
                tangents.push(0);
            } else {
                tangents.push((m[i - 1] + m[i]) / 2);
            }
        }
        tangents.push(m[n - 2]);

        // Build cubic bezier path
        let d = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
        for (let i = 0; i < n - 1; i++) {
            const segLen = dx[i] / 3;
            const cp1x = points[i].x + segLen;
            const cp1y = points[i].y + tangents[i] * segLen;
            const cp2x = points[i + 1].x - segLen;
            const cp2y = points[i + 1].y - tangents[i + 1] * segLen;
            d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${points[i + 1].x.toFixed(1)},${points[i + 1].y.toFixed(1)}`;
        }

        return d;
    }, [points]);

    // Closed area path (for gradient fill)
    const areaPath = useMemo(() => {
        if (!svgPath) return '';
        const bottomY = PAD_TOP + chartH;
        return `${svgPath} L ${points[points.length - 1].x.toFixed(1)},${bottomY} L ${points[0].x.toFixed(1)},${bottomY} Z`;
    }, [svgPath, points, chartH]);

    // Handle dot interaction (works for both touch + mouse)
    const handleDotInteract = useCallback((idx: number) => {
        setActiveIdx(prev => prev === idx ? null : idx);
    }, []);

    const activeBucket = activeIdx !== null ? buckets[activeIdx] : null;

    const hasData = totalQ > 0;

    return (
        <div className="bg-card border border-card rounded-2xl p-5 relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-black uppercase tracking-widest text-secondary opacity-60">
                    Session Flow
                </h3>
                <span className="material-symbols-outlined text-primary opacity-60" style={{ fontSize: 18 }}>
                    stacked_line_chart
                </span>
            </div>

            {!hasData ? (
                /* ── Empty state ── */
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <span className="material-symbols-outlined text-secondary opacity-30" style={{ fontSize: 36 }}>
                        show_chart
                    </span>
                    <p className="text-[11px] text-secondary opacity-50">
                        Complete sessions to see your activity wave
                    </p>
                </div>
            ) : (
                <>
                    {/* ── SVG Chart ── */}
                    <div className="relative" style={{ aspectRatio: `${W}/${H + 20}` }}>
                        <svg
                            viewBox={`0 0 ${W} ${H + 20}`}
                            className="w-full h-full"
                            preserveAspectRatio="xMidYMid meet"
                            style={{ overflow: 'visible' }}
                        >
                            <defs>
                                {/* Area gradient */}
                                <linearGradient id="horizonGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" className="horizon-grad-start" />
                                    <stop offset="100%" className="horizon-grad-end" />
                                </linearGradient>
                                {/* Glow filter (lightweight) - Commented out for now
                                <filter id="horizonGlow" x="-10%" y="-10%" width="120%" height="120%">
                                    <feGaussianBlur stdDeviation="2" result="blur" />
                                    <feMerge>
                                        <feMergeNode in="blur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                                */}
                            </defs>

                            {/* Horizontal grid lines (subtle) */}
                            {[0.25, 0.5, 0.75].map(frac => {
                                const gy = PAD_TOP + chartH * (1 - frac);
                                return (
                                    <line
                                        key={frac}
                                        x1={PAD_X}
                                        y1={gy}
                                        x2={W - PAD_X}
                                        y2={gy}
                                        className="horizon-gridline"
                                        strokeDasharray="2 4"
                                    />
                                );
                            })}

                            {/* Area fill */}
                            <path
                                d={areaPath}
                                fill="url(#horizonGrad)"
                                className="horizon-area"
                            />

                            {/* Line stroke */}
                            <path
                                d={svgPath}
                                fill="none"
                                className="horizon-line"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                /* filter="url(#horizonGlow)" */
                            />

                            {/* Data points (touch targets) */}
                            {points.map((pt, i) => (
                                <g key={i}>
                                    {/* Invisible larger hit area for touch */}
                                    <circle
                                        cx={pt.x}
                                        cy={pt.y}
                                        r={14}
                                        fill="transparent"
                                        onPointerDown={() => handleDotInteract(i)}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    {/* Visible dot */}
                                    <circle
                                        cx={pt.x}
                                        cy={pt.y}
                                        r={activeIdx === i ? 4.5 : 3}
                                        className={activeIdx === i ? 'horizon-dot-active' : 'horizon-dot'}
                                    />
                                    {/* Active vertical indicator line */}
                                    {activeIdx === i && (
                                        <line
                                            x1={pt.x}
                                            y1={pt.y + 5}
                                            x2={pt.x}
                                            y2={PAD_TOP + chartH}
                                            className="horizon-indicator"
                                            strokeDasharray="2 3"
                                        />
                                    )}
                                </g>
                            ))}

                            {/* Day labels along bottom */}
                            {points.map((pt, i) => (
                                <text
                                    key={`label-${i}`}
                                    x={pt.x}
                                    y={H + 14}
                                    textAnchor="middle"
                                    className="horizon-day-label"
                                >
                                    {buckets[i].label}
                                </text>
                            ))}
                        </svg>
                    </div>

                    {/* ── Tooltip / Active Day Detail ── */}
                    {activeBucket ? (
                        <div className="flex items-center justify-between mt-2 px-1 py-2 rounded-xl bg-surface border border-card transition-all">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-secondary uppercase tracking-wider">
                                    {new Date(activeBucket.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}
                                </span>
                                <span className="text-lg font-black text-main tracking-tight leading-tight">
                                    {activeBucket.questions}
                                    <span className="text-[10px] font-semibold text-secondary ml-1">questions</span>
                                </span>
                            </div>
                            <div className="flex gap-3">
                                <div className="flex flex-col items-center">
                                    <span className="text-[8px] font-bold text-secondary uppercase">Acc</span>
                                    <span className={`text-xs font-black ${activeBucket.accuracy >= 80 ? 'text-correct' : activeBucket.accuracy >= 50 ? 'text-primary' : 'text-incorrect'}`}>
                                        {activeBucket.accuracy}%
                                    </span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-[8px] font-bold text-secondary uppercase">Speed</span>
                                    <span className="text-xs font-black text-main">
                                        {activeBucket.avgSpeed > 0 ? activeBucket.avgSpeed.toFixed(1) + 's' : '—'}
                                    </span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-[8px] font-bold text-secondary uppercase">Sets</span>
                                    <span className="text-xs font-black text-main">{activeBucket.sessions}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* ── Summary Footer (when no day selected) ── */
                        <div className="flex items-center justify-between mt-2 px-1">
                            <div className="flex gap-4">
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-bold text-secondary uppercase tracking-wider">10d Total</span>
                                    <span className="text-sm font-black text-main">{totalQ}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-bold text-secondary uppercase tracking-wider">Avg/day</span>
                                    <span className="text-sm font-black text-main">{avgDaily}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-bold text-secondary uppercase tracking-wider">Peak</span>
                                    <span className="text-sm font-black text-main">
                                        {peakDay.questions}
                                        <span className="text-[8px] font-semibold text-secondary ml-0.5">{peakDay.label}</span>
                                    </span>
                                </div>
                            </div>
                            <span className="text-[9px] text-secondary opacity-40">Tap a point</span>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
