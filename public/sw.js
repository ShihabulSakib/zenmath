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

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, badge, tag, actions, silent, vibrate, requireInteraction } = event.data;

    const options = {
      body,
      icon: icon || '/pwa-192x192.png',
      badge: badge || '/pwa-192x192.png',
      tag: tag || 'zenmath-notification',
      requireInteraction: requireInteraction !== undefined ? requireInteraction : true,
      vibrate: vibrate || [200, 100, 200],
      silent: silent || false,
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
              icon: event.notification.icon || '/pwa-192x192.png',
              badge: '/pwa-192x192.png',
              tag: 'zenmath-snooze',
              requireInteraction: true,
              vibrate: [200, 100, 200],
              data: { url: '/' },
            }
          );
          resolve();
        }, 30 * 60 * 1000);
      })
    );
    return;
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
    icon: '/pwa-192x192.png'
  };
  
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: data.icon || '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'zenmath-push',
    requireInteraction: true
  });
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