const NOTIFICATION_PERMISSION_KEY = 'zenmath-notification-permission';
const LAST_NOTIFICATION_DATE_KEY = 'zenmath-last-notification-date';
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
}

// ── Time helpers ─────────────────────────────────────────────

function getPeriod(hour: number): TimeSlotInfo['period'] {
  if (hour < 12) return 'morning';
  if (hour < 14) return 'midday';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}

function getGreeting(period: TimeSlotInfo['period']): string {
  switch (period) {
    case 'morning': return 'Good morning';
    case 'midday': return 'Good afternoon';
    case 'afternoon': return 'Good afternoon';
    case 'evening': return 'Good evening';
    case 'night': return 'Good evening';
  }
}

// ── Message generator ────────────────────────────────────────

interface MessageContext {
  remaining: number;
  goal: number;
  streak: number;
  period: TimeSlotInfo['period'];
  dayIndex: number;
}

const MESSAGE_TEMPLATES: Record<TimeSlotInfo['period'], string[]> = {
  morning: [
    'Start your day sharp — {remaining} of {goal} sessions waiting.',
    'Morning brain boost! {remaining} sessions to reach your goal.',
    'Rise and shine! Only {remaining} left to hit {goal} today.',
    'Early bird gets the math done — {remaining} sessions to go.',
  ],
  midday: [
    'Midday mental workout! {remaining} sessions remaining.',
    'Keep the momentum going — {remaining} of {goal} left.',
    'Perfect time for a brain break: {remaining} sessions to go.',
    'You are {remaining} away from your daily goal of {goal}.',
  ],
  afternoon: [
    'Afternoon practice time! {remaining} sessions left.',
    'Stay sharp — {remaining} sessions to reach your goal.',
    'Great time for a math session: {remaining} of {goal} remaining.',
    'You have {remaining} sessions to go this afternoon.',
  ],
  evening: [
    'Evening wind-down: {remaining} sessions to complete your goal.',
    'One last push! {remaining} sessions left this evening.',
    'Finish strong — {remaining} of {goal} sessions remaining.',
    'Evening practice: {remaining} more to reach your daily target.',
  ],
  night: [
    'Quick night session? {remaining} sessions to hit your goal.',
    'Before you go: {remaining} sessions left today.',
    'Night practice: {remaining} of {goal} sessions remaining.',
    'Close out the day strong — {remaining} sessions to go.',
  ],
};

const STREAK_MESSAGES = [
  'Your {streak}-day streak is on the line — {remaining} to go!',
  'Keep that {streak}-day streak alive! {remaining} sessions left.',
  'Don\'t break the chain! {streak} days strong, {remaining} to go.',
];

function generateNotificationBody(ctx: MessageContext): string {
  const templates = MESSAGE_TEMPLATES[ctx.period];
  const idx = ctx.dayIndex % templates.length;
  let body = templates[idx]
    .replace('{remaining}', String(ctx.remaining))
    .replace('{goal}', String(ctx.goal));

  if (ctx.streak > 0 && ctx.dayIndex % 3 === 0) {
    const streakMsg = STREAK_MESSAGES[ctx.dayIndex % STREAK_MESSAGES.length]
      .replace('{streak}', String(ctx.streak))
      .replace('{remaining}', String(ctx.remaining));
    body = streakMsg;
  }

  return body;
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
    return '#000000';
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
        icon: '/pwa-512x512(bgremoved).png',
        badge: '/pwa(vector).svg',
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
      icon: '/pwa-512x512(bgremoved).png',
      badge: '/pwa(vector).svg',
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

// ─── Evaluate & send ──────────────────────────────────────────

export function evaluateAndSend(): Promise<void> {
  const { notificationsEnabled, notificationTimes } = readSettings();

  if (!notificationsEnabled || Notification.permission !== 'granted') {
    return Promise.resolve();
  }

  const { count, goal } = getTodayProgress();
  if (count >= goal) {
    return Promise.resolve();
  }

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const today = new Date().toISOString().split('T')[0];

  const sentTimes: Record<string, string[]> = JSON.parse(
    localStorage.getItem(SENT_TIMES_KEY) || '{}'
  );
  const todaySent = sentTimes[today] || [];

  for (const time of notificationTimes) {
    const [hour, minute] = time.split(':').map(Number);

    const isPastTime = currentHour > hour || (currentHour === hour && currentMinute >= minute);
    if (!isPastTime) continue;
    if (todaySent.includes(time)) continue;
    if (todaySent.length >= 3) continue;

    const remaining = goal - count;
    const period = getPeriod(currentHour);
    const dayIndex = today.split('-').reduce((sum, p) => sum + parseInt(p, 10), 0);
    const streak = getStreak();

    const greeting = getGreeting(period);
    const body = generateNotificationBody({ remaining, goal, streak, period, dayIndex });

    showLocalNotification(
      `${greeting} — ZenMath`,
      body
    );

    const newSentTimes = { ...sentTimes, [today]: [...todaySent, time] };
    localStorage.setItem(SENT_TIMES_KEY, JSON.stringify(newSentTimes));
    localStorage.setItem(LAST_NOTIFICATION_DATE_KEY, today);

    break;
  }

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

// ─── Scheduling ───────────────────────────────────────────────

let checkInterval: ReturnType<typeof setInterval> | null = null;

export function startNotificationScheduler(): void {
  stopNotificationScheduler();

  evaluateAndSend();

  checkInterval = setInterval(() => {
    evaluateAndSend();
  }, 60_000);
}

export function stopNotificationScheduler(): void {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
}

// Legacy aliases — kept for backward compat
export function shouldSendNotification(): boolean {
  const { notificationsEnabled, notificationTimes } = readSettings();
  if (!notificationsEnabled) return false;
  const { count, goal } = getTodayProgress();
  if (count >= goal) return false;
  const lastDate = localStorage.getItem(LAST_NOTIFICATION_DATE_KEY);
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const currentHour = now.getHours();
  for (const time of notificationTimes) {
    const [hour] = time.split(':').map(Number);
    if (currentHour >= hour && lastDate !== today) return true;
  }
  return false;
}

export function recordNotificationSent(): void {
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem(LAST_NOTIFICATION_DATE_KEY, today);
}

export async function checkAndShowNotification(): Promise<void> {
  return evaluateAndSend();
}
