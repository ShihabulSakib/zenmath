interface NavbarProps {
    activeScreen: string;
    onNavigate: (screen: 'menu' | 'stats' | 'history' | 'settings' | 'revision') => void;
    dailyProgress: number;
    dailyGoal: number;
}

export default function Navbar({ activeScreen, onNavigate, dailyProgress, dailyGoal }: NavbarProps) {
    const progressPercent = Math.min(100, (dailyProgress / (dailyGoal || 1)) * 100);

    const navItems = [
        { id: 'menu', icon: 'school', label: 'Practice' },
        { id: 'revision', icon: 'menu_book', label: 'Revision' },
        { id: 'history', icon: 'history', label: 'History' },
        { id: 'stats', icon: 'analytics', label: 'Stats' },
        { id: 'settings', icon: 'tune', label: 'Settings' },
    ];

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50">
            <nav className="relative bg-card/70 backdrop-blur-2xl border border-white/10 rounded-[30px] p-2 flex justify-around items-center shadow-2xl">
                {navItems.map((item) => {
                    const isActive = activeScreen === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id as any)}
                            className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 relative ${
                                isActive ? 'text-primary' : 'text-secondary/60 hover:text-secondary'
                            }`}
                        >
                            <span 
                                className="material-symbols-outlined" 
                                style={{ 
                                    fontSize: 24,
                                    fontVariationSettings: isActive ? "'FILL' 1, 'wght' 300" : "'FILL' 0, 'wght' 200"
                                }}
                            >
                                {item.icon}
                            </span>
                            
                            {isActive && (
                                <span className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_var(--primary)]" />
                            )}
                        </button>
                    );
                })}

                {/* Micro-Progress Line */}
                <div className="absolute bottom-0 left-8 right-8 h-[2px] bg-white/5 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-primary transition-all duration-700 ease-out shadow-[0_0_8px_var(--primary)]"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </nav>
        </div>
    );
}
