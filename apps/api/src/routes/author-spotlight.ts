import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { AuthorSpotlight, IAuthorSpotlight } from '../models/AuthorSpotlight.js';
import { requireAuth } from '../middlewares/auth.js';
import { announceResultMessage } from '../utils/announceRoute.js';
import {
  assertNotYetEmailed,
  markAuthorSpotlightSubscribersEmailed,
} from '../utils/markSubscribersEmailed.js';
import { sendAuthorSpotlightAnnouncementEmail } from '../services/authorSpotlightAnnouncementEmail.js';
import { resolveSpotlightReadNext, invalidateSpotlightReadNextCache } from '../services/spotlightReadNext.js';
import { rebuildBookCatalog } from '../services/bookCatalogSync.js';
import { hashSpotlightContent } from '../services/contentFreshness.js';

function sanitizeConnectLinks(raw: unknown) {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const keys = [
    'website',
    'goodreads',
    'amazonAuthor',
    'instagram',
    'facebook',
    'linkedin',
    'newsletter',
    'publisher',
  ] as const;
  const out: Record<string, string> = {};
  for (const k of keys) {
    const v = typeof o[k] === 'string' ? o[k].trim() : '';
    if (v) out[k] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

const router = Router();

function shareImageFromBody(body: Record<string, unknown>): string {
  const share = String(body.socialShareImage || body.ogImage || '').trim();
  return share;
}

function normalizeSlug(input: string): string {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function isPubliclyVisible(doc: IAuthorSpotlight): boolean {
  if (!doc.isPublished) return false;
  if (!doc.publishDate) return true;
  return new Date(doc.publishDate) <= new Date();
}

async function tryFirstPublishAnnounce(doc: IAuthorSpotlight): Promise<string | undefined> {
  if (!doc.isPublished || !isPubliclyVisible(doc)) return undefined;
  try {
    assertNotYetEmailed(doc);
    const result = await sendAuthorSpotlightAnnouncementEmail(doc);
    if (result.sent > 0 || (result.testMode && result.sent === 1)) {
      await markAuthorSpotlightSubscribersEmailed(String(doc._id));
    }
    return announceResultMessage(result);
  } catch (e) {
    return e instanceof Error ? e.message : 'Email failed';
  }
}

function serialize(doc: IAuthorSpotlight) {
  const o = doc.toObject();
  const id = String(o._id);
  delete (o as { _id?: unknown })._id;
  delete (o as { __v?: unknown }).__v;
  return { ...o, id };
}

function serializePublicListItem(doc: IAuthorSpotlight) {
  const o = doc.toObject();
  const coverImage = String(o.coverImage || '').trim();
  return {
    id: String(o._id),
    slug: o.slug,
    name: o.name,
    tagline: o.tagline,
    coverImage: coverImage || undefined,
    profileImage: o.profileImage,
    genres: o.genres || [],
    displayOrder: o.displayOrder,
    publishDate: o.publishDate,
  };
}

// ——— Public ———

/** GET / – published spotlights (visible by publish date). */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const all = await AuthorSpotlight.find({ isPublished: true }).sort({
      displayOrder: 1,
      publishDate: -1,
      name: 1,
    });
    const visible = all.filter(isPubliclyVisible);
    res.json({ spotlights: visible.map(serializePublicListItem) });
  } catch (e) {
    console.error('author-spotlight list', e);
    res.status(500).json({ error: 'Failed to list author spotlights' });
  }
});

// ——— Admin (must be registered before GET /:slug so paths like /admin are not captured as slugs) ———

/** GET /admin – all spotlights. */
router.get('/admin', requireAuth, async (_req: Request, res: Response) => {
  try {
    const docs = await AuthorSpotlight.find({}).sort({ displayOrder: 1, name: 1 });
    res.json({ spotlights: docs.map(serialize) });
  } catch (e) {
    console.error('author-spotlight admin list', e);
    res.status(500).json({ error: 'Failed to list' });
  }
});

