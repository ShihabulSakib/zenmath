import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextValue {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
    theme: 'dark',
    toggleTheme: () => { },
});

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
    return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>(() => {
        try {
            const saved = localStorage.getItem('zenmath-theme');
            return (saved === 'light' || saved === 'dark') ? saved : 'dark';
        } catch {
            return 'dark';
        }
    });

    useEffect(() => {
        localStorage.setItem('zenmath-theme', theme);
        document.documentElement.classList.toggle('light', theme === 'light');
        document.documentElement.classList.toggle('dark', theme === 'dark');

        // Update meta theme-color
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', theme === 'light' ? '#F4F4F5' : '#000000');
        }
    }, [theme]);

    const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
