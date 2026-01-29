import { Router, Request, Response } from 'express';
import { Page } from '../models/Page.js';
import { rewriteImageUrlsInObject } from './upload.js';

const MUSINGS_SLUG = 'musings' as const;
const SORT_OPTIONS = ['newest', 'oldest', 'reading-time'] as const;

type MusingItem = Record<string, unknown>;

function getStr(o: unknown, key: string): string {
  const v = o && typeof o === 'object' && key in o ? (o as Record<string, unknown>)[key] : undefined;
  return typeof v === 'string' ? v : '';
}

function matchesMusingFilters(p: MusingItem, category: string, title: string): boolean {
  if (category && getStr(p, 'category').toLowerCase() !== category.toLowerCase()) return false;
  if (title && !getStr(p, 'title').toLowerCase().includes(title.toLowerCase())) return false;
  return true;
}

const router = Router();

/** GET /api/musings – public, list with filter & pagination. Query: page, limit, category, title, sort */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const pageDoc = await Page.findOne({ slug: MUSINGS_SLUG });
    const raw = pageDoc?.content && typeof pageDoc.content === 'object' && Array.isArray((pageDoc.content as { items?: unknown }).items)
      ? (pageDoc.content as { items: unknown[] }).items
      : [];
    const all = rewriteImageUrlsInObject(raw) as MusingItem[];

    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit), 10) || 6));
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
    const title = typeof req.query.title === 'string' ? req.query.title.trim() : '';
    const sortParam = Array.isArray(req.query.sort) ? req.query.sort[0] : req.query.sort;
    const sort = typeof sortParam === 'string' && SORT_OPTIONS.includes(sortParam as (typeof SORT_OPTIONS)[number])
      ? (sortParam as (typeof SORT_OPTIONS)[number])
      : 'newest';

    const filtered = all.filter((p) => matchesMusingFilters(p, category, title));

    const sorted = [...filtered].sort((a, b) => {
      if (sort === 'newest' || sort === 'oldest') {
        const ta = new Date(getStr(a, 'publishedAt') || 0).getTime();
        const tb = new Date(getStr(b, 'publishedAt') || 0).getTime();
        return sort === 'newest' ? tb - ta : ta - tb;
      }
      if (sort === 'reading-time') {
        const ra = Number(a.readingTime) || 0;
        const rb = Number(b.readingTime) || 0;
        return rb - ra;
      }
      return 0;
    });

    const total = sorted.length;
    const start = (page - 1) * limit;
    const items = sorted.slice(start, start + limit);

    res.status(200).json({ items, total, page, limit });
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
    const rewritten = rewriteImageUrlsInObject(item) as Record<string, unknown>;
    res.status(200).json({ item: rewritten });
  } catch (err) {
    console.error('GET /api/musings/:slug', err);
    res.status(500).json({ error: 'Failed to load musing' });
  }
});

export default router;
