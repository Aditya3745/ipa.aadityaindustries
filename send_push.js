/**
 * Send Push Notifications to all subscribed devices
 * 
 * Usage:
 *   node send_push.js "Title" "Body message" 
 *   node send_push.js "New Product Added!" "Check out our latest Executive Chair"
 */

import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tpfqflalimrqzumpyjff.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwZnFmbGFsaW1ycXp1bXB5amZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjU0MjU5NCwiZXhwIjoyMTAyMTE4NTk0fQ.I7mHuuEdX7P0uY7b72fM1bgSFO31a604J0EosOsVLho';
const supabase = createClient(supabaseUrl, supabaseKey);

// VAPID Keys - Generated for Aaditya Industries
const VAPID_PUBLIC_KEY = 'BNy1ki-k1eu8hpD1qifs4Ik2XaLJAKiVlLbid2AfXXQM7DggZU_quxC2CEqyE-NI4vbBA0C5LaslzrgHVWDVZXk';
const VAPID_PRIVATE_KEY = 'CrBV1c_4p-0UcKznVRaxdvjNd3AgIL7MDH5W1plEs_M';

webpush.setVapidDetails(
  'mailto:admin@aadityaindustries.online',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

async function sendPushToAll(title, body, url = '/') {
  console.log(`Sending push notification: "${title}" - "${body}"`);

  // Fetch all subscriptions
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('*');

  if (error) {
    console.error('Failed to fetch subscriptions:', error);
    return;
  }

  if (!subscriptions || subscriptions.length === 0) {
    console.log('No subscribers found.');
    return;
  }

  console.log(`Found ${subscriptions.length} subscriber(s).`);

  const payload = JSON.stringify({ title, body, url, tag: 'push-' + Date.now() });

  let successCount = 0;
  let failCount = 0;

  for (const sub of subscriptions) {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.keys_p256dh,
        auth: sub.keys_auth
      }
    };

    try {
      await webpush.sendNotification(pushSubscription, payload);
      successCount++;
      console.log(`  ✅ Sent to: ${sub.device_info?.substring(0, 50) || sub.endpoint.substring(0, 50)}...`);
    } catch (err) {
      failCount++;
      console.error(`  ❌ Failed:`, err.statusCode || err.message);
      
      // If subscription is expired/invalid (410 Gone), remove it
      if (err.statusCode === 410 || err.statusCode === 404) {
        await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        console.log(`     Removed expired subscription.`);
      }
    }
  }

  console.log(`\nDone! Sent: ${successCount}, Failed: ${failCount}`);
}

// Get title and body from command line args
const title = process.argv[2] || '📢 Aaditya Industries';
const body = process.argv[3] || 'Aapke liye ek naya update hai!';
const url = process.argv[4] || '/';

sendPushToAll(title, body, url);
