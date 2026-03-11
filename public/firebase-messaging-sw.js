// firebase-messaging-sw.js
// Firebase Cloud Messaging service worker for background push notifications.
// This file must be served from the root of the app's scope.
//
// NOTE: The Firebase compat SDK version below (11.0.0) must be kept in sync
// with the major version used in package.json (firebase ^12.x) — update this
// URL whenever you upgrade the firebase npm package.
importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js');

// Initialize Firebase with the same config used in the app.
// These values are populated at build time through environment variable
// injection via the html plugin or inlined manually for the service worker.
// If VITE env vars are not available here, the values must be hard-coded or
// passed via the install event's postMessage. We use the self.__firebaseConfig
// global that can be set by the app before service worker registration.
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    const config = event.data.config;
    if (!firebase.apps.length) {
      firebase.initializeApp(config);
    }
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage(payload => {
      const data = payload.data ?? {};
      const notificationTitle =
        payload.notification?.title ?? 'New Sign-Up Request';
      const notificationOptions = {
        body:
          payload.notification?.body ??
          `${data.user_name ?? 'Someone'} (${data.user_role ?? ''}) wants to join PBT Sports.`,
        icon: '/icon-192.png',
        tag: `signup-${data.user_email ?? Date.now()}`,
        data: {
          url: self.registration.scope,
          uid: data.uid ?? '',
        },
      };
      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  }
});

// Handle notification click — open/focus the app window.
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || self.registration.scope;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
