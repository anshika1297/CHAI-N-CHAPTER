import { Router, Request, Response } from 'express';
import { Page, PageSlug } from '../models/Page.js';
import { requireAuth } from '../middlewares/auth.js';
import { rewriteImageUrlsInObject } from './upload.js';

const SLUGS: PageSlug[] = ['contact', 'work-with-me', 'about', 'terms', 'privacy', 'header', 'footer', 'home', 'book-clubs', 'blog', 'recommendations', 'musings'];

const router = Router();

/** GET /api/settings/pages/:slug – public, for frontend to render page content */
router.get('/pages/:slug', async (req: Request, res: Response): Promise<void> => {
  const slug = req.params.slug as PageSlug;
  if (!SLUGS.includes(slug)) {
    res.status(400).json({ error: 'Invalid page slug' });
    return;
  }
  try {
    const page = await Page.findOne({ slug });
    if (!page) {
      res.status(200).json({ content: null });
      return;
    }
    const content = rewriteImageUrlsInObject(page.content) as typeof page.content;
    res.status(200).json({ content });
  } catch (err) {
    console.error('GET /api/settings/pages/:slug', err);
    res.status(500).json({ error: 'Failed to load page' });
  }
});

/** PUT /api/settings/pages/:slug – protected, admin saves page content */
router.put('/pages/:slug', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const slug = req.params.slug as PageSlug;
  if (!SLUGS.includes(slug)) {
    res.status(400).json({ error: 'Invalid page slug' });
    return;
  }
  const content = req.body?.content;
  if (content === undefined) {
    res.status(400).json({ error: 'Missing body.content' });
    return;
  }
  // Ensure content is a plain object (blog: { posts }, recommendations/musings: { items })
  const contentObj = content !== null && typeof content === 'object' && !Array.isArray(content) ? content : {};
  try {
    const page = await Page.findOneAndUpdate(
      { slug },
      { $set: { content: contentObj, updatedAt: new Date() } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.status(200).json({ content: page.content });
  } catch (err) {
    console.error('PUT /api/settings/pages/:slug', err);
    res.status(500).json({ error: 'Failed to save page' });
  }
});

export default router;
