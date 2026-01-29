import { Router, Request, Response } from 'express';
import { Subscriber } from '../models/Subscriber.js';
import { requireAuth } from '../middlewares/auth.js';
import { sendWelcomeEmail } from '../services/welcomeEmail.js';

const router = Router();

/** POST /api/subscribe – public, subscribe with email (optional name/source). Idempotent: re-subscribes if previously unsubscribed. */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const email = req.body?.email;
  if (!email || typeof email !== 'string') {
    res.status(400).json({ error: 'Email is required' });
    return;
  }
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : undefined;
  const source = typeof req.body?.source === 'string' ? req.body.source.trim() : undefined;

  try {
    const existing = await Subscriber.findOne({ email: normalized });
    if (existing) {
      existing.status = 'subscribed';
      existing.subscribedAt = new Date();
      existing.unsubscribedAt = undefined;
      if (name !== undefined) existing.name = name || undefined;
      if (source !== undefined) existing.source = source || undefined;
      await existing.save();
      res.status(200).json({ message: 'You are subscribed!', subscribed: true });
      sendWelcomeEmail(normalized, existing.name ?? name).catch((err) => console.error('Welcome email', err));
      return;
    }
    await Subscriber.create({
      email: normalized,
      name: name || undefined,
      source: source || undefined,
      status: 'subscribed',
      subscribedAt: new Date(),
    });
    res.status(201).json({ message: 'You are subscribed!', subscribed: true });
    sendWelcomeEmail(normalized, name).catch((err) => console.error('Welcome email', err));
  } catch (err) {
    console.error('POST /api/subscribe', err);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

/** POST /api/subscribe/unsubscribe – public, unsubscribe by email */
router.post('/unsubscribe', async (req: Request, res: Response): Promise<void> => {
  const email = req.body?.email;
  if (!email || typeof email !== 'string') {
    res.status(400).json({ error: 'Email is required' });
    return;
  }
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  try {
    const sub = await Subscriber.findOne({ email: normalized });
    if (!sub) {
      res.status(200).json({ message: 'Email not found or already unsubscribed.', subscribed: false });
      return;
    }
    sub.status = 'unsubscribed';
    sub.unsubscribedAt = new Date();
    await sub.save();
    res.status(200).json({ message: 'You have been unsubscribed.', subscribed: false });
  } catch (err) {
    console.error('POST /api/subscribe/unsubscribe', err);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

export default router;
