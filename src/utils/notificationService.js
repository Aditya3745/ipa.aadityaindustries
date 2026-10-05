import { Capacitor } from '@capacitor/core';

/**
 * Schedule daily follow-up reminder notifications.
 * Uses Capacitor LocalNotifications on native, Web Notifications API on browser.
 */

let LocalNotifications = null;

const loadPlugin = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      const mod = await import('@capacitor/local-notifications');
      LocalNotifications = mod.LocalNotifications;
    } catch (e) {
      console.warn('LocalNotifications plugin not available:', e);
    }
  }
};

loadPlugin();

// ── Request permission ───────────────────────────────────────────────
export const requestNotificationPermission = async () => {
  if (Capacitor.isNativePlatform() && LocalNotifications) {
    const perm = await LocalNotifications.requestPermissions();
    return perm.display === 'granted';
  }
  if ('Notification' in window) {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  }
  return false;
};

// ── Schedule daily morning alert (8 AM) ─────────────────────────────
export const scheduleDailyFollowUpReminder = async (count) => {
  if (count === 0) return;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  const body = `Aaj ${count} customer(s) ko follow-up call karna hai!`;

  if (Capacitor.isNativePlatform() && LocalNotifications) {
    // Cancel existing daily reminder first
    try { await LocalNotifications.cancel({ notifications: [{ id: 1001 }] }); } catch (_) {}

    // Schedule for 8 AM today (or tomorrow if already past 8)
    const now = new Date();
    const fireAt = new Date();
    fireAt.setHours(8, 0, 0, 0);
    if (now >= fireAt) fireAt.setDate(fireAt.getDate() + 1);

    await LocalNotifications.schedule({
      notifications: [{
        id: 1001,
        title: '📞 Aaditya Industries — Follow-up Alert',
        body,
        schedule: { at: fireAt, repeats: true, every: 'day' },
        sound: 'default',
        smallIcon: 'ic_stat_icon_config_sample',
      }]
    });
  } else if ('Notification' in window && Notification.permission === 'granted') {
    // On web: show immediately as a reminder was just set
    new Notification('📞 Aaditya Industries — Follow-up Alert', { body, icon: '/logo.png' });
  }
};

// ── Fire an immediate notification ──────────────────────────────────
export const fireImmediateNotification = async (title, body) => {
  const granted = await requestNotificationPermission();
  if (!granted) return;

  if (Capacitor.isNativePlatform() && LocalNotifications) {
    await LocalNotifications.schedule({
      notifications: [{ id: Math.floor(Math.random() * 9000) + 1000, title, body, schedule: { at: new Date(Date.now() + 500) } }]
    });
  } else if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/logo.png' });
  }
};
