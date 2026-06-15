# Background Daily-Goal Notification Plan

**Date:** 2026-06-14
**Project:** ZenMath — Mental Arithmetic PWA
**Goal:** Receive daily-goal reminder notifications even when the PWA is completely closed (no open tab, no foreground app).

---

## 1. Problem Statement

The current notification system (`src/services/notifications.ts`) relies on a `setInterval`-based scheduler that fires every 60 seconds and only runs while the app tab is active. Once the user closes the PWA or navigates away, the scheduler stops. This means:

- If a user has a 3 PM reminder configured but doesn't open the app all day, they receive **no notification**.
- The `Periodic Background Sync` registration exists (`notifications.ts:300`) but the Service Worker has no `periodicsync` event handler to respond to it.
- The `push` event handler exists in `sw.js:121` but the app has **no push subscription flow** — the handler is dead code.

---

## 2. Current Architecture (Reference)

### 2.1 In-App Scheduler

| File | Lines | Mechanism | Scope |
|------|-------|-----------|-------|
| `src/services/notifications.ts` | 388–396 | `setInterval` every 60s | Tab open only |
| `src/services/notifications.ts` | 318–369 | `evaluateAndSend()` — checks progress vs. configured times | Called by scheduler |
| `src/App.tsx` | 29–37 | Starts/stops scheduler on mount/unmount | React lifecycle |

### 2.2 Service Worker Notification Handling

| File | Lines | Mechanism | Used? |
|------|-------|-----------|-------|
| `public/sw.js` | 47–70 | `message` → `SHOW_NOTIFICATION` → `showNotification()` | ✅ Yes (postMessage from app) |
| `public/sw.js` | 72–119 | `notificationclick` → snooze (30min), practice, focus/open | ✅ Yes |
| `public/sw.js` | 121–138 | `push` → FCM-style push payload → `showNotification()` | ❌ No subscription code exists |
| `public/sw.js` | — | `periodicsync` handler | ❌ Missing entirely |

### 2.3 Periodic Background Sync Registration

| File | Lines | Details |
|------|-------|---------|
| `src/services/notifications.ts` | 300–314 | Calls `registration.periodicSync.register('daily-reminder', { minInterval: 24h })` |
| `src/services/notifications.ts` | — | `registerPeriodicSync()` is defined but **never called** anywhere in the app |

### 2.4 Push Notification Assets

| File | Purpose |
|------|---------|
| `public/notification-icon.png` | Large notification icon |
| `public/notification-badge.png` | Status-bar badge icon |

---

## 3. Options for Background Notifications

### Option A — Periodic Background Sync Only (No Server)

**How it works:** The browser wakes the SW periodically (≈24h) via the `periodicsync` event. The SW reads settings + daily progress from IndexedDB/localStorage and shows a notification if needed.

**Implementation effort:** Small — add a `periodicsync` event handler in `sw.js` (~40 lines).

**Limitations:**
- **Android Chrome only** — no iOS Safari, no desktop
- **24-hour minimum interval** — cannot send multiple reminders per day
- Requires the user to have visited the PWA recently enough for the SW to be registered
- The 24h interval is a *minimum* — the browser decides the actual cadence

**Verdict:** Useful as a supplementary fallback, but insufficient as the primary solution.

---

### Option B — Push Notifications via Web Push API (Recommended)

**How it works:**
1. A VAPID key pair is generated (public + private).
2. The app subscribes via `registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: <VAPID_PUBLIC> })`.
3. The subscription object is sent to a lightweight server and stored.
4. A cron job on the server evaluates the user's goal progress and fires push notifications at configured times.
5. The SW's `push` event handler receives the push and displays the notification. Works even if the phone is locked and the browser is fully closed.

**Missing pieces to implement:**

| Piece | What's needed |
|-------|---------------|
| VAPID keys | Generate with `web-push generate-vapid-keys` or similar |
| Push subscription in app | New function `subscribeToPush()` in `notifications.ts` |
| Push unsubscription | New function `unsubscribeFromPush()` |
| Server endpoint `POST /subscribe` | Store push subscription |
| Server endpoint `POST /unsubscribe` | Remove push subscription |
| Server cron job | Fire pushes at user-configured times |
| Integration with Settings | Subscribe when "Daily Reminder" enabled, unsubscribe when disabled |

---

### Option C — Hybrid (Option A + B)

Use Period Background Sync as a low-effort baseline for Android users, and push notifications for reliable cross-platform coverage. Both mechanisms share the same SW notification display logic.

**Verdict:** Best overall — implement both.

---

## 4. Detailed Implementation Plan

### Phase 1 — Service Worker: `periodicsync` handler + push resilience

**Files to modify:** `public/sw.js`

#### 1a. Add `periodicsync` event handler

