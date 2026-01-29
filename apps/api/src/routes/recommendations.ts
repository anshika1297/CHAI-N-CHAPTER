import { Router, Request, Response } from 'express';
import { Page } from '../models/Page.js';
import { rewriteImageUrlsInObject } from './upload.js';

const RECOMMENDATIONS_SLUG = 'recommendations' as const;
const SORT_OPTIONS = ['newest', 'oldest', 'reading-time', 'book-count'] as const;

type RecItem = Record<string, unknown>;

function getStr(o: unknown, key: string): string {
  const v = o && typeof o === 'object' && key in o ? (o as Record<string, unknown>)[key] : undefined;
  return typeof v === 'string' ? v : '';
}

/** Get books array from a recommendation item; each book may have title, author, etc. */
function getBooks(p: RecItem): Record<string, unknown>[] {
  const raw = p?.books;
  return Array.isArray(raw) ? raw.filter((b) => b && typeof b === 'object') as Record<string, unknown>[] : [];
}

function matchesRecFilters(p: RecItem, category: string, author: string, book: string, title: string): boolean {
  if (category && getStr(p, 'category').toLowerCase() !== category.toLowerCase()) return false;
  const listTitle = getStr(p, 'title').toLowerCase();
  if (title && !listTitle.includes(title.toLowerCase())) return false;

  // Author: match list title or any book's author
  if (author) {
    const authorLower = author.toLowerCase();
    if (listTitle.includes(authorLower)) return true;
    const books = getBooks(p);
    const authorMatch = books.some((b) => getStr(b, 'author').toLowerCase().includes(authorLower));
    if (!authorMatch) return false;
  }

  // Book: match list title or any book's title
  if (book) {
    const bookLower = book.toLowerCase();
    if (listTitle.includes(bookLower)) return true;
    const books = getBooks(p);
    const bookMatch = books.some((b) => getStr(b, 'title').toLowerCase().includes(bookLower));
    if (!bookMatch) return false;
  }

  return true;
}

const router = Router();

/** GET /api/recommendations – public, list with filter & pagination. Query: page, limit, category, author, book, title, sort */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const pageDoc = await Page.findOne({ slug: RECOMMENDATIONS_SLUG });
    const raw = pageDoc?.content && typeof pageDoc.content === 'object' && Array.isArray((pageDoc.content as { items?: unknown }).items)
      ? (pageDoc.content as { items: unknown[] }).items
      : [];
    const all = rewriteImageUrlsInObject(raw) as RecItem[];

    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit), 10) || 6));
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
    const author = typeof req.query.author === 'string' ? req.query.author.trim() : '';
    const book = typeof req.query.book === 'string' ? req.query.book.trim() : '';
    const title = typeof req.query.title === 'string' ? req.query.title.trim() : '';
    const sortParam = Array.isArray(req.query.sort) ? req.query.sort[0] : req.query.sort;
    const sort = typeof sortParam === 'string' && SORT_OPTIONS.includes(sortParam as (typeof SORT_OPTIONS)[number])
      ? (sortParam as (typeof SORT_OPTIONS)[number])
      : 'newest';

    const filtered = all.filter((p) => matchesRecFilters(p, category, author, book, title));

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
      if (sort === 'book-count') {
        const booksA = Array.isArray(a.books) ? a.books.length : Number(a.bookCount) || 0;
        const booksB = Array.isArray(b.books) ? b.books.length : Number(b.bookCount) || 0;
        return booksB - booksA;
      }
      return 0;
    });

    const total = sorted.length;
    const start = (page - 1) * limit;
    const items = sorted.slice(start, start + limit);

    res.status(200).json({ items, total, page, limit });
  } catch (err) {
    console.error('GET /api/recommendations', err);
    res.status(500).json({ error: 'Failed to load recommendations' });
  }
});

/** GET /api/recommendations/:slug – public, returns a single recommendation list by slug */
router.get('/:slug', async (req: Request, res: Response): Promise<void> => {
  const slug = req.params.slug;
  if (!slug) {
    res.status(400).json({ error: 'Missing slug' });
    return;
  }
  try {
    const page = await Page.findOne({ slug: RECOMMENDATIONS_SLUG });
    const items = page?.content && typeof page.content === 'object' && Array.isArray((page.content as { items?: unknown[] }).items)
      ? (page.content as { items: Record<string, unknown>[] }).items
      : [];
    const item = items.find((p) => String(p?.slug ?? '').toLowerCase() === slug.toLowerCase());
    if (!item) {
      res.status(404).json({ error: 'Recommendation not found' });
      return;
    }
    const rewritten = rewriteImageUrlsInObject(item) as Record<string, unknown>;
    res.status(200).json({ item: rewritten });
  } catch (err) {
    console.error('GET /api/recommendations/:slug', err);
    res.status(500).json({ error: 'Failed to load recommendation' });
  }
});

export default router;
