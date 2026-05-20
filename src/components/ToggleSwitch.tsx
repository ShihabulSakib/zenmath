interface ToggleSwitchProps {
    enabled: boolean;
    onChange: (value: boolean) => void;
    label?: string;
    description?: string;
    icon?: string;
}

export default function ToggleSwitch({ enabled, onChange, label, description, icon }: ToggleSwitchProps) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                {icon && (
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}>
                        {icon}
                    </span>
                )}
                <div>
                    {label && <span className="text-sm font-bold text-main">{label}</span>}
                    {description && <p className="text-[10px] text-secondary opacity-60 mt-0.5">{description}</p>}
                </div>
            </div>
            <button
                onClick={() => onChange(!enabled)}
                className={`relative w-12 h-7 rounded-full transition-colors duration-200 shrink-0 ${enabled ? 'bg-primary' : 'bg-toggle-off'}`}
                role="switch"
                aria-checked={enabled}
            >
                <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${enabled ? 'translate-x-5' : ''}`} />
            </button>
        </div>
    );
}

export function ToggleCard({ enabled, onChange, label, description, icon }: ToggleSwitchProps) {
    return (
        <div className="bg-card border border-card rounded-3xl p-5 shadow-sm">
            <ToggleSwitch enabled={enabled} onChange={onChange} label={label} description={description} icon={icon} />
        </div>
    );
}