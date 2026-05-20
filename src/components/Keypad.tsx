interface KeypadProps {
    onKey: (key: string) => void;
    disabled?: boolean;
    showNegative?: boolean;
    showFraction?: boolean;
    showDecimal?: boolean;
    hapticFeedback?: boolean;
}

interface KeyButtonProps {
    k: string;
    label?: React.ReactNode;
    isPrimary?: boolean;
    isAction?: boolean;
    disabled: boolean;
    onClick: (k: string) => void;
    className?: string;
}

const KeyButton = ({ k, label, isPrimary, isAction, disabled, onClick, className }: KeyButtonProps) => (
    <button
        onClick={() => onClick(k)}
        disabled={disabled}
        className={`active:scale-[0.92] transition-all duration-100 flex items-center justify-center rounded-xl border shadow-sm disabled:opacity-40 h-full w-full
            ${isPrimary
                ? 'bg-primary text-on-primary border-primary'
                : isAction
                    ? 'bg-keypad-btn border-keypad-border text-keypad-text/70'
                    : 'bg-keypad-btn border-keypad-border text-keypad-text'
            } ${className || ''}`}
    >
        <span className={`${isAction ? "material-symbols-outlined" : "text-[22px] font-semibold"} ${isPrimary ? "!text-on-primary" : ""}`}>
            {label || k}
        </span>
    </button>
);

export default function Keypad({
    onKey,
    disabled = false,
    showNegative = true,
    showFraction = true,
    showDecimal = true,
    hapticFeedback = true
}: KeypadProps) {
    const handlePress = (key: string) => {
        if (disabled) return;
        if (hapticFeedback && navigator.vibrate) navigator.vibrate(10);
        onKey(key);
    };

    return (
        <section className="w-full h-full bg-keypad-bg flex flex-col">
            {/* Separator line */}
            <div className="h-px bg-keypad-border/50" />

            {/* Grid layout */}
            <div className="flex-1 grid grid-cols-4 grid-rows-4 gap-2.5 p-3 pb-6">
                {/* Row 1 */}
                <KeyButton k="1" disabled={disabled} onClick={handlePress} />
                <KeyButton k="2" disabled={disabled} onClick={handlePress} />
                <KeyButton k="3" disabled={disabled} onClick={handlePress} />
                <KeyButton k="backspace" label="backspace" isAction disabled={disabled} onClick={handlePress} />

                {/* Row 2 */}
                <KeyButton k="4" disabled={disabled} onClick={handlePress} />
                <KeyButton k="5" disabled={disabled} onClick={handlePress} />
                <KeyButton k="6" disabled={disabled} onClick={handlePress} />
                {showNegative ? (
                    <KeyButton k="-" label="−" disabled={disabled} onClick={handlePress} />
                ) : (
                    <div className="h-full" />
                )}

                {/* Row 3 */}
                <KeyButton k="7" disabled={disabled} onClick={handlePress} />
                <KeyButton k="8" disabled={disabled} onClick={handlePress} />
                <KeyButton k="9" disabled={disabled} onClick={handlePress} />
                <KeyButton
                    k="enter"
                    label="check"
                    isPrimary
                    isAction
                    disabled={disabled}
                    onClick={handlePress}
                    className="row-span-2"
                />

                {/* Row 4 */}
                {showDecimal ? (
                    <KeyButton k="." label="." disabled={disabled} onClick={handlePress} />
                ) : (
                    <div className="h-full" />
                )}
                <KeyButton k="0" disabled={disabled} onClick={handlePress} />
                {showFraction ? (
                    <KeyButton k="/" label="/" disabled={disabled} onClick={handlePress} />
                ) : (
                    <KeyButton k="/" label="÷" disabled={disabled} onClick={handlePress} />
                )}
            </div>
        </section>
    );
}
