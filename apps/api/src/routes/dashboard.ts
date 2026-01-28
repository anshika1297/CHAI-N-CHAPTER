import { Router, Request, Response } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { User } from '../models/User.js';
import { Subscriber } from '../models/Subscriber.js';

const router = Router();

/** GET /api/dashboard/stats – protected. Uses real totalSubscribers from Subscriber model. */
router.get('/stats', requireAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const [userCount, totalSubscribers] = await Promise.all([
      User.countDocuments(),
      Subscriber.countDocuments({ status: 'subscribed' }),
    ]);
    const stats = {
      totalVisitors: 1250,
      monthlyVisitors: 320,
      totalPosts: 45,
      totalSubscribers,
      totalAdminUsers: userCount,
    };
    res.status(200).json(stats);
  } catch (err) {
    console.error('GET /api/dashboard/stats', err);
    res.status(500).json({
      totalVisitors: 1250,
      monthlyVisitors: 320,
      totalPosts: 45,
      totalSubscribers: 0,
      totalAdminUsers: 0,
    });
  }
});

export default router;
