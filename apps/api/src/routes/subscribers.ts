import { Router, Request, Response } from 'express';
import { Subscriber } from '../models/Subscriber.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

/** GET /api/subscribers – admin only, list subscribers with pagination. Query: page (default 1), limit (default 20), status (optional: subscribed | unsubscribed) */
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 20));
  const status = req.query.status as string | undefined;
  const filter = status === 'subscribed' || status === 'unsubscribed' ? { status } : {};

  try {
    const [subscribers, total] = await Promise.all([
      Subscriber.find(filter)
        .sort({ subscribedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      Subscriber.countDocuments(filter),
    ]);
    const totalSubscribed = status === 'subscribed' ? total : await Subscriber.countDocuments({ status: 'subscribed' });
    res.status(200).json({
      subscribers: subscribers.map((s) => {
        const d = s as { _id: unknown; email: string; name?: string; status: string; subscribedAt: Date; unsubscribedAt?: Date; source?: string };
        return {
          id: String(d._id),
          email: d.email,
          name: d.name,
          status: d.status,
          subscribedAt: d.subscribedAt,
          unsubscribedAt: d.unsubscribedAt,
          source: d.source,
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      totalSubscribed,
    });
  } catch (err) {
    console.error('GET /api/subscribers', err);
    res.status(500).json({ error: 'Failed to load subscribers' });
  }
});

export default router;
