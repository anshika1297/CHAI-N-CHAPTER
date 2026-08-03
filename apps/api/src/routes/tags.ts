import { Router, Request, Response } from 'express';
import { collectTagIndex, getTagDetail } from '../services/tagAggregate.js';

const router = Router();

/** GET /api/tags — public tag index */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const tags = await collectTagIndex();
    res.status(200).json({ tags, total: tags.length });
  } catch (err) {
    console.error('GET /api/tags', err);
    res.status(500).json({ error: 'Failed to load tags' });
  }
});

/** GET /api/tags/:slug — tagged content aggregation */
router.get('/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = typeof req.params.slug === 'string' ? req.params.slug.trim() : '';
    if (!slug) {
      res.status(400).json({ error: 'Tag slug required' });
      return;
    }
    const detail = await getTagDetail(slug);
    if (!detail) {
      res.status(404).json({ error: 'Tag not found' });
      return;
    }
    res.status(200).json({ tag: detail });
  } catch (err) {
    console.error('GET /api/tags/:slug', err);
    res.status(500).json({ error: 'Failed to load tag' });
  }
});

export default router;
