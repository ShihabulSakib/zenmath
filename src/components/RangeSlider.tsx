interface RangeSliderProps {
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (value: number) => void;
}

export default function RangeSlider({ value, min, max, step, onChange }: RangeSliderProps) {
    const progress = ((value - min) / (max - min)) * 100;
    return (
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            style={{ "--range-progress": `${progress}%` } as React.CSSProperties}
        />
    );
}
