interface ProgressBarProps {
    value: number;
    max: number;
    className?: string;
    color?: string;
    glow?: boolean;
}

export default function ProgressBar({ value, max, className = '', color = 'bg-primary', glow = true }: ProgressBarProps) {
    const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;

    return (
        <div className={`h-1.5 w-full bg-midnight-border rounded-full overflow-hidden ${className}`}>
            <div
                className={`h-full ${color} rounded-full transition-all duration-300 ease-linear ${glow ? 'shadow-[0_0_8px_rgba(13,89,242,0.4)]' : ''}`}
                style={{ width: `${pct}%` }}
            />
        </div>
    );
}