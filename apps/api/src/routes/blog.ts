import { Router, Request, Response } from 'express';
import { Page } from '../models/Page.js';

const BLOG_SLUG = 'blog' as const;

const router = Router();

/** GET /api/blog/posts – public, returns list of blog posts (book reviews) from page content */
router.get('/posts', async (_req: Request, res: Response): Promise<void> => {
  try {
    const page = await Page.findOne({ slug: BLOG_SLUG });
    const posts = page?.content && typeof page.content === 'object' && Array.isArray((page.content as { posts?: unknown }).posts)
      ? (page.content as { posts: unknown[] }).posts
      : [];
    res.status(200).json({ posts });
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
    res.status(200).json({ post });
  } catch (err) {
    console.error('GET /api/blog/posts/:slug', err);
    res.status(500).json({ error: 'Failed to load post' });
  }
});

export default router;
