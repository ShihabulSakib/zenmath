import webpush from 'web-push';
import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const publicVapidKey = process.env.VITE_VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;
const contactEmail = process.env.PUSH_CONTACT_EMAIL || 'mailto:example@example.com';
const cronSecret = process.env.CRON_SECRET;

if (publicVapidKey && privateVapidKey) {
  webpush.setVapidDetails(contactEmail, publicVapidKey, privateVapidKey);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Vercel Cron or GitHub Action uses GET, App use POST
  const action = req.query.action || req.body?.action;

  if (!publicVapidKey || !privateVapidKey) {
    return res.status(500).json({ error: 'VAPID keys not configured on server' });
  }

  try {
    // 1. Handle Automated Cron Trigger
    if (action === 'automated-check') {
      // Security check
      const authHeader = req.headers.authorization;
      if (cronSecret && authHeader !== `Bearer ${cronSecret}` && req.query.secret !== cronSecret) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      console.log('Automated push check started...');
      
      // Get all subscriptions from KV
      const keys = await kv.keys('sub:*');
      if (keys.length === 0) {
        return res.status(200).json({ message: 'No subscriptions found' });
      }

      const results = { sent: 0, failed: 0 };
      
      for (const key of keys) {
        const subscription: any = await kv.get(key);
        if (!subscription) continue;

        try {
          await webpush.sendNotification(
            subscription,
            JSON.stringify({
              title: 'ZenMath — Daily Goal',
              body: 'Time to sharpen your mind! Check your daily progress.',
              icon: '/notification-icon.png',
              badge: '/notification-badge.png',
              tag: 'daily-reminder'
            })
          );
          results.sent++;
        } catch (error: any) {
          console.error(`Failed to send to ${key}:`, error.statusCode);
          if (error.statusCode === 410 || error.statusCode === 404) {
            // Subscription expired or gone, remove it
            await kv.del(key);
          }
          results.failed++;
        }
      }

      return res.status(200).json({ 
        success: true, 
        message: `Processed ${keys.length} subscriptions`,
        results 
      });
    }

    // 2. Handle POST requests from the App
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { subscription, payload } = req.body;

    switch (action) {
      case 'subscribe':
        if (!subscription?.endpoint) {
          return res.status(400).json({ error: 'Invalid subscription' });
        }
        // Save to KV with 30-day expiration to keep storage clean
        await kv.set(`sub:${subscription.endpoint}`, subscription, { ex: 60 * 60 * 24 * 30 });
        console.log('Saved subscription:', subscription.endpoint);
        return res.status(200).json({ success: true });

      case 'unsubscribe':
        if (req.body.endpoint) {
          await kv.del(`sub:${req.body.endpoint}`);
          console.log('Removed subscription:', req.body.endpoint);
        }
        return res.status(200).json({ success: true });

      case 'trigger':
        if (!subscription) {
          return res.status(400).json({ error: 'Subscription is required for trigger' });
        }
        
        await webpush.sendNotification(
          subscription,
          JSON.stringify(payload || {
            title: 'ZenMath',
            body: 'Time for your mental math workout!',
            icon: '/notification-icon.png',
            badge: '/notification-badge.png',
            tag: 'daily-reminder'
          })
        );
        return res.status(200).json({ success: true });

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error: any) {
    console.error('Push error:', error);
    return res.status(500).json({ error: error.message || 'Failed to process push action' });
  }
}
