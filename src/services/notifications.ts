const NOTIFICATION_PERMISSION_KEY = 'zenmath-notification-permission';
const NOTIFICATION_TIMES_KEY = 'zenmath-notification-times';
const LAST_NOTIFICATION_DATE_KEY = 'zenmath-last-notification-date';

export type NotificationTime = '20:00' | '21:00' | '22:00' | '23:00';

export async function requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
        console.warn('Notifications not supported in this browser');
        return 'denied';
    }
    
    console.log('Requesting notification permission...');
    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    localStorage.setItem(NOTIFICATION_PERMISSION_KEY, permission);
    return permission;
}

export function getNotificationPermission(): NotificationPermission {
    return (localStorage.getItem(NOTIFICATION_PERMISSION_KEY) as NotificationPermission) || 'default';
}

export function getNotificationTimes(): NotificationTime[] {
    // First check settings (new way)
    const settings = JSON.parse(localStorage.getItem('zenmath-settings') || '{}');
    if (settings.notificationTimes && Array.isArray(settings.notificationTimes)) {
        return settings.notificationTimes as NotificationTime[];
    }
    
    // Fallback to old storage key
    const stored = localStorage.getItem(NOTIFICATION_TIMES_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch {
            return ['21:00'];
        }
    }
    return ['21:00'];
}

export function setNotificationTimes(times: NotificationTime[]): void {
    localStorage.setItem(NOTIFICATION_TIMES_KEY, JSON.stringify(times));
}

export function canDecreaseGoal(): boolean {
    const today = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem('zenmath-daily-progress');
    console.log('canDecreaseGoal check:', { stored, today });
    
    if (!stored) {
        console.log('No stored progress, returning false');
        return false;
    }
    
    try {
        const { date, count } = JSON.parse(stored);
        const settings = JSON.parse(localStorage.getItem('zenmath-settings') || '{}');
        const dailyGoal = settings.dailyGoal || 5;
        
        console.log('Progress check:', { date, count, today, dailyGoal, sameDay: date === today });
        
        // Only allow decrease if goal is achieved today
        if (date === today && count >= dailyGoal) {
            console.log('Goal achieved, can decrease');
            return true;
        }
        console.log('Goal not achieved, cannot decrease');
        return false;
    } catch (e) {
        console.log('Error parsing progress:', e);
        return false;
    }
}

export function getTodayProgress(): { count: number; goal: number; goalAchieved: boolean } {
    const today = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem('zenmath-daily-progress');
    const settings = JSON.parse(localStorage.getItem('zenmath-settings') || '{}');
    const dailyGoal = settings.dailyGoal || 5;
    
    let count = 0;
    if (stored) {
        try {
            const { date, count: c } = JSON.parse(stored);
            if (date === today) {
                count = c;
            }
        } catch {
            count = 0;
        }
    }
    
    return {
        count,
        goal: dailyGoal,
        goalAchieved: count >= dailyGoal
    };
}

export async function showLocalNotification(title: string, body: string): Promise<void> {
    console.log('showLocalNotification called');
    
    if (!('Notification' in window)) {
        console.error('Notifications not supported in this browser');
        alert('Notifications not supported in this browser');
        return;
    }
    
    const permission = Notification.permission;
    console.log('Current permission:', permission);
    
    if (permission === 'default') {
        const result = await Notification.requestPermission();
        console.log('Permission result:', result);
        
        if (result !== 'granted') {
            alert('Notifications not allowed. Please enable in browser settings.');
            return;
        }
    }
    
    if (permission !== 'granted' && permission !== 'default') {
        alert('Notifications blocked. Please enable in browser settings.');
        return;
    }
    
    console.log('Creating notification via Service Worker...');
    
    try {
        // Use ServiceWorker to show notification (required for PWA)
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            // Send message to service worker to show notification
            navigator.serviceWorker.controller.postMessage({
                type: 'SHOW_NOTIFICATION',
                title: title,
                body: body,
                icon: '/pwa-192x192.png',
                badge: '/pwa-192x192.png',
                tag: 'daily-reminder'
            });
            
            alert('Notification sent! Check your notification tray.');
        } else {
            // Fallback: try direct notification if service worker not available
            console.log('No active service worker, using direct notification');
            const notification = new Notification(title, {
                body,
                icon: '/pwa-192x192.png',
                tag: 'daily-reminder'
            });
            
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
            
            alert('Notification sent! Check your notification tray.');
        }
    } catch (e) {
        console.error('Error creating notification:', e);
        alert('Failed to show notification: ' + e);
    }
}

