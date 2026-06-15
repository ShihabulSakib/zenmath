const NOTIFICATION_PERMISSION_KEY = 'zenmath-notification-permission';
const SETTINGS_KEY = 'zenmath-settings';
const DAILY_PROGRESS_KEY = 'zenmath-daily-progress';
const SENT_TIMES_KEY = 'zenmath-notification-sent-times';

export type NotificationTime = '08:00' | '12:00' | '15:00' | '18:00' | '20:00';

export interface TimeSlotInfo {
  value: NotificationTime;
  label: string;
  period: 'morning' | 'midday' | 'afternoon' | 'evening' | 'night';
}

export const TIME_SLOTS: TimeSlotInfo[] = [
  { value: '08:00', label: '8:00 AM', period: 'morning' },
  { value: '12:00', label: '12:00 PM', period: 'midday' },
  { value: '15:00', label: '3:00 PM', period: 'afternoon' },
  { value: '18:00', label: '6:00 PM', period: 'evening' },
  { value: '20:00', label: '8:00 PM', period: 'night' },
];

type FeedbackCallback = (message: string) => void;
let feedbackCallback: FeedbackCallback | null = null;

export function setFeedbackCallback(cb: FeedbackCallback | null) {
  feedbackCallback = cb;
}

function notify(msg: string) {
  if (feedbackCallback) {
    feedbackCallback(msg);
  }
}

// ── Cache ────────────────────────────────────────────────────

interface CachedSettings {
  notificationsEnabled: boolean;
  notificationTimes: NotificationTime[];
  dailyGoal: number;
}

const SW_BRIDGE_CACHE = 'zenmath-sw-bridge';
const SW_BRIDGE_KEY = '/sw-bridge-data.json';

/**
 * Bridges app state to the Service Worker via Cache API.
 * This is necessary because SW cannot access localStorage.
 */
async function syncStateToServiceWorker() {
  if (!('caches' in window)) return;
  
  const settings = readSettings();
  const progress = getTodayProgress();
  const streak = getStreak();
  const today = new Date().toISOString().split('T')[0];
  
  const sentTimesRaw = localStorage.getItem(SENT_TIMES_KEY);
  const sentTimes = sentTimesRaw ? JSON.parse(sentTimesRaw) : {};

  const bridgeData = {
    settings,
    progress,
    streak,
    today,
    sentTimes,
    lastUpdated: Date.now()
  };

  try {
    const cache = await caches.open(SW_BRIDGE_CACHE);
    await cache.put(
      new Request(SW_BRIDGE_KEY),
      new Response(JSON.stringify(bridgeData), {
        headers: { 'Content-Type': 'application/json' }
      })
    );
  } catch (e) {
    console.error('Failed to sync state to SW:', e);
  }
}

let settingsCache: { data: CachedSettings; ts: number } | null = null;
const CACHE_TTL = 2000;

function readSettings(): CachedSettings {
  const now = Date.now();
  if (settingsCache && (now - settingsCache.ts) < CACHE_TTL) {
    return settingsCache.data;
  }
  const raw = localStorage.getItem(SETTINGS_KEY);
  const parsed = raw ? JSON.parse(raw) : {};
  const result: CachedSettings = {
    notificationsEnabled: parsed.notificationsEnabled === true,
    notificationTimes: Array.isArray(parsed.notificationTimes)
      ? parsed.notificationTimes.filter((t: string) =>
          TIME_SLOTS.some(s => s.value === t)
        ) as NotificationTime[]
      : [],
    dailyGoal: parsed.dailyGoal || 10,
  };
  settingsCache = { data: result, ts: now };
  return result;
}

export function invalidateSettingsCache() {
  settingsCache = null;
  syncStateToServiceWorker(); // Sync on change
}

// ── Permission ────────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    notify('Notifications not supported in this browser');
    return 'denied';
  }
  const permission = await Notification.requestPermission();
  localStorage.setItem(NOTIFICATION_PERMISSION_KEY, permission);
  return permission;
}

export function getNotificationPermission(): NotificationPermission {
  return (localStorage.getItem(NOTIFICATION_PERMISSION_KEY) as NotificationPermission) || 'default';
}

// ─── Times ────────────────────────────────────────────────────

export function getNotificationTimes(): NotificationTime[] {
  return readSettings().notificationTimes;
}

export function setNotificationTimes(times: NotificationTime[]): void {
  localStorage.setItem('zenmath-notification-times', JSON.stringify(times));
  invalidateSettingsCache();
}

// ─── Progress ─────────────────────────────────────────────────

export function canDecreaseGoal(): boolean {
  const today = new Date().toISOString().split('T')[0];
  const stored = localStorage.getItem(DAILY_PROGRESS_KEY);
  if (!stored) return false;
  try {
    const { date, count } = JSON.parse(stored);
    const { dailyGoal } = readSettings();
    return date === today && count >= dailyGoal;
  } catch {
    return false;
  }
}

export function getTodayProgress(): { count: number; goal: number; goalAchieved: boolean } {
  const today = new Date().toISOString().split('T')[0];
  const stored = localStorage.getItem(DAILY_PROGRESS_KEY);
  const { dailyGoal } = readSettings();
  let count = 0;
  if (stored) {
    try {
      const { date, count: c } = JSON.parse(stored);
      if (date === today) count = c;
    } catch { /* ignore */ }
  }
  return { count, goal: dailyGoal, goalAchieved: count >= dailyGoal };
}

