import { Router, Request, Response } from 'express';
import { Page } from '../models/Page.js';
import { rewriteImageUrlsInObject } from './upload.js';

const BLOG_SLUG = 'blog' as const;
const SORT_OPTIONS = ['newest', 'oldest', 'reading-time'] as const;

type BlogItem = Record<string, unknown>;

function getStr(o: unknown, key: string): string {
  const v = o && typeof o === 'object' && key in o ? (o as Record<string, unknown>)[key] : undefined;
  return typeof v === 'string' ? v : '';
}

function matchesBlogFilters(
  p: BlogItem,
  category: string,
  author: string,
  book: string,
  title: string
): boolean {
  if (category && getStr(p, 'category').toLowerCase() !== category.toLowerCase()) return false;
  if (author && !getStr(p, 'author').toLowerCase().includes(author.toLowerCase())) return false;
  if (book && !getStr(p, 'bookTitle').toLowerCase().includes(book.toLowerCase())) return false;
  if (title && !getStr(p, 'title').toLowerCase().includes(title.toLowerCase())) return false;
  return true;
}

const router = Router();

/** GET /api/blog/posts – public, list with filter & pagination. Query: page, limit, category, author, book, title, sort */
router.get('/posts', async (req: Request, res: Response): Promise<void> => {
  try {
    const pageDoc = await Page.findOne({ slug: BLOG_SLUG });
    const raw = pageDoc?.content && typeof pageDoc.content === 'object' && Array.isArray((pageDoc.content as { posts?: unknown }).posts)
      ? (pageDoc.content as { posts: unknown[] }).posts
      : [];
    const all = rewriteImageUrlsInObject(raw) as BlogItem[];

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

    const filtered = all.filter((p) => matchesBlogFilters(p, category, author, book, title));

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
    const posts = sorted.slice(start, start + limit);

    res.status(200).json({ posts, total, page, limit });
  } catch (err) {
    console.error('GET /api/blog/posts', err);
    res.status(500).json({ error: 'Failed to load blog posts' });
  }
});

/** GET /api/blog/posts/:slug – public, returns a single blog post by slug */
router.get('/posts/:slug', async (req: Request, res: Response): Promise<void> => {
  const slug = req.params.slug;
  if (!slug) {
    res.status(400).json({ error: 'Missing slug' });
    return;
  }
  try {
    const page = await Page.findOne({ slug: BLOG_SLUG });
    const posts = page?.content && typeof page.content === 'object' && Array.isArray((page.content as { posts?: unknown[] }).posts)
      ? (page.content as { posts: Record<string, unknown>[] }).posts
      : [];
    const post = posts.find((p) => String(p?.slug ?? '').toLowerCase() === slug.toLowerCase());
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    const rewritten = rewriteImageUrlsInObject(post) as Record<string, unknown>;
    res.status(200).json({ post: rewritten });
  } catch (err) {
    console.error('GET /api/blog/posts/:slug', err);
    res.status(500).json({ error: 'Failed to load post' });
  }
});

export default router;
