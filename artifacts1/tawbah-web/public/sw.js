const ICON = '/images/logo.png';
const BADGE = '/images/logo.png';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));

// ── Utility: show a notification and notify open windows ─────────────────────

function doShowNotification(title, body, url, tag) {
  return self.registration.showNotification(title, {
    body,
    icon: ICON,
    badge: BADGE,
    tag: tag || 'tawbah',
    dir: 'rtl',
    lang: 'ar',
    vibrate: [200, 100, 200],
    data: { url: url || '/' },
    renotify: true,
    silent: false,
  }).then(() => {
    return clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        client.postMessage({ type: 'NOTIFICATION_FIRED', tag: tag || 'tawbah', title, body, url: url || '/' });
      }
    });
  });
}

// ── Web Push: server-sent notifications (works when app is fully closed) ──────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data;
  try { data = event.data.json(); }
  catch { data = { title: 'دليل التوبة', body: event.data.text(), url: '/' }; }
  const { title = 'دليل التوبة', body = '', url = '/', tag = 'push' } = data;
  event.waitUntil(doShowNotification(title, body, url, tag));
});

// ── Handle messages from the app ─────────────────────────────────────────────
self.addEventListener('message', (event) => {
  const { type } = event.data || {};

  // App asks SW to show a notification immediately (works from any page/tab)
  if (type === 'SHOW_NOTIFICATION') {
    const { title, body, url, tag } = event.data;
    event.waitUntil(doShowNotification(title, body, url || '/', tag || 'tawbah'));
  }

  if (type === 'PING') {
    event.ports[0]?.postMessage({ type: 'PONG' });
  }
});

// ── Notification click → open/focus app ──────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  // For adhkar notifications: send a direct message to open the modal in already-open tabs
  const adhkarMatch = url.match(/[?&]adhkar=(morning|evening)/);
  const adhkarType = adhkarMatch ? adhkarMatch[1] : null;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      if (windowClients.length > 0) {
        const client = windowClients[0];
        client.focus();
        if (adhkarType) {
          // App is open — send a direct message to show the modal immediately (no reload)
          client.postMessage({ type: 'SHOW_ADHKAR', adhkarType });
        } else if (url !== '/') {
          client.navigate(url);
        }
        return;
      }
      // App is closed — open it with the URL param so the modal appears on load
      return clients.openWindow(url);
    })
  );
});
