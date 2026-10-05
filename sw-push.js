// Service Worker: Push Notifications & Image/Asset Caching for PWA Speed
const CACHE_NAME_IMAGES = 'aaditya-image-cache-v1';
const CACHE_NAME_STATIC = 'aaditya-static-cache-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/logo.png',
  '/manifest.json'
];

// Install Event
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME_STATIC).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => console.log('Pre-cache error:', err));
    })
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME_IMAGES && name !== CACHE_NAME_STATIC)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Dynamic Image & Asset Caching
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Filter non-GET requests
  if (event.request.method !== 'GET') return;

  // 1. Cache-First Strategy for Images (Supabase Storage & local webp/png/jpg)
  const isImage = event.request.destination === 'image' ||
    url.pathname.match(/\.(webp|png|jpg|jpeg|svg|gif|ico)(\?.*)?$/i) ||
    url.hostname.includes('supabase.co');

  if (isImage) {
    event.respondWith(
      caches.open(CACHE_NAME_IMAGES).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          console.log('Fetch image failed, no cache available:', error);
          return cachedResponse;
        }
      })
    );
    return;
  }

  // 2. Stale-While-Revalidate Strategy for Static JS/CSS/HTML
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.open(CACHE_NAME_STATIC).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
  }
});

// Push Notifications Event
self.addEventListener('push', function(event) {
  let data = { title: 'Aaditya Industries', body: 'New notification!' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/logo.png',
    badge: '/logo.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'default',
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