```js
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-reminder') {
    event.waitUntil(handlePeriodicCheck());
  }
});

async function handlePeriodicCheck() {
  // SW has no direct access to localStorage; read from IndexedDB (zenmath-db)
  // or from Cache Storage where the app stores settings.
  //
  // Potential approaches:
  //   A) App writes current settings + progress to the Cache API on every update
  //   B) SW opens IndexedDB directly (needs to import/expose the same DB schema)
  //   C) App posts current settings to SW via postMessage on every change,
  //      SW stores them in its own in-memory map (survives only while SW is alive)
  //
  // Recommended: Approach A — app writes a "sw-settings" cache entry on every
  // settings change and session completion. SW reads it here.
}
```

**Complication:** Service Workers don't have access to `localStorage`. The app stores daily progress and settings in `localStorage`. To make these available to the SW during a `periodicsync` event, we need a bridge:

- **Approach A (recommended):** Every time the app updates settings or daily progress, it also writes a snapshot to the Cache API under a known key (e.g., `zenmath-sw-bridge`). The SW reads this cache entry in the `periodicsync` handler.
- **Approach B:** Open IndexedDB directly from the SW. This requires exposing the IndexedDB schema and ensuring the DB is not blocked by a held connection from the app.

#### 1b. Verify `push` handler handles Web Push payloads

The existing `push` handler (`sw.js:121-138`) expects `event.data.json()` with `{ title, body, icon, badge }`. This works with Web Push — the server sends a JSON payload as the push data. **No changes needed** for basic compatibility, but we may want to add `renotify: true` and `tag: 'daily-reminder'` for consistency.

#### 1c. Add push subscription change handler

Add a `pushsubscriptionchange` event listener to handle subscription expirations:

```js
self.addEventListener('pushsubscriptionchange', (event) => {
  // Re-subscribe and send new subscription to server
});
```

---

### Phase 2 — App: Push subscription flow

**Files to modify:** `src/services/notifications.ts`, `.env` (or config for VAPID key)

#### 2a. VAPID key setup

Generate a VAPID public/private key pair:

```bash
npx web-push generate-vapid-keys
```

Store the public key in the app's config (e.g., `src/constants.ts` or a new `.env` file with `import.meta.env.VITE_VAPID_PUBLIC_KEY`). The private key is deployed with the server — never in the client bundle.

#### 2b. Add `subscribeToPush()` function

