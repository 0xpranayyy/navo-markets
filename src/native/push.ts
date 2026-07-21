import { isNativePlatform, loadCapacitor } from './platform';

const PUSH_KEY = 'navo-push-enabled';

export function isPushEnabled(): boolean {
  return localStorage.getItem(PUSH_KEY) === '1';
}

export function setPushEnabled(enabled: boolean) {
  localStorage.setItem(PUSH_KEY, enabled ? '1' : '0');
}

/** Request notification permission — Web Push on PWA, FCM/APNs via Capacitor on native. */
export async function enablePushNotifications(): Promise<boolean> {
  if (isNativePlatform()) {
    const mod = await loadCapacitor<{ PushNotifications: {
      requestPermissions: () => Promise<{ receive: string }>;
      register: () => Promise<void>;
    } }>('@capacitor/push-notifications');

    if (mod?.PushNotifications) {
      const perm = await mod.PushNotifications.requestPermissions();
      if (perm.receive !== 'granted') return false;
      await mod.PushNotifications.register();
      setPushEnabled(true);
      return true;
    }
  }

  if (!('Notification' in window)) return false;
  const perm = await Notification.requestPermission();
  const ok = perm === 'granted';
  setPushEnabled(ok);
  return ok;
}

export async function disablePushNotifications() {
  setPushEnabled(false);
}

/** Show a local notification (works in browser when permitted). */
export function notifyLocal(title: string, body: string) {
  if (!isPushEnabled()) return;
  try {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    new Notification(title, { body, icon: '/icon-192.png', badge: '/icon-192.png' });
  } catch {
    // ignore — some browsers block Notification constructors outside user gesture
  }
}
