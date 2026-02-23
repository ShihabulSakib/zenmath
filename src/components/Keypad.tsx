interface KeypadProps {
    onKey: (key: string) => void;
    disabled?: boolean;
    showNegative?: boolean;
    showFraction?: boolean;
    showDecimal?: boolean;
}

interface KeyButtonProps {
    k: string;
    label?: React.ReactNode;
    isPrimary?: boolean;
    isAction?: boolean;
    disabled: boolean;
    onClick: (k: string) => void;
}

const KeyButton = ({ k, label, isPrimary, isAction, disabled, onClick }: KeyButtonProps) => (
    <button
        onClick={() => onClick(k)}
        disabled={disabled}
        className={`active:scale-[0.92] transition-all duration-100 flex items-center justify-center rounded-xl border shadow-sm disabled:opacity-40 h-14
            ${isPrimary
                ? 'bg-primary text-white border-primary shadow-primary/25'
                : isAction
                    ? 'bg-keypad-btn border-keypad-border text-keypad-text/70'
                    : 'bg-keypad-btn border-keypad-border text-keypad-text'
            }`}
    >
        <span className={isAction ? "material-symbols-outlined" : "text-[22px] font-semibold"}>
            {label || k}
        </span>
    </button>
);

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

    return (
        <section className="w-full h-full bg-keypad-bg flex flex-col">
            {/* Separator line */}
            <div className="h-px bg-keypad-border/50" />

            {/* Grid layout */}
            <div className="flex-1 grid grid-cols-4 gap-2.5 p-3 pb-6">
                {/* Row 1 */}
                <KeyButton k="1" disabled={disabled} onClick={handlePress} />
                <KeyButton k="2" disabled={disabled} onClick={handlePress} />
                <KeyButton k="3" disabled={disabled} onClick={handlePress} />
                <KeyButton k="backspace" label="backspace" isAction disabled={disabled} onClick={handlePress} />

                {/* Row 2 */}
                <KeyButton k="4" disabled={disabled} onClick={handlePress} />
                <KeyButton k="5" disabled={disabled} onClick={handlePress} />
                <KeyButton k="6" disabled={disabled} onClick={handlePress} />
                {showNegative ? <KeyButton k="-" label="−" disabled={disabled} onClick={handlePress} /> : <div className="h-14" />}

                {/* Row 3 */}
                <KeyButton k="7" disabled={disabled} onClick={handlePress} />
                <KeyButton k="8" disabled={disabled} onClick={handlePress} />
                <KeyButton k="9" disabled={disabled} onClick={handlePress} />
                {showFraction ? <KeyButton k="/" label="/" disabled={disabled} onClick={handlePress} /> : <KeyButton k="/" label="÷" disabled={disabled} onClick={handlePress} />}

                {/* Row 4 */}
                {showDecimal ? <KeyButton k="." label="." disabled={disabled} onClick={handlePress} /> : <div className="h-14" />}
                <KeyButton k="0" disabled={disabled} onClick={handlePress} />
                <div className="col-span-2">
                    <KeyButton k="enter" label="check" isPrimary isAction disabled={disabled} onClick={handlePress} />
                </div>
            </div>
        </section>
    );
}
