import { supabase } from '../supabase';

const VAPID_PUBLIC_KEY = 'BNy1ki-k1eu8hpD1qifs4Ik2XaLJAKiVlLbid2AfXXQM7DggZU_quxC2CEqyE-NI4vbBA0C5LaslzrgHVWDVZXk';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Subscribe the user for push notifications (works without login).
 * Called automatically when the app loads.
 */
export async function subscribeToPush() {
  // Check if browser supports push
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push notifications not supported in this browser.');
    return false;
  }

  try {
    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied.');
      return false;
    }

    // Register or get the push service worker
    let registration = await navigator.serviceWorker.getRegistration('/sw-push.js');
    if (!registration) {
      registration = await navigator.serviceWorker.register('/sw-push.js', { scope: '/' });
      // Wait for the service worker to become active
      await navigator.serviceWorker.ready;
    }

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Subscribe the user
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
      console.log('Push subscription created.');
    } else {
      console.log('Already subscribed to push.');
    }

    // Save subscription to Supabase
    const subscriptionJSON = subscription.toJSON();
    const deviceInfo = navigator.userAgent;

    const { error } = await supabase.from('push_subscriptions').upsert({
      endpoint: subscriptionJSON.endpoint,
      keys_p256dh: subscriptionJSON.keys.p256dh,
      keys_auth: subscriptionJSON.keys.auth,
      device_info: deviceInfo
    }, {
      onConflict: 'endpoint'
    });

    if (error) {
      console.error('Failed to save push subscription:', error);
      return false;
    }

    console.log('Push subscription saved to database.');
    return true;
  } catch (err) {
    console.error('Push subscription failed:', err);
    return false;
  }
}

/**
 * Unsubscribe from push notifications.
 */
export async function unsubscribeFromPush() {
  try {
    const registration = await navigator.serviceWorker.getRegistration('/sw-push.js');
    if (!registration) return;

    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();

      // Remove from database
      await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
      console.log('Unsubscribed from push notifications.');
    }
  } catch (err) {
    console.error('Failed to unsubscribe:', err);
  }
}
