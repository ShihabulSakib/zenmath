import type { ReactNode } from 'react';

interface ZenLayoutProps {
    children: ReactNode;
}

export default function ZenLayout({ children }: ZenLayoutProps) {
    return (
        <div className="bg-surface min-h-[100dvh] h-[100dvh] flex flex-col antialiased relative">
            {children}
        </div>
    );
}
