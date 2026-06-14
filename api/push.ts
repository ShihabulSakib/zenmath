import webpush from 'web-push';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const publicVapidKey = process.env.VITE_VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;
const contactEmail = process.env.PUSH_CONTACT_EMAIL || 'mailto:example@example.com';

if (publicVapidKey && privateVapidKey) {
  webpush.setVapidDetails(contactEmail, publicVapidKey, privateVapidKey);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Vercel Cron uses GET, App use POST
  const action = req.query.action || req.body?.action;

  if (!publicVapidKey || !privateVapidKey) {
    return res.status(500).json({ error: 'VAPID keys not configured on server' });
  }

  try {
    // 1. Handle Automated Cron Trigger
    if (action === 'automated-check') {
      console.log('Cron trigger received at:', new Date().toISOString());
      
      /* 
       * PROFESSIONAL NOTE:
       * To make this "Better", you need to fetch all subscriptions from a database 
       * (like Vercel KV or Upstash) here and send notifications to all of them.
       * 
       * For now, this endpoint is ready to receive the cron signal.
       */
      return res.status(200).json({ success: true, message: 'Cron check processed' });
    }

    // 2. Handle POST requests from the App
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { subscription, payload } = req.body;

  try {
    switch (action) {
      case 'subscribe':
        // In a real app, you would save the subscription to a database here.
        // For this PWA, we'll return 200 and rely on the client to send the 
        // subscription for the 'trigger' action during testing.
        console.log('New subscription received:', subscription.endpoint);
        return res.status(200).json({ success: true });

      case 'unsubscribe':
        console.log('Unsubscription request for:', req.body.endpoint);
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
