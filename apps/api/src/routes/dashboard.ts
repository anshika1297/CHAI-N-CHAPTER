import { Router, Request, Response } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { User } from '../models/User.js';

const router = Router();

/** GET /api/dashboard/stats – placeholder stats (protected). Returns dummy when no real data. */
router.get('/stats', requireAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const userCount = await User.countDocuments();
    const stats = {
      totalVisitors: 1250,
      monthlyVisitors: 320,
      totalPosts: 45,
      totalSubscribers: 89,
      totalAdminUsers: userCount,
    };
    res.status(200).json(stats);
  } catch (err) {
    console.error('GET /api/dashboard/stats', err);
    res.status(500).json({
      totalVisitors: 1250,
      monthlyVisitors: 320,
      totalPosts: 45,
      totalSubscribers: 89,
      totalAdminUsers: 0,
    });
  }
});

export default router;