export async function registerPeriodicSync(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
        console.warn('Service Worker not supported');
        return false;
    }
    
    if (!('periodicSync' in window)) {
        console.warn('Periodic Background Sync not supported');
        return false;
    }
    
    try {
        const registration = await navigator.serviceWorker.ready;
        const status = await (navigator.permissions as any).query({ name: 'periodic-background-sync' });
        
        if (status.state !== 'granted') {
            console.warn('Periodic sync permission not granted');
            return false;
        }
        
        await (registration as any).periodicSync.register('daily-reminder', {
            minInterval: 24 * 60 * 60 * 1000
        });
        
        console.log('Periodic sync registered');
        return true;
    } catch (e) {
        console.error('Failed to register periodic sync:', e);
        return false;
    }
}

export function shouldSendNotification(): boolean {
    const settings = JSON.parse(localStorage.getItem('zenmath-settings') || '{}');
    if (!settings.notificationsEnabled) {
        return false;
    }
    
    const { count, goal } = getTodayProgress();
    if (count >= goal) {
        return false;
    }
    
    const today = new Date().toISOString().split('T')[0];
    const lastDate = localStorage.getItem(LAST_NOTIFICATION_DATE_KEY);
    
    const times = getNotificationTimes();
    const now = new Date();
    const currentHour = now.getHours();
    
    for (const time of times) {
        const [hour] = time.split(':').map(Number);
        if (currentHour >= hour) {
            if (lastDate !== today) {
                return true;
            }
        }
    }
    
    return false;
}

export function recordNotificationSent(): void {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(LAST_NOTIFICATION_DATE_KEY, today);
}

export async function checkAndShowNotification(): Promise<void> {
    console.log('checkAndShowNotification called');
    console.log('Notification permission:', Notification.permission);
    
    if (Notification.permission !== 'granted') {
        console.log('No notification permission, skipping');
        return;
    }
    
    const settings = JSON.parse(localStorage.getItem('zenmath-settings') || '{}');
    console.log('Settings:', settings);
    
    if (!settings.notificationsEnabled) {
        console.log('Notifications not enabled in settings');
        return;
    }
    
    const { count, goal } = getTodayProgress();
    console.log('Progress:', { count, goal });
    
    if (count >= goal) {
        console.log('Goal already achieved');
        return;
    }
    
    const times = getNotificationTimes();
    const now = new Date();
    const currentHour = now.getHours();
    const today = new Date().toISOString().split('T')[0];
    
    // Get already sent times today
    const sentTimes = JSON.parse(localStorage.getItem('zenmath-notification-sent-times') || '{}');
    const todaySent = sentTimes[today] || [];
    
    console.log('Current hour:', currentHour, 'Configured times:', times, 'Already sent:', todaySent);
    
    for (const time of times) {
        const [hour] = time.split(':').map(Number);
        
        // Check if we've passed this time AND haven't sent for this time slot
        if (currentHour >= hour && !todaySent.includes(time)) {
            // Don't send more than 3 notifications per day
            if (todaySent.length >= 3) {
                console.log('Max notifications sent today');
                continue;
            }
            
            console.log('Sending notification for time:', time);
            const remaining = goal - count;
            
            // Use showLocalNotification for consistent handling
            await showLocalNotification(
                'ZenMath - Daily Practice Reminder',
                `You have ${remaining} exercises left to reach your daily goal of ${goal}! Keep going! 💪`
            );
            
            // Record that we sent this notification
            const newSentTimes = { ...sentTimes, [today]: [...todaySent, time] };
            localStorage.setItem('zenmath-notification-sent-times', JSON.stringify(newSentTimes));
            localStorage.setItem(LAST_NOTIFICATION_DATE_KEY, today);
            
            return;
        }
    }
    
    console.log('No notification time matched or already sent');
}