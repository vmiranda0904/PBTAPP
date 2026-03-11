import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';
import { app } from '../firebase';
import { getAppSettings, updateAppSettings } from './settingsService';

const VAPID_KEY = (import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined) ?? '';

// ─── Internal helpers ─────────────────────────────────────────────────────────

function hasVapidKey(): boolean {
  return VAPID_KEY.length > 0;
}

// Lazily create the messaging instance — getMessaging throws in environments
// where the browser doesn't support it (e.g. Safari < 16, server-side render).
let _messaging: Messaging | null = null;

function getMessagingInstance(): Messaging | null {
  if (!('Notification' in window)) return null;
  try {
    if (!_messaging) _messaging = getMessaging(app);
    return _messaging;
  } catch {
    return null;
  }
}

// ─── Permission & token ───────────────────────────────────────────────────────

/**
 * Requests browser notification permission and, if granted, obtains an
 * FCM registration token and persists it to Firestore app settings.
 * Returns the token string, or null on failure.
 */
export async function enableAdminPushNotifications(
  swRegistration?: ServiceWorkerRegistration
): Promise<string | null> {
  if (!('Notification' in window)) return null;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  if (!hasVapidKey()) return null;

  const messaging = getMessagingInstance();
  if (!messaging) return null;

  try {
    const options: Parameters<typeof getToken>[1] = { vapidKey: VAPID_KEY };
    if (swRegistration) options.serviceWorkerRegistration = swRegistration;

    const token = await getToken(messaging, options);
    if (token) {
      await updateAppSettings({ adminFcmToken: token });
    }
    return token || null;
  } catch {
    return null;
  }
}

// ─── Foreground message listener ─────────────────────────────────────────────

/**
 * Sets up a foreground message handler that shows a browser Notification
 * when a push message arrives while the app is in the foreground.
 * Returns a cleanup function.
 */
export function setupForegroundMessageListener(
  onNewSignup: (payload: { name: string; email: string; role: string }) => void
): () => void {
  const messaging = getMessagingInstance();
  if (!messaging) return () => {};

  const unsubscribe = onMessage(messaging, (payload) => {
    const data = payload.data ?? {};
    if (data.type === 'new_signup') {
      onNewSignup({
        name: data.user_name ?? 'Unknown',
        email: data.user_email ?? '',
        role: data.user_role ?? '',
      });

      if (Notification.permission === 'granted') {
        new Notification('New Sign-Up Request', {
          body: `${data.user_name ?? 'Someone'} (${data.user_role ?? ''}) wants to join PBT Sports.`,
          icon: '/icon-192.png',
          tag: `signup-${data.user_email}`,
        });
      }
    }
  });

  return unsubscribe;
}

// ─── In-app notification helper ───────────────────────────────────────────────

/**
 * Shows a browser notification if permission is granted.
 * Used for foreground alerts when the admin has the app open.
 */
export function showBrowserNotification(title: string, body: string, tag?: string): void {
  if (Notification.permission !== 'granted') return;
  new Notification(title, {
    body,
    icon: '/icon-192.png',
    tag,
  });
}

// ─── Request-only permission ─────────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  return Notification.requestPermission();
}

// ─── Current permission state ────────────────────────────────────────────────

export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

// ─── Remove admin FCM token ──────────────────────────────────────────────────

export async function disableAdminPushNotifications(): Promise<void> {
  await updateAppSettings({ adminFcmToken: null, pushNotificationsEnabled: false });
}

// ─── Re-export for use in AuthContext ────────────────────────────────────────

export { getAppSettings };
