import { Router, Request, Response } from 'express';
import { Book } from '../models/Book.js';
import { requireAuth } from '../middlewares/auth.js';
import type { IBook } from '../models/Book.js';
import { rebuildBookCatalog, serializeBook } from '../services/bookCatalogSync.js';
import { listBookDirectory } from '../services/bookDirectory.js';
import { findRelatedBooks } from '../services/relatedBooks.js';
import { lookupCatalogBook } from '../services/bookLookup.js';

const router = Router();

/** GET /api/books/lookup?title=&author= — exact/near match for admin shop autofill */
router.get('/lookup', async (req: Request, res: Response): Promise<void> => {
  const title = typeof req.query.title === 'string' ? req.query.title : '';
  const author = typeof req.query.author === 'string' ? req.query.author : '';
  if (!title.trim() || !author.trim()) {
    res.status(400).json({ error: 'title and author are required' });
    return;
  }
  try {
    const book = await lookupCatalogBook(title, author);
    res.status(200).json({ book });
  } catch (err) {
    console.error('GET /api/books/lookup', err);
    res.status(500).json({ error: 'Failed to look up book' });
  }
});

/** GET /api/books/related — scored related books for discovery */
router.get('/related', async (req: Request, res: Response): Promise<void> => {
  const bookSlug = typeof req.query.bookSlug === 'string' ? req.query.bookSlug.trim() : undefined;
  const author = typeof req.query.author === 'string' ? req.query.author.trim() : undefined;
  const genre = typeof req.query.genre === 'string' ? req.query.genre.trim() : undefined;
  const recommendationSlug =
    typeof req.query.recommendationSlug === 'string' ? req.query.recommendationSlug.trim() : undefined;
  const tagsRaw = typeof req.query.tags === 'string' ? req.query.tags : '';
  const tags = tagsRaw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  const excludeRaw = typeof req.query.exclude === 'string' ? req.query.exclude : '';
  const excludeSlugs = excludeRaw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const limit = Math.min(12, Math.max(1, parseInt(String(req.query.limit), 10) || 6));

  try {
    const books = await findRelatedBooks({
      bookSlug,
      author,
      genre,
      tags,
      recommendationSlug,
      excludeSlugs,
      limit,
    });
    res.status(200).json({ books });
  } catch (err) {
    console.error('GET /api/books/related', err);
    res.status(500).json({ error: 'Failed to load related books' });
  }
});

/** GET /api/books/directory — searchable, filterable book directory */
router.get('/directory', async (req: Request, res: Response): Promise<void> => {
  const q = typeof req.query.q === 'string' ? req.query.q : undefined;
  const author = typeof req.query.author === 'string' ? req.query.author : undefined;
  const genre = typeof req.query.genre === 'string' ? req.query.genre : undefined;
  const contentType =
    typeof req.query.contentType === 'string' ? req.query.contentType.trim() : undefined;
  const sortRaw = typeof req.query.sort === 'string' ? req.query.sort.trim() : 'az';
  const sort = sortRaw === 'recent' || sortRaw === 'referenced' ? sortRaw : 'az';
  const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
  const limit = Math.min(500, Math.max(1, parseInt(String(req.query.limit), 10) || 100));
  const includeFacets = req.query.facets === '1' || req.query.facets === 'true';

  try {
    const result = await listBookDirectory({
      q,
      author,
      genre,
      contentType: contentType as 'blog' | 'recommendations' | 'author-spotlight' | undefined,
      sort,
      page,
      limit,
      includeFacets,
    });
    res.status(200).json(result);
  } catch (err) {
    console.error('GET /api/books/directory', err);
    res.status(500).json({ error: 'Failed to load book directory' });
  }
});

/** GET /api/books — public catalog list */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const slugsRaw = typeof req.query.slugs === 'string' ? req.query.slugs : '';
  const slugs = slugsRaw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 50));

  try {
    const filter = slugs.length ? { bookSlug: { $in: slugs } } : {};
    const books = await Book.find(filter).sort({ title: 1 }).limit(limit).lean();
    res.status(200).json({
      books: books.map((b) => serializeBook(b as unknown as IBook)),
      total: books.length,
    });
  } catch (err) {
    console.error('GET /api/books', err);
    res.status(500).json({ error: 'Failed to load books' });
  }
});

/** POST /api/books/rebuild — admin: resync catalog from all CMS content */
router.post('/rebuild', requireAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await rebuildBookCatalog();
    res.status(200).json({ message: 'Book catalog rebuilt', ...result });
  } catch (err) {
    console.error('POST /api/books/rebuild', err);
    res.status(500).json({ error: 'Failed to rebuild catalog' });
  }
});

/** GET /api/books/:bookSlug — public book detail with source references */
router.get('/:bookSlug', async (req: Request, res: Response): Promise<void> => {
  const bookSlug = String(req.params.bookSlug || '').trim().toLowerCase();
  if (!bookSlug) {
    res.status(400).json({ error: 'bookSlug required' });
    return;
  }
  try {
    const doc = await Book.findOne({ bookSlug }).lean();
    if (!doc) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }
    res.status(200).json({ book: serializeBook(doc as unknown as IBook) });
  } catch (err) {
    console.error('GET /api/books/:bookSlug', err);
    res.status(500).json({ error: 'Failed to load book' });
  }
});

export default router;
