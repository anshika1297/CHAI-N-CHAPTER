import { Router, Request, Response } from 'express';
import { Page, PageSlug } from '../models/Page.js';
import { requireAuth } from '../middlewares/auth.js';
import { rewriteImageUrlsInObject } from './upload.js';
import {
  sendBlogAnnouncementEmail,
  sendRecommendationAnnouncementEmail,
  sendMusingsAnnouncementEmail,
} from '../services/contentAnnouncementEmail.js';

const SLUGS: PageSlug[] = ['contact', 'work-with-me', 'about', 'terms', 'privacy', 'header', 'footer', 'home', 'book-clubs', 'blog', 'recommendations', 'musings', 'email-settings'];

function getItemSlug(item: unknown): string {
  if (item == null || typeof item !== 'object') return '';
  const slug = (item as Record<string, unknown>).slug;
  const title = (item as Record<string, unknown>).title;
  return typeof slug === 'string' ? String(slug).trim().toLowerCase() : typeof title === 'string' ? String(title).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') : '';
}

function getOldSlugs(page: { content?: unknown } | null, key: 'posts' | 'items'): Set<string> {
  const content = page?.content;
  if (!content || typeof content !== 'object' || Array.isArray(content)) return new Set();
  const arr = (content as Record<string, unknown>)[key];
  if (!Array.isArray(arr)) return new Set();
  const set = new Set<string>();
  for (const item of arr) {
    const s = getItemSlug(item);
    if (s) set.add(s);
  }
  return set;
}

function getNewItemsAndSlugs(contentObj: Record<string, unknown>, key: 'posts' | 'items'): { items: Record<string, unknown>[]; newSlugs: string[] } {
  const arr = contentObj[key];
  if (!Array.isArray(arr)) return { items: [], newSlugs: [] };
  const items = arr.filter((x): x is Record<string, unknown> => x != null && typeof x === 'object');
  const newSlugs = items.map((i) => getItemSlug(i)).filter(Boolean);
  return { items, newSlugs };
}

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
    let content = rewriteImageUrlsInObject(page.content) as Record<string, unknown>;
    // Never send SMTP password to frontend
    if (slug === 'email-settings' && content && typeof content === 'object') {
      content = { ...content };
      if ('smtpPass' in content) {
        content.smtpPassSet = Boolean((content as { smtpPass?: string }).smtpPass);
        delete (content as Record<string, unknown>).smtpPass;
      }
    }
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
  let contentObj = content !== null && typeof content === 'object' && !Array.isArray(content) ? { ...content } : {};
  // email-settings: don't overwrite smtpPass with empty; strip smtpPassSet from payload
  if (slug === 'email-settings' && contentObj && typeof contentObj === 'object') {
    delete (contentObj as Record<string, unknown>).smtpPassSet;
    const pass = (contentObj as Record<string, unknown>).smtpPass;
    if (pass === undefined || pass === null || (typeof pass === 'string' && !pass.trim())) {
      const existing = await Page.findOne({ slug }, { 'content.smtpPass': 1 });
      const existingContent = existing?.content as Record<string, unknown> | undefined;
      if (existingContent?.smtpPass) {
        (contentObj as Record<string, unknown>).smtpPass = existingContent.smtpPass;
      }
    }
  }
  try {
    let existingPage: { content?: unknown } | null = null;
    if (slug === 'blog' || slug === 'recommendations' || slug === 'musings') {
      existingPage = await Page.findOne({ slug }, { content: 1 });
    }

    const page = await Page.findOneAndUpdate(
      { slug },
      { $set: { content: contentObj, updatedAt: new Date() } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    let outContent = page.content as Record<string, unknown>;
    if (slug === 'email-settings' && outContent?.smtpPass) {
      outContent = { ...outContent };
      outContent.smtpPassSet = true;
      delete outContent.smtpPass;
    }
    res.status(200).json({ content: outContent });

    // After successful save: send announcement emails for newly added blog/recommendations/musings (only when page already existed)
    const contentKey = slug === 'blog' ? 'posts' : slug === 'recommendations' || slug === 'musings' ? 'items' : null;
    if (contentKey && contentObj && typeof contentObj === 'object' && existingPage) {
      const oldSlugs = getOldSlugs(existingPage, contentKey);
      const { items } = getNewItemsAndSlugs(contentObj as Record<string, unknown>, contentKey);
      const toAnnounce = items.filter((item) => {
        const s = getItemSlug(item);
        return s && !oldSlugs.has(s);
      });
      for (const item of toAnnounce) {
        try {
          if (slug === 'blog') await sendBlogAnnouncementEmail(item);
          else if (slug === 'recommendations') await sendRecommendationAnnouncementEmail(item);
          else if (slug === 'musings') await sendMusingsAnnouncementEmail(item);
        } catch (err) {
          console.error(`Announcement email failed for ${slug}`, getItemSlug(item), err);
        }
      }
    }
  } catch (err) {
    console.error('PUT /api/settings/pages/:slug', err);
    res.status(500).json({ error: 'Failed to save page' });
  }
});

export default router;