```ts
const VAPID_PUBLIC_KEY = '...'; // from env / config

export async function subscribeToPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }
  try {
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      // Already subscribed — verify it's still valid
      return true;
    }
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    // Send subscription to server
    await fetch(`${PUSH_SERVER_URL}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription.toJSON()),
    });
    return true;
  } catch {
    return false;
  }
}
```

#### 2c. Add `unsubscribeFromPush()` function

```ts
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return true;
    // Tell server to remove subscription
    await fetch(`${PUSH_SERVER_URL}/unsubscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });
    await subscription.unsubscribe();
    return true;
  } catch {
    return false;
  }
}
```

#### 2d. Add `urlBase64ToUint8Array` helper

Standard VAPID key conversion utility:

```ts
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(ch => ch.charCodeAt(0)));
}
```

#### 2e. Wire into Settings

In `src/services/notifications.ts`, modify the "enable notifications" path to also call `subscribeToPush()`. Modify the "disable notifications" path to call `unsubscribeFromPush()`.

Add a new function:

```ts
export async function ensurePushSubscription(enabled: boolean): Promise<void> {
  if (enabled) {
    await subscribeToPush();
  } else {
    await unsubscribeFromPush();
  }
}
```

---

### Phase 3 — Server Component

This can be deployed as a **Cloudflare Worker**, **Vercel Serverless Function**, or a **Node.js microservice**. Cloudflare Worker is recommended for its global edge network and free tier.

#### 3a. Server structure

```
push-server/
├── src/
│   ├── index.ts              # Request router
│   ├── subscribe.ts          # POST /subscribe
│   ├── unsubscribe.ts        # POST /unsubscribe
│   ├── cron.ts               # Cron trigger handler
│   └── push.ts               # Web Push helper
├── wrangler.toml             # Cloudflare config
├── package.json
└── .env                      # VAPID_PRIVATE_KEY, CRON_SECRET
```

#### 3b. Endpoints

**`POST /subscribe`**
- Receives `{ endpoint, keys: { p256dh, auth } }` (the PushSubscription JSON)
- Stores in KV store (Cloudflare KV) or similar key-value storage
- Returns 200 OK

**`POST /unsubscribe`**
- Receives `{ endpoint }`
- Deletes from KV store
- Returns 200 OK

**Cron handler** (e.g., runs every 30 minutes)
- Reads stored subscription from KV
- Fetches the user's daily progress (for MVP: send a generic reminder and let the app check goal completion when opened)
- Constructs push payload with title + body
- Sends via `web-push` library using the stored VAPID private key

#### 3c. Push notification flow from server

```ts
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:your-email@example.com',  // or any contact URL
  process.env.VITE_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

async function sendReminder(subscription: PushSubscription) {
  const payload = JSON.stringify({
    title: 'Good afternoon — ZenMath',
    body: 'You have 3 sessions remaining to reach your daily goal.',
    icon: '/notification-icon.png',
    badge: '/notification-badge.png',
    tag: 'daily-reminder',
  });
  await webpush.sendNotification(subscription, payload);
}
```

---

### Phase 4 — Integration into App

**Files to modify:** `src/services/notifications.ts`, `src/components/SettingsScreen.tsx`, `src/App.tsx`

#### 4a. Scheduler + push subscription init

In `src/App.tsx`, after the existing `startNotificationScheduler()` call, add:

```ts
import { ensurePushSubscription } from './services/notifications';

// Inside the useEffect:
const { notificationsEnabled } = readSettings();
ensurePushSubscription(notificationsEnabled);
```

#### 4b. Settings toggle wiring

In `src/components/SettingsScreen.tsx`, when the user toggles "Daily Reminder" on and saves:

```ts
import { ensurePushSubscription } from '../services/notifications';

// Inside handleSave:
if (settingsChanged) {
  await ensurePushSubscription(newSettings.notificationsEnabled);
}
```

#### 4c. Consideration: multiple time slots

The user can configure up to 3 notification times per day. The server-side cron must be aware of these. Options:

- **Simple approach:** Cron runs every 30 min, sends at the nearest configured time slot. The user's selected times (`08:00`, `12:00`, `15:00`, `18:00`, `20:00`) round to the nearest cron interval.
- **Complex approach:** Upload the user's time preferences to the server so the cron can precisely target them.
- **Hybrid:** The push notification opens the app, and the app's existing `evaluateAndSend()` logic handles deduplication (only sends if time is past and not yet sent today).

---

## 5. Files Summary

| File | Action | Description |
|------|--------|-------------|
| `public/sw.js` | **Modify** | Add `periodicsync` handler, add `pushsubscriptionchange` handler |
| `src/services/notifications.ts` | **Modify** | Add `subscribeToPush()`, `unsubscribeFromPush()`, `ensurePushSubscription()`, helper `urlBase64ToUint8Array()`, VAPID key config |
| `src/App.tsx` | **Modify** | Call `ensurePushSubscription()` on mount |
| `src/components/SettingsScreen.tsx` | **Modify** | Wire push subscription to "Daily Reminder" toggle |
| `src/constants.ts` | **Modify** | Add `VAPID_PUBLIC_KEY` constant (from env) |
| `.env` / `.env.example` | **Create** | Store `VITE_VAPID_PUBLIC_KEY` |
| `push-server/` | **Create** | New directory with Worker/server code |
| `NOTIFICATION_SETUP.md` | **Update** | Document the Web Push flow |

---

## 6. Edge Cases & Risks

| Risk | Mitigation |
|------|------------|
| **Push subscription expires** (browser rotates keys) | Add `pushsubscriptionchange` listener in SW |
| **User clears browser data** — loses subscription | Subscription is ephemeral; app detects absence on next visit and re-subscribes |
| **iOS Safari** — no Push API, no Periodic Sync | Fall back to in-app scheduler only |
| **Multiple tabs** — each subscribes independently | Server stores only the most recent subscription (or de-duplicates by endpoint) |
| **User has notifications blocked** | `subscribeToPush()` will throw; catch and silently degrade to in-app only |
| **Server goes down** | Notifications degrade gracefully — in-app scheduler still works when tab is open |
| **Time zone mismatch** | Cron runs in UTC; user's times are in local browser time. Option: convert to UTC before sending to server, or let the app handle time filtering (push just triggers a check) |
| **Daily progress not synced to server** | Simplest approach: push notification opens the app, then `evaluateAndSend()` checks actual progress client-side. Server just sends a generic "check your goals" reminder |

---

## 7. Alternative: No-Server Approach (Fallback Only)

If you prefer to avoid any server infrastructure, the `periodicsync` approach (Option A) can be implemented in a single session:

| Step | What | Where |
|------|------|-------|
| 1 | Add `periodicsync` event handler to SW | `public/sw.js` |
| 2 | Bridge settings to SW via Cache API | `src/services/notifications.ts` + `public/sw.js` |
| 3 | Call `registerPeriodicSync()` on settings save | `src/components/SettingsScreen.tsx` |
| 4 | Call `registerPeriodicSync()` on app mount | `src/App.tsx` |

This gives you background notifications on **Android Chrome only**, with at most **1 reminder per day**.

---

## 8. Recommendation

**Implement both Option A and Option B (Hybrid — Option C):**

1. **Short-term (1-2 sessions):** Add the `periodicsync` handler and bridge to unlock background notifications on Android Chrome. This gets you partial coverage with zero server cost.
2. **Medium-term (3-5 sessions):** Build the push notification flow. Deploy a Cloudflare Worker as the push server. This gives reliable cross-platform coverage.
3. **Long-term:** Add the server-side cron to send precisely timed reminders, syncing user preferences from the app to the server.

The SW `push` handler already exists. The most impactful missing piece is the **push subscription flow in the app** and a **server to send the pushes**. The rest is polishing.
