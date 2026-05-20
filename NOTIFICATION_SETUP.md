# Daily Practice Notification Setup

This guide helps you set up daily practice reminders for your ZenMath PWA.

## Overview

The notification system uses:
- **Periodic Background Sync** (primary) - Works on Android Chrome PWA
- **Local notifications** when the app is opened
- Optional: **Firebase + Cloudflare** for server-triggered notifications

---

## Part 1: Basic Setup (Works Automatically)

### Enable Notifications in App
1. Open ZenMath PWA on your Android device
2. Go to **Settings**
3. Enable **Daily Reminder**
4. Select reminder times (8PM, 9PM, 10PM, 11PM)
5. Tap Save

### How It Works
- When you open the app, it checks if your daily goal is met
- If not, and it's past your reminder time, you'll get a notification
- The app uses Periodic Background Sync (on supported browsers) to check even when not actively open
- Works best when the PWA is added to your home screen

---

## Part 2: Cloudflare Worker (Advanced - For Reliable 24/7 Notifications)

If you want notifications to work even when the app hasn't been opened in days, set up Cloudflare Workers:

### Prerequisites
- Cloudflare account (free)
- Your app hosted on Cloudflare Pages (recommended)

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" → Enter name: `zenmath-notifications`
3. Disable Google Analytics (optional)
4. Wait for project to be created

5. **Get FCM Credentials:**
   - In Firebase console, go to **Project Settings** (gear icon)
   - Scroll to **Your apps** → Click Web (</>) icon
   - Register app with nickname: `zenmath-web`
   - Copy the `firebaseConfig` object (we'll need this later)

### Step 2: Create Cloudflare Worker

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select your domain → Go to **Workers**
3. Click **Create Worker**
4. Name: `zenmath-notifier`
5. Replace the code with:

```javascript
export default {
  async fetch(request, env) {
    if (request.url.pathname === '/send-notification') {
      const authHeader = request.headers.get('Authorization');
      if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
      }

      const { title, body, token } = await request.json();
      
      return fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Authorization': `key=${env.FCM_SERVER_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: token,
          notification: { title, body }
        })
      });
    }
    
    return new Response('Not Found', { status: 404 });
  }
};
```

6. Click **Save and Deploy**

### Step 3: Add Environment Variables

1. In your Worker settings, add:
   - `FCM_SERVER_KEY`: Your Firebase Server Key (from Project Settings → Cloud Messaging)
   - `CRON_SECRET`: A random string for cron authentication

### Step 4: Set Up Cron Trigger

1. In your Worker, go to **Triggers**
2. Add **Cron Trigger**:
   - Schedule: `*/3 * * * *` (every 3 hours)
   - Or: `0 20,21,22 * * *` (8PM, 9PM, 10PM daily)

### Step 5: Update Your App to Store Push Subscription

In your app, add Firebase client SDK to store the push token:

```javascript
// In your app initialization
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  // Your config from Firebase Console
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export async function savePushToken() {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    const token = await getToken(messaging, {
      vapidKey: 'YOUR_VAPID_PUBLIC_KEY'
    });
    // Save this token to your database/storage for the Cloudflare Worker to use
  }
}
```

---

## Testing Notifications

### On Android Chrome:
1. Open ZenMath PWA
2. Go to Settings → Enable Daily Reminder
3. Select a time a few minutes from now
4. Wait for the time to pass
5. You should receive a notification

### Debugging:
- Check browser console for errors
- Verify notifications permission in browser settings
- On Android: Settings → Apps → ZenMath → Notifications

---

## Troubleshooting

### "Notifications not supported"
- PWA must be installed (Add to Home Screen)
- Must use Chrome on Android

### Notifications not appearing
- Check that notifications are enabled in browser
- Check the app is added to home screen
- Try closing and reopening the PWA

### Goal can't be decreased
- This is intentional! You must complete your daily goal first
- The lock icon appears when goal is not met
- Complete your exercises to unlock goal adjustment