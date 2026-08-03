import { Router, Request, Response } from 'express';
import { VisitorStats, VISITOR_STATS_SINGLETON_ID } from '../models/VisitorStats.js';
import {
  NewsletterStats,
  NEWSLETTER_STATS_SINGLETON_ID,
  type NewsletterPlacementCounts,
} from '../models/NewsletterStats.js';

const router = Router();

function bumpCounts(
  target: NewsletterPlacementCounts,
  event: 'impression' | 'submit' | 'success'
): void {
  if (event === 'impression') target.impressions += 1;
  if (event === 'submit') target.submits += 1;
  if (event === 'success') target.successes += 1;
}

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

/** POST /api/analytics/newsletter – public. Track CTA impressions, submits, and successes by placement. */
router.post('/newsletter', async (req: Request, res: Response): Promise<void> => {
  const event = req.body?.event;
  const placement = typeof req.body?.placement === 'string' ? req.body.placement.trim() : '';
  if (!placement || !['impression', 'submit', 'success'].includes(event)) {
    res.status(400).json({ error: 'Invalid event or placement' });
    return;
  }

  try {
    let doc = await NewsletterStats.findById(NEWSLETTER_STATS_SINGLETON_ID);
    if (!doc) {
      doc = await NewsletterStats.create({
        _id: NEWSLETTER_STATS_SINGLETON_ID,
        totals: { impressions: 0, submits: 0, successes: 0 },
        byPlacement: {},
      });
    }

    const totals = doc.totals ?? { impressions: 0, submits: 0, successes: 0 };
    bumpCounts(totals, event);
    doc.totals = totals;

    const byPlacement = (doc.byPlacement ?? {}) as Record<string, NewsletterPlacementCounts>;
    const row = byPlacement[placement] ?? { impressions: 0, submits: 0, successes: 0 };
    bumpCounts(row, event);
    byPlacement[placement] = row;
    doc.byPlacement = byPlacement;
    doc.markModified('byPlacement');
    await doc.save();

    res.status(204).end();
  } catch (err) {
    console.error('POST /api/analytics/newsletter', err);
    res.status(500).end();
  }
});

export default router;
