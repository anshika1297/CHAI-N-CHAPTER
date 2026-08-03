import { Router, type Request, type Response } from 'express';
import { collectGenreIndex } from '../services/genreIndex.js';

const router = Router();

/** GET /api/genres — distinct book genres from CMS content + catalog */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const genres = await collectGenreIndex();
    res.status(200).json({ genres });
  } catch (err) {
    console.error('GET /api/genres', err);
    res.status(500).json({ error: 'Failed to load genres' });
  }
});

export default router;