// ─── Theme helper ──────────────────────────────────────────

function getThemeColor(): string {
  try {
    const theme = localStorage.getItem('zenmath-theme') || 'dark';
    // Dark: Midnight BG (#000000), Light: Paper Zen BG (#F4F4F5)
    return theme === 'light' ? '#F4F4F5' : '#000000';
  } catch {
    return '#F4F4F5';
  }
}

// ─── Send notification ────────────────────────────────────────

async function sendViaServiceWorker(title: string, body: string): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    if (registration.active) {
      registration.active.postMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        body,
        icon: '/notification-icon.png',
        badge: '/notification-badge.png',
        color: getThemeColor(),
        tag: 'daily-reminder',
        vibrate: [200, 100, 200, 100, 400],
        timestamp: Date.now(),
        actions: [
          { action: 'practice', title: 'Start Practice' },
          { action: 'snooze', title: 'Snooze 30 min' },
        ],
      });
      return true;
    }
  } catch { /* fall through */ }
  return false;
}

function sendDirectNotification(title: string, body: string) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    const notification = new Notification(title, {
      body,
      icon: '/notification-icon.png',
      badge: '/notification-badge.png',
      tag: 'daily-reminder',
      vibrate: [200, 100, 200],
      timestamp: Date.now(),
      color: getThemeColor(),
    } as any); // Cast to any because some properties might not be in standard Notification constructor but supported by browsers
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch { /* ignore */ }
}

export async function showLocalNotification(title: string, body: string): Promise<void> {
  if (!('Notification' in window)) {
    notify('Notifications not supported in this browser');
    return;
  }

  const permission = Notification.permission;
  if (permission === 'default') {
    const result = await Notification.requestPermission();
    if (result !== 'granted') {
      notify('Notifications not allowed. Please enable in browser settings.');
      return;
    }
  }
  if (permission !== 'granted' && permission !== 'default') {
    notify('Notifications blocked. Please enable in browser settings.');
    return;
  }

  const sent = await sendViaServiceWorker(title, body);
  if (!sent) {
    sendDirectNotification(title, body);
  }
}

// ─── Periodic sync ────────────────────────────────────────────

export async function registerPeriodicSync(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;
  if (!('periodicSync' in window)) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    const status = await (navigator.permissions as any).query({ name: 'periodic-background-sync' });
    if (status.state !== 'granted') return false;
    await (registration as any).periodicSync.register('daily-reminder', {
      minInterval: 24 * 60 * 60 * 1000,
    });
    return true;
  } catch {
    return false;
  }
}

// ─── Web Push ─────────────────────────────────────────────────

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Syncs user's daily progress to the server for smart push notifications.
 */
export async function syncProgressToServer(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;

    const { count, goal, goalAchieved } = getTodayProgress();
    const today = new Date().toISOString().split('T')[0];

    await fetch('/api/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update-progress',
        subscription,
        progress: {
          completed: goalAchieved,
          remaining: Math.max(0, goal - count),
          date: today
        }
      }),
    });
  } catch (e) {
    console.error('Failed to sync progress to server:', e);
  }
}

export async function subscribeToPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !VAPID_PUBLIC_KEY) {
    return false;
  }
  try {
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      await syncProgressToServer(); // Sync immediately if already subscribed
      return true;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as any,
    });

    await fetch('/api/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'subscribe', subscription }),
    });

    await syncProgressToServer(); // Initial sync
    return true;
  } catch (e) {
    console.error('Push subscription failed:', e);
    return false;
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return true;

    await fetch('/api/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'unsubscribe', endpoint: subscription.endpoint }),
    });
    
    await subscription.unsubscribe();
    return true;
  } catch (e) {
    console.error('Push unsubscription failed:', e);
    return false;
  }
}

export async function triggerTestPush(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  
  if (!subscription) {
    throw new Error('No push subscription found. Enable notifications first.');
  }

  const response = await fetch('/api/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      action: 'trigger', 
      subscription,
      payload: {
        title: 'ZenMath — Server Test',
        body: 'This push was sent from the server successfully!',
        icon: '/notification-icon.png',
        badge: '/notification-badge.png'
      }
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to trigger test push');
  }
}

// ─── Evaluate & send ──────────────────────────────────────────

export function evaluateAndSend(): Promise<void> {
  const { notificationsEnabled } = readSettings();

  if (!notificationsEnabled || Notification.permission !== 'granted') {
    return Promise.resolve();
  }

  // Sync progress to the server, which handles the actual push notifications.
  syncProgressToServer(); 
  
  return Promise.resolve();
}

// ─── Streak helper ────────────────────────────────────────────

function getStreak(): number {
  try {
    const stored = localStorage.getItem('zenmath-daily-progress');
    if (!stored) return 0;
    const { streak } = JSON.parse(stored);
    return typeof streak === 'number' ? streak : 0;
  } catch {
    return 0;
  }
}

// Legacy aliases — kept minimal for backward compat if needed, but no-op for notifications
export function startNotificationScheduler(): void {}
export function stopNotificationScheduler(): void {}
export function recordNotificationSent(): void {}
export function shouldSendNotification(): boolean { return false; }
export async function checkAndShowNotification(): Promise<void> {
  return evaluateAndSend();
}