/** POST /admin – create. */
router.post('/admin', requireAuth, async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const slug = normalizeSlug(body.slug || body.name || '');
    if (!slug) {
      res.status(400).json({ error: 'slug or name required for a valid slug' });
      return;
    }
    const name = String(body.name || '').trim();
    if (!name) {
      res.status(400).json({ error: 'name is required' });
      return;
    }
    const profileImage = String(body.profileImage || '').trim();
    if (!profileImage) {
      res.status(400).json({ error: 'profileImage is required' });
      return;
    }
    const exists = await AuthorSpotlight.findOne({ slug });
    if (exists) {
      res.status(409).json({ error: 'Slug already exists' });
      return;
    }
    const isPublished = Boolean(body.isPublished);
    const doc = await AuthorSpotlight.create({
      slug,
      name,
      tagline: String(body.tagline || '').trim(),
      coverImage: String(body.coverImage || '').trim(),
      profileImage,
      introduction: String(body.introduction || '').trim(),
      whoIsHtml: String(body.whoIsHtml || '').trim(),
      bio: String(body.bio || '').trim(),
      genres: Array.isArray(body.genres) ? body.genres.map(String) : [],
      connectLinks: sanitizeConnectLinks(body.connectLinks),
      socialLinks: Array.isArray(body.socialLinks) ? body.socialLinks : [],
      featuredBooks: Array.isArray(body.featuredBooks) ? body.featuredBooks : [],
      blogLinks: Array.isArray(body.blogLinks) ? body.blogLinks : [],
      readingPairings: Array.isArray(body.readingPairings) ? body.readingPairings : [],
      faq: Array.isArray(body.faq) ? body.faq : [],
      interviewSectionTitle: String(body.interviewSectionTitle || 'Interview').trim(),
      interview: Array.isArray(body.interview) ? body.interview : [],
      isPublished,
      publishDate: body.publishDate
        ? new Date(body.publishDate)
        : isPublished
          ? new Date()
          : undefined,
      displayOrder: Number(body.displayOrder) || 0,
      seoTitle: String(body.seoTitle || '').trim(),
      seoDescription: String(body.seoDescription || '').trim(),
      socialShareImage: shareImageFromBody(body),
      ogImage: shareImageFromBody(body),
      tags: Array.isArray(body.tags) ? body.tags.map(String) : [],
      canonicalUrl: String(body.canonicalUrl || '').trim(),
      startHere: String(body.startHere || '').trim(),
      notableWorks: Array.isArray(body.notableWorks) ? body.notableWorks.map(String) : [],
      similarAuthors: Array.isArray(body.similarAuthors) ? body.similarAuthors : [],
    });
    const announceMessage = await tryFirstPublishAnnounce(doc);
    rebuildBookCatalog().catch((err) => console.error('book catalog sync', err));
    const fresh = await AuthorSpotlight.findById(doc._id);
    res.status(201).json({ spotlight: serialize(fresh ?? doc), announceMessage });
  } catch (e) {
    console.error('author-spotlight create', e);
    res.status(500).json({ error: 'Failed to create' });
  }
});

/** POST /admin/reorder – set displayOrder from ordered ids. */
router.post('/admin/reorder', requireAuth, async (req: Request, res: Response) => {
  try {
    const ids = req.body?.ids;
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: 'ids array required' });
      return;
    }
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      if (!mongoose.Types.ObjectId.isValid(id)) continue;
      await AuthorSpotlight.findByIdAndUpdate(id, { displayOrder: i }, { timestamps: false });
    }
    const docs = await AuthorSpotlight.find({}).sort({ displayOrder: 1, name: 1 });
    res.json({ spotlights: docs.map(serialize) });
  } catch (e) {
    console.error('author-spotlight reorder', e);
    res.status(500).json({ error: 'Failed to reorder' });
  }
});

