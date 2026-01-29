import { Router, Request, Response } from 'express';
import { Message, MessageSource } from '../models/Message.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

/** POST /api/messages – public, submit contact or work-with-me form */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { name, email, subject, message, service, source } = req.body ?? {};
  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'Name is required' });
    return;
  }
  if (!email || typeof email !== 'string' || !email.trim()) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }
  if (!message || typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ error: 'Message is required' });
    return;
  }
  const src: MessageSource = source === 'work-with-me' ? 'work-with-me' : 'contact';
  try {
    await Message.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: typeof subject === 'string' ? subject.trim() : undefined,
      message: message.trim(),
      service: typeof service === 'string' ? service.trim() : undefined,
      source: src,
      read: false,
    });
    res.status(201).json({ message: 'Your message has been sent. We\'ll get back to you soon!' });
  } catch (err) {
    console.error('POST /api/messages', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

/** GET /api/messages – admin only, paginated list */
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit), 10) || 20));
  const source = req.query.source as string | undefined;
  const filter = source === 'contact' || source === 'work-with-me' ? { source } : {};
  try {
    const [items, total] = await Promise.all([
      Message.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Message.countDocuments(filter),
    ]);
    const list = items.map((doc) => ({
      id: (doc as { _id: unknown })._id?.toString?.(),
      name: (doc as { name: string }).name,
      email: (doc as { email: string }).email,
      subject: (doc as { subject?: string }).subject,
      message: (doc as { message: string }).message,
      service: (doc as { service?: string }).service,
      source: (doc as { source: MessageSource }).source,
      read: (doc as { read: boolean }).read,
      createdAt: (doc as { createdAt: Date }).createdAt,
    }));
    res.status(200).json({ list, total, page, limit });
  } catch (err) {
    console.error('GET /api/messages', err);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

/** PATCH /api/messages/:id/read – admin only, mark as read */
router.patch('/:id/read', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id;
  try {
    const msg = await Message.findByIdAndUpdate(id, { read: true }, { new: true });
    if (!msg) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }
    res.status(200).json({ read: true });
  } catch (err) {
    console.error('PATCH /api/messages/:id/read', err);
    res.status(500).json({ error: 'Failed to update' });
  }
});

export default router;
