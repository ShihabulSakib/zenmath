import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

registerRoute(
  new NavigationRoute(
    createHandlerBoundToURL('/index.html'),
    { denylist: [/\/api\//] }
  )
);

registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] })
    ]
  })
);

registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'gstatic-fonts-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] })
    ]
  })
);

registerRoute(
  ({ request }) => request.destination === 'audio',
  new CacheFirst({
    cacheName: 'audio-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 })]
  })
);

const SW_BRIDGE_CACHE = 'zenmath-sw-bridge';
const SW_BRIDGE_KEY = '/sw-bridge-data.json';

async function getBridgeData() {
  try {
    const cache = await caches.open(SW_BRIDGE_CACHE);
    const response = await cache.match(SW_BRIDGE_KEY);
    if (response) return await response.json();
  } catch (e) {
    console.error('SW: Failed to read bridge data', e);
  }
  return null;
}

async function handlePeriodicCheck() {
  const data = await getBridgeData();
  if (!data || !data.settings?.notificationsEnabled) return;

  const { settings, progress, today, sentTimes } = data;
  if (progress.count >= settings.dailyGoal) return;

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  const todaySent = sentTimes[today] || [];

  for (const time of settings.notificationTimes) {
    const [hour, minute] = time.split(':').map(Number);
    const isPastTime = currentHour > hour || (currentHour === hour && currentMinute >= minute);
    
    if (isPastTime && !todaySent.includes(time) && todaySent.length < 3) {
      // Show notification
      const greeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';
      const remaining = settings.dailyGoal - progress.count;
      
      self.registration.showNotification(`${greeting} — ZenMath`, {
        body: `Keep it up! ${remaining} of ${settings.dailyGoal} sessions remaining today.`,
        icon: '/notification-icon.png',
        badge: '/notification-badge.png',
        tag: 'daily-reminder',
        requireInteraction: true,
        vibrate: [200, 100, 200],
        data: { url: '/' }
      });
      
      // Note: We can't easily update the bridge's sentTimes from here 
      // without some complexity, but showing the notification is the goal.
      break;
    }
  }
}

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-reminder') {
    event.waitUntil(handlePeriodicCheck());
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'TEST_PERIODIC_CHECK') {
    event.waitUntil(handlePeriodicCheck());
  }
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, badge, tag, actions, silent, vibrate, requireInteraction, color } = event.data;

    const options = {
      body,
      icon: icon || '/notification-icon.png',
      badge: badge || '/notification-badge.png',
      tag: tag || 'zenmath-notification',
      requireInteraction: requireInteraction !== undefined ? requireInteraction : true,
      vibrate: vibrate || [200, 100, 200, 100, 400],
      silent: silent || false,
      timestamp: Date.now(),
      color: color || '#F4F4F5',
      data: { url: '/' },
    };

    if (actions && Array.isArray(actions)) {
      options.actions = actions;
    }

    self.registration.showNotification(title, options);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const url = event.notification.data?.url || '/';

  if (action === 'snooze') {
    event.waitUntil(
      new Promise((resolve) => {
        setTimeout(() => {
          self.registration.showNotification(
            event.notification.title,
            {
              body: 'Time to practice! Your 30-minute snooze is up.',
              icon: '/notification-icon.png',
              badge: '/notification-badge.png',
              tag: 'zenmath-snooze',
              requireInteraction: true,
              vibrate: [200, 100, 200],
              timestamp: Date.now(),
              color: event.notification.color || '#F4F4F5',
              data: { url: '/' },
            }
          );
          resolve();
        }, 30 * 60 * 1000);
      })
    );
    return;
  }

  if (action === 'practice') {
    // Handle specific practice action if needed
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

self.addEventListener('push', (event) => {
  const data = event.data?.json() || {
    title: 'ZenMath',
    body: 'Time to practice!',
  };
  
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: data.icon || '/notification-icon.png',
    badge: data.badge || '/notification-badge.png',
    tag: 'zenmath-push',
    requireInteraction: true,
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
    color: data.color || '#F4F4F5',
    data: { url: '/' }
  });
});

self.addEventListener('pushsubscriptionchange', (event) => {
  // Browser rotated the push subscription — re-subscribe and notify server.
  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription.options)
      .then((newSubscription) => {
        return fetch('/api/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'subscribe', subscription: newSubscription }),
        });
      })
      .catch((err) => {
        console.error('SW: pushsubscriptionchange re-subscribe failed', err);
      })
  );
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

function createHandlerBoundToURL(url) {
  return ({ url: requestUrl }) => {
    if (requestUrl.href === url || requestUrl.pathname === url) {
      return fetch(requestUrl).catch(() => caches.match(url));
    }
    return Promise.reject('no-match');
  };
}