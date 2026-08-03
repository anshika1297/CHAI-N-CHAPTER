import { Router, Request, Response } from 'express';
import { runSearch } from '../services/search.js';

const router = Router();

/** GET /api/search?q=...&limit=8 — global search across all content */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    const limitRaw = parseInt(String(req.query.limit ?? '8'), 10);
    const limitPerGroup = Number.isNaN(limitRaw) ? 8 : Math.min(50, Math.max(1, limitRaw));
    const mode = typeof req.query.mode === 'string' ? req.query.mode : 'modal';

    const minScore = mode === 'full' ? 120 : 150;
    const result = await runSearch(q, { limitPerGroup, minScore });

    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    res.status(200).json(result);
  } catch (err) {
    console.error('GET /api/search', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