/** GET /admin/:id */
router.get('/admin/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ error: 'Invalid id' });
      return;
    }
    const doc = await AuthorSpotlight.findById(req.params.id);
    if (!doc) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json({ spotlight: serialize(doc) });
  } catch (e) {
    console.error('author-spotlight admin get', e);
    res.status(500).json({ error: 'Failed to load' });
  }
});

/** PUT /admin/:id – full update. */
router.put('/admin/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ error: 'Invalid id' });
      return;
    }
    const body = req.body || {};
    const doc = await AuthorSpotlight.findById(req.params.id);
    if (!doc) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    doc.$locals._prevContentHash = hashSpotlightContent(
      doc.toObject() as unknown as Record<string, unknown>
    );
    const wasPublished = doc.isPublished;
    let slug = doc.slug;
    if (body.slug != null) {
      const next = normalizeSlug(String(body.slug));
      if (next) {
        const clash = await AuthorSpotlight.findOne({ slug: next, _id: { $ne: doc._id } });
        if (clash) {
          res.status(409).json({ error: 'Slug already in use' });
          return;
        }
        slug = next;
      }
    }
    doc.slug = slug;
    if (body.name != null) doc.name = String(body.name).trim();
    if (body.tagline != null) doc.tagline = String(body.tagline).trim();
    if (body.coverImage != null) doc.coverImage = String(body.coverImage).trim();
    if (body.profileImage != null) doc.profileImage = String(body.profileImage).trim();
    if (body.introduction != null) doc.introduction = String(body.introduction).trim();
    if (body.whoIsHtml != null) doc.whoIsHtml = String(body.whoIsHtml).trim();
    if (body.bio != null) doc.bio = String(body.bio).trim();
    if (Array.isArray(body.genres)) doc.genres = body.genres.map(String);
    if (body.connectLinks !== undefined) doc.connectLinks = sanitizeConnectLinks(body.connectLinks);
    if (Array.isArray(body.socialLinks)) doc.socialLinks = body.socialLinks;
    if (Array.isArray(body.featuredBooks)) doc.featuredBooks = body.featuredBooks;
    if (Array.isArray(body.blogLinks)) doc.blogLinks = body.blogLinks;
    if (Array.isArray(body.readingPairings)) doc.readingPairings = body.readingPairings;
    if (Array.isArray(body.faq)) doc.faq = body.faq;
    if (body.interviewSectionTitle != null)
      doc.interviewSectionTitle = String(body.interviewSectionTitle).trim();
    if (Array.isArray(body.interview)) doc.interview = body.interview;
    if (body.isPublished != null) {
      doc.isPublished = Boolean(body.isPublished);
      if (doc.isPublished && !doc.publishDate) doc.publishDate = new Date();
    }
    if (body.publishDate !== undefined)
      doc.publishDate = body.publishDate ? new Date(body.publishDate) : undefined;
    if (body.displayOrder != null) doc.displayOrder = Number(body.displayOrder) || 0;
    if (body.seoTitle != null) doc.seoTitle = String(body.seoTitle).trim();
    if (body.seoDescription != null) doc.seoDescription = String(body.seoDescription).trim();
    if (body.socialShareImage != null || body.ogImage != null) {
      const share = shareImageFromBody(body);
      doc.socialShareImage = share;
      doc.ogImage = share;
    }
    if (Array.isArray(body.tags)) doc.tags = body.tags.map(String);
    if (body.canonicalUrl != null) doc.canonicalUrl = String(body.canonicalUrl).trim();
    if (body.startHere != null) doc.startHere = String(body.startHere).trim();
    if (Array.isArray(body.notableWorks)) doc.notableWorks = body.notableWorks.map(String);
    if (Array.isArray(body.similarAuthors)) doc.similarAuthors = body.similarAuthors;

    if (!doc.name?.trim()) {
      res.status(400).json({ error: 'name is required' });
      return;
    }
    if (!doc.profileImage?.trim()) {
      res.status(400).json({ error: 'profileImage is required' });
      return;
    }

    await doc.save();
    invalidateSpotlightReadNextCache();
    rebuildBookCatalog().catch((err) => console.error('book catalog sync', err));
    let announceMessage: string | undefined;
    if (!wasPublished && doc.isPublished) {
      announceMessage = await tryFirstPublishAnnounce(doc);
    }
    const fresh = await AuthorSpotlight.findById(doc._id);
    res.json({ spotlight: serialize(fresh ?? doc), announceMessage });
  } catch (e) {
    console.error('author-spotlight update', e);
    res.status(500).json({ error: 'Failed to update' });
  }
});

