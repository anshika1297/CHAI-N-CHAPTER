import { Router, Request, Response } from 'express';
import { Page } from '../models/Page.js';

const MUSINGS_SLUG = 'musings' as const;

const router = Router();

/** GET /api/musings – public, returns list of musings from page content */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const page = await Page.findOne({ slug: MUSINGS_SLUG });
    const items = page?.content && typeof page.content === 'object' && Array.isArray((page.content as { items?: unknown }).items)
      ? (page.content as { items: unknown[] }).items
      : [];
    res.status(200).json({ items });
  } catch (err) {
    console.error('GET /api/musings', err);
    res.status(500).json({ error: 'Failed to load musings' });
  }
});

/** GET /api/musings/:slug – public, returns a single musing by slug */
router.get('/:slug', async (req: Request, res: Response): Promise<void> => {
  const slug = req.params.slug;
  if (!slug) {
    res.status(400).json({ error: 'Missing slug' });
    return;
  }
  try {
    const page = await Page.findOne({ slug: MUSINGS_SLUG });
    const items = page?.content && typeof page.content === 'object' && Array.isArray((page.content as { items?: unknown[] }).items)
      ? (page.content as { items: Record<string, unknown>[] }).items
      : [];
    const item = items.find((p) => String(p?.slug ?? '').toLowerCase() === slug.toLowerCase());
    if (!item) {
      res.status(404).json({ error: 'Musing not found' });
      return;
    }
    res.status(200).json({ item });
  } catch (err) {
    console.error('GET /api/musings/:slug', err);
    res.status(500).json({ error: 'Failed to load musing' });
  }
});

export default router;
