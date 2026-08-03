import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { buildLibraryAnalytics } from '../../services/libraryAnalytics.js';

const router = Router();
router.use(requireAuth);

/** GET /api/library/analytics — finished/year, genre mix, rec frequency, discovery. */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const analytics = await buildLibraryAnalytics();
    res.status(200).json(analytics);
  } catch (err) {
    console.error('GET /api/library/analytics', err);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

export default router;