/** PATCH /admin/:id/publish */
router.patch('/admin/:id/publish', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ error: 'Invalid id' });
      return;
    }
    const { isPublished } = req.body || {};
    if (typeof isPublished !== 'boolean') {
      res.status(400).json({ error: 'isPublished boolean required' });
      return;
    }
    const doc = await AuthorSpotlight.findById(req.params.id);
    if (!doc) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    const wasPublished = doc.isPublished;
    doc.isPublished = isPublished;
    if (isPublished && !doc.publishDate) {
      doc.publishDate = new Date();
    }
    await doc.save();
    let announceMessage: string | undefined;
    if (isPublished && !wasPublished) {
      announceMessage = await tryFirstPublishAnnounce(doc);
    }
    const fresh = await AuthorSpotlight.findById(doc._id);
    res.json({ spotlight: serialize(fresh ?? doc), announceMessage });
  } catch (e) {
    console.error('author-spotlight publish', e);
    res.status(500).json({ error: 'Failed to update publish state' });
  }
});

/** DELETE /admin/:id */
router.delete('/admin/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ error: 'Invalid id' });
      return;
    }
    const result = await AuthorSpotlight.findByIdAndDelete(req.params.id);
    if (!result) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    rebuildBookCatalog().catch((err) => console.error('book catalog sync', err));
    res.status(204).send();
  } catch (e) {
    console.error('author-spotlight delete', e);
    res.status(500).json({ error: 'Failed to delete' });
  }
});

/** POST /admin/:id/announce – email subscribers about a live spotlight. */
router.post('/admin/:id/announce', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ error: 'Invalid id' });
      return;
    }
    const doc = await AuthorSpotlight.findById(req.params.id);
    if (!doc) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    if (!isPubliclyVisible(doc)) {
      res.status(400).json({
        error: 'This spotlight is not live yet. Publish it before emailing subscribers.',
      });
      return;
    }
    assertNotYetEmailed(doc);
    const result = await sendAuthorSpotlightAnnouncementEmail(doc);
    if (result.sent > 0 || (result.testMode && result.sent === 1)) {
      await markAuthorSpotlightSubscribersEmailed(String(doc._id));
    }
    res.status(200).json({ ...result, message: announceResultMessage(result) });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to send announcement';
    console.error('author-spotlight announce', e);
    res.status(500).json({ error: message });
  }
});

/** GET /:slug/read-next – related author spotlights (genres → tags → newest). */
router.get('/:slug/read-next', async (req: Request, res: Response) => {
  try {
    const slug = String(req.params.slug || '').toLowerCase();
    const limit = Math.min(8, Math.max(1, parseInt(String(req.query.limit), 10) || 4));
    const items = await resolveSpotlightReadNext(slug, limit);
    res.json({ items });
  } catch (e) {
    console.error('author-spotlight read-next', e);
    res.status(500).json({ error: 'Failed to load related authors' });
  }
});

/** GET /:slug – single spotlight (404 if not visible). Must be last. */
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const slug = String(req.params.slug || '').toLowerCase();
    if (!slug) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    const doc = await AuthorSpotlight.findOne({ slug });
    if (!doc || !isPubliclyVisible(doc)) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json({ spotlight: serialize(doc) });
  } catch (e) {
    console.error('author-spotlight get', e);
    res.status(500).json({ error: 'Failed to load author spotlight' });
  }
});

export default router;
