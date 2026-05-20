import { useState, useEffect } from 'react';

export default function OfflineIndicator() {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!isOffline) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-incorrect/90 backdrop-blur-sm px-4 py-2 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-on-primary text-sm">cloud_off</span>
            <span className="text-xs font-bold text-on-primary uppercase tracking-wider">You are offline — results will save locally</span>
        </div>
    );
}