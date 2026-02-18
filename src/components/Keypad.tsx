interface KeypadProps {
    onKey: (key: string) => void;
    disabled?: boolean;
    showNegative?: boolean;
}

export default function Keypad({ onKey, disabled = false, showNegative = false }: KeypadProps) {
    const digitKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

    const handlePress = (key: string) => {
        if (disabled) return;
        if (navigator.vibrate) navigator.vibrate(10);
        onKey(key);
    };

    const digitButton = (key: string) => (
        <button
            key={key}
            onClick={() => handlePress(key)}
            disabled={disabled}
            className="active:scale-[0.92] transition-all duration-100 flex items-center justify-center rounded-xl bg-keypad-btn border border-keypad-border shadow-sm hover:shadow-md text-keypad-text disabled:opacity-40"
        >
            <span className="text-[22px] font-semibold">{key}</span>
        </button>
    );

    return (
        <section className="w-full h-full bg-keypad-bg flex flex-col">
            {/* Separator line */}
            <div className="h-px bg-keypad-border/50" />

            {/* 4-row grid that fills the space */}
            <div className="flex-1 grid grid-cols-3 grid-rows-4 gap-2.5 p-3 pb-6">
                {/* Row 1-3: digits 1-9 */}
                {digitKeys.map(digitButton)}

                {/* Row 4: action | 0 | enter */}
                {showNegative ? (
                    <button
                        onClick={() => handlePress('-')}
                        disabled={disabled}
                        className="active:scale-[0.92] transition-all duration-100 flex items-center justify-center rounded-xl bg-keypad-btn border border-keypad-border shadow-sm text-keypad-text disabled:opacity-40"
                    >
                        <span className="text-[22px] font-semibold">±</span>
                    </button>
                ) : (
                    <button
                        onClick={() => handlePress('backspace')}
                        disabled={disabled}
                        className="active:scale-[0.92] transition-all duration-100 flex items-center justify-center rounded-xl bg-keypad-btn border border-keypad-border shadow-sm text-keypad-text/60 hover:text-red-500 disabled:opacity-40"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 26 }}>backspace</span>
                    </button>
                )}

                {digitButton('0')}

                <button
                    onClick={() => handlePress('enter')}
                    disabled={disabled}
                    className="active:scale-[0.92] transition-all duration-100 flex items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/25 hover:brightness-110 disabled:opacity-40"
                >
                    <span className="material-symbols-outlined" style={{ fontSize: 28 }}>check</span>
                </button>
            </div>
        </section>
    );
}
