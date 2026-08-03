import { Router, Request, Response } from 'express';
import { LibraryTaxonomy } from '../../models/LibraryTaxonomy.js';
import { LibraryBook } from '../../models/LibraryBook.js';
import { requireAuth } from '../../middlewares/auth.js';
import { isTaxonomyType, librarySlugify, TAXONOMY_TYPES } from '../../config/libraryEnums.js';
import { syncTaxonomyFromBooks } from '../../services/taxonomySync.js';

const router = Router();
router.use(requireAuth);

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

/** GET /api/library/taxonomy?type=genre — list; omit type to get all grouped by type. */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const type = str(req.query.type);
    if (type) {
      if (!isTaxonomyType(type)) {
        res.status(400).json({ error: 'Invalid taxonomy type' });
        return;
      }
      const items = await LibraryTaxonomy.find({ type }).sort({ name: 1 }).lean();
      res.status(200).json({ type, items });
      return;
    }
    const all = await LibraryTaxonomy.find().sort({ type: 1, name: 1 }).lean();
    const grouped: Record<string, unknown[]> = {};
    for (const t of TAXONOMY_TYPES) grouped[t] = [];
    for (const item of all) grouped[item.type]?.push(item);
    res.status(200).json({ grouped });
  } catch (err) {
    console.error('GET /api/library/taxonomy', err);
    res.status(500).json({ error: 'Failed to load taxonomy' });
  }
});

/**
 * POST /api/library/taxonomy/sync-from-books
 * Backfill Master Data from every book’s genres/themes/tags/etc.
 */
router.post('/sync-from-books', async (_req: Request, res: Response): Promise<void> => {
  try {
    const books = await LibraryBook.find({})
      .select(
        'genres subgenres themes tropes moods publisher country originalLanguage tags collections series'
      )
      .lean();
    const result = await syncTaxonomyFromBooks(books as unknown as Record<string, unknown>[]);
    res.status(200).json(result);
  } catch (err) {
    console.error('POST /api/library/taxonomy/sync-from-books', err);
    res.status(500).json({ error: 'Failed to sync taxonomy from books' });
  }
});
/** POST /api/library/taxonomy */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const type = str(body.type);
  const name = str(body.name);
  if (!isTaxonomyType(type)) {
    res.status(400).json({ error: 'Invalid taxonomy type' });
    return;
  }
  if (!name) {
    res.status(400).json({ error: 'Name is required' });
    return;
  }
  try {
    const slug = librarySlugify(str(body.slug) || name);
    const existing = await LibraryTaxonomy.findOne({ type, slug });
    if (existing) {
      res.status(409).json({ error: `A ${type} with that name already exists` });
      return;
    }
    const doc = await LibraryTaxonomy.create({
      type,
      name,
      slug,
      description: str(body.description),
    });
    res.status(201).json({ item: doc });
  } catch (err) {
    console.error('POST /api/library/taxonomy', err);
    res.status(500).json({ error: 'Failed to create taxonomy item' });
  }
});

/** PUT /api/library/taxonomy/:id */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  try {
    const doc = await LibraryTaxonomy.findById(req.params.id);
    if (!doc) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }
    if (str(body.name)) {
      doc.name = str(body.name);
      if (str(body.slug)) doc.slug = librarySlugify(str(body.slug));
    }
    if (body.description !== undefined) doc.description = str(body.description);
    await doc.save();
    res.status(200).json({ item: doc });
  } catch (err) {
    console.error('PUT /api/library/taxonomy/:id', err);
    res.status(500).json({ error: 'Failed to update taxonomy item' });
  }
});

/** DELETE /api/library/taxonomy/:id */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const doc = await LibraryTaxonomy.findByIdAndDelete(req.params.id);
    if (!doc) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }
    res.status(200).json({ message: 'Item deleted' });
  } catch (err) {
    console.error('DELETE /api/library/taxonomy/:id', err);
    res.status(500).json({ error: 'Failed to delete taxonomy item' });
  }
});

export default router;
