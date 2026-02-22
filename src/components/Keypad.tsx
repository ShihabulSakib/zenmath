interface KeypadProps {
    onKey: (key: string) => void;
    disabled?: boolean;
    showNegative?: boolean;
    showFraction?: boolean;
    showDecimal?: boolean;
}

export default function Keypad({ 
    onKey, 
    disabled = false, 
    showNegative = true, 
    showFraction = true,
    showDecimal = true 
}: KeypadProps) {
    const handlePress = (key: string) => {
        if (disabled) return;
        if (navigator.vibrate) navigator.vibrate(10);
        onKey(key);
    };

    const KeyButton = ({ k, label, isPrimary, isAction }: { k: string, label?: React.ReactNode, isPrimary?: boolean, isAction?: boolean }) => (
        <button
            onClick={() => handlePress(k)}
            disabled={disabled}
            className={`active:scale-[0.92] transition-all duration-100 flex items-center justify-center rounded-xl border shadow-sm disabled:opacity-40 h-14
                ${isPrimary 
                    ? 'bg-primary text-white border-primary shadow-primary/25 hover:brightness-110' 
                    : isAction 
                        ? 'bg-keypad-btn border-keypad-border text-keypad-text/70'
                        : 'bg-keypad-btn border-keypad-border text-keypad-text hover:shadow-md'
                }`}
        >
            <span className={isAction ? "material-symbols-outlined" : "text-[22px] font-semibold"}>
                {label || k}
            </span>
        </button>
    );

    return (
        <section className="w-full h-full bg-keypad-bg flex flex-col">
            {/* Separator line */}
            <div className="h-px bg-keypad-border/50" />

            {/* Grid layout */}
            <div className="flex-1 grid grid-cols-4 gap-2.5 p-3 pb-6">
                {/* Row 1 */}
                <KeyButton k="1" />
                <KeyButton k="2" />
                <KeyButton k="3" />
                <KeyButton k="backspace" label="backspace" isAction />

                {/* Row 2 */}
                <KeyButton k="4" />
                <KeyButton k="5" />
                <KeyButton k="6" />
                {showNegative ? <KeyButton k="-" label="−" /> : <div className="h-14" />}

                {/* Row 3 */}
                <KeyButton k="7" />
                <KeyButton k="8" />
                <KeyButton k="9" />
                {showFraction ? <KeyButton k="/" label="/" /> : <KeyButton k="/" label="÷" />}

                {/* Row 4 */}
                {showDecimal ? <KeyButton k="." label="." /> : <div className="h-14" />}
                <KeyButton k="0" />
                <div className="col-span-2">
                    <KeyButton k="enter" label="check" isPrimary isAction />
                </div>
            </div>
        </section>
    );
}
