import { Router, Request, Response } from 'express';
import { VisitorStats, VISITOR_STATS_SINGLETON_ID } from '../models/VisitorStats.js';

const router = Router();

/** GET /api/analytics/track – public. Increments total and monthly visitor count (call on page load). */
router.get('/track', async (_req: Request, res: Response): Promise<void> => {
  try {
    const thisMonth = new Date().toISOString().slice(0, 7); // "2025-01"

    const doc = await VisitorStats.findById(VISITOR_STATS_SINGLETON_ID);

    if (!doc) {
      await VisitorStats.create({
        _id: VISITOR_STATS_SINGLETON_ID,
        totalVisitors: 1,
        monthlyVisitors: 1,
        currentMonth: thisMonth,
      });
      res.status(204).end();
      return;
    }

    const isSameMonth = doc.currentMonth === thisMonth;
    doc.totalVisitors += 1;
    doc.monthlyVisitors = isSameMonth ? doc.monthlyVisitors + 1 : 1;
    doc.currentMonth = thisMonth;
    await doc.save();

    res.status(204).end();
  } catch (err) {
    console.error('GET /api/analytics/track', err);
    res.status(500).end();
  }
});

export default router;
