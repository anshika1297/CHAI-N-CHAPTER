import { Router, Request, Response } from 'express';
import { LibraryAuthor } from '../../models/LibraryAuthor.js';
import { LibraryBook } from '../../models/LibraryBook.js';
import { requireAuth } from '../../middlewares/auth.js';
import { librarySlugify } from '../../config/libraryEnums.js';
import { aiEnabled } from '../../services/aiClient.js';
import { suggestAuthorNationalities } from '../../services/aiEnrich.js';

const router = Router();
router.use(requireAuth);

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function strArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x ?? '').trim()).filter(Boolean);
  if (typeof v === 'string' && v.trim()) return v.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

/** Auto-derived per-author stats from the book collection (§7). */
async function authorStats(name: string) {
  const books = await LibraryBook.find({ author: name })
    .select('status ownership rating recommendationHistory')
    .lean();
  const ratings = books.map((b) => b.rating).filter((r): r is number => typeof r === 'number' && r > 0);
  const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

  let recommendationCount = 0;
  let lastRecommendedAt: string | null = null;
  let latestMs = 0;
  for (const b of books) {
    const hist = b.recommendationHistory ?? [];
    recommendationCount += hist.length;
    for (const entry of hist) {
      if (!entry?.date) continue;
      const ms = new Date(entry.date).getTime();
      if (!Number.isFinite(ms)) continue;
      if (ms > latestMs) {
        latestMs = ms;
        lastRecommendedAt = new Date(ms).toISOString();
      }
    }
  }

  return {
    totalBooks: books.length,
    booksRead: books.filter((b) => b.status === 'read').length,
    booksOwned: books.filter((b) => b.ownership === 'owned').length,
    averageRating: Math.round(avg * 10) / 10,
    recommendationCount,
    lastRecommendedAt,
  };
}

/** GET /api/library/authors — paginated list with derived stats. */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '25'), 10) || 25));
    const q = str(req.query.q);
    const missingCountry = req.query.missingCountry === 'true';

    const filter: Record<string, unknown> = {};
    if (q) filter.name = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    if (missingCountry) filter.$or = [{ country: '' }, { country: { $exists: false } }];

    const total = await LibraryAuthor.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const authors = await LibraryAuthor.find(filter)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    const withStats = await Promise.all(
      authors.map(async (a) => ({ ...a, stats: await authorStats(a.name) }))
    );
    res.status(200).json({ authors: withStats, total, page, totalPages });
  } catch (err) {
    console.error('GET /api/library/authors', err);
    res.status(500).json({ error: 'Failed to load authors' });
  }
});

/** Max authors processed per request — keeps the call fast and avoids proxy timeouts. */
const ENRICH_MAX = 30;

function errorSummary(errors: { provider: string; message: string }[]): string {
  if (errors.length === 0) return 'AI returned no data';
  const seen = new Set<string>();
  const parts: string[] = [];
  for (const e of errors) {
    const line = `${e.provider}: ${e.message}`;
    if (seen.has(line)) continue;
    seen.add(line);
    parts.push(line);
  }
  return parts.join(' · ');
}

/**
 * POST /api/library/authors/enrich/suggest
 * Body: { ids?: string[], onlyMissing?: boolean }
 * Prefer passing `ids` (selection-based). Uses AI to infer nationality + language.
 */
router.post('/enrich/suggest', async (req: Request, res: Response): Promise<void> => {
  if (!aiEnabled()) {
    res.status(400).json({ error: 'No AI provider configured. Add an API key to enable AI enrichment.' });
    return;
  }
  const body = (req.body ?? {}) as Record<string, unknown>;
  const onlyMissing = body.onlyMissing !== false;
  const ids = Array.isArray(body.ids) ? body.ids.map((x) => String(x)) : [];

  try {
    const query: Record<string, unknown> = {};
    if (ids.length) query._id = { $in: ids };
    else if (onlyMissing) query.$or = [{ country: '' }, { country: { $exists: false } }];

    const totalMatching = await LibraryAuthor.countDocuments(query);
    const authors = await LibraryAuthor.find(query).select('_id name').limit(ENRICH_MAX).lean();
    if (authors.length === 0) {
      res.status(200).json({ suggestions: [], provider: '', errors: [], message: 'No authors need enrichment.' });
      return;
    }

    const result = await suggestAuthorNationalities(
      authors.map((a) => ({ id: String(a._id), name: a.name }))
    );

    // Nothing came back at all → real failure; report exactly why.
    if (result.suggestions.length === 0 && !result.provider) {
      res.status(502).json({ error: `AI enrichment failed — ${errorSummary(result.errors)}` });
      return;
    }

    res.status(200).json({
      suggestions: result.suggestions,
      provider: result.provider,
      errors: result.errors,
      processed: authors.length,
      remaining: Math.max(0, totalMatching - authors.length),
    });
  } catch (err) {
    console.error('POST /api/library/authors/enrich/suggest', err);
    res.status(500).json({ error: 'Failed to suggest author nationalities' });
  }
});

/**
 * POST /api/library/authors/enrich/apply
 * Body: { updates: [{ id, country?, primaryLanguage? }] }
 * Writes the reviewed suggestions.
 */
router.post('/enrich/apply', async (req: Request, res: Response): Promise<void> => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const updates = Array.isArray(body.updates) ? body.updates : [];
  if (updates.length === 0) {
    res.status(400).json({ error: 'No updates provided' });
    return;
  }
  try {
    let updated = 0;
    for (const u of updates) {
      const row = u as Record<string, unknown>;
      const id = str(row.id);
      if (!id) continue;
      const set: Record<string, string> = {};
      if (typeof row.country === 'string') set.country = row.country.trim();
      if (typeof row.primaryLanguage === 'string') set.primaryLanguage = row.primaryLanguage.trim();
      if (Object.keys(set).length === 0) continue;
      // eslint-disable-next-line no-await-in-loop
      const r = await LibraryAuthor.updateOne({ _id: id }, { $set: set });
      if (r.modifiedCount > 0) updated++;
    }
    res.status(200).json({ updated });
  } catch (err) {
    console.error('POST /api/library/authors/enrich/apply', err);
    res.status(500).json({ error: 'Failed to apply enrichment' });
  }
});

/** POST /api/library/authors */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const name = str(body.name);
  if (!name) {
    res.status(400).json({ error: 'Name is required' });
    return;
  }
  try {
    const slug = librarySlugify(str(body.slug) || name);
    const existing = await LibraryAuthor.findOne({ slug });
    if (existing) {
      res.status(409).json({ error: 'Author already exists' });
      return;
    }
    const doc = await LibraryAuthor.create({
      name,
      slug,
      country: str(body.country),
      primaryLanguage: str(body.primaryLanguage),
      website: str(body.website),
      goodreads: str(body.goodreads),
      instagram: str(body.instagram),
      shortBio: str(body.shortBio),
      awards: strArray(body.awards),
      priorityAuthor: Boolean(body.priorityAuthor),
    });
    res.status(201).json({ author: doc });
  } catch (err) {
    console.error('POST /api/library/authors', err);
    res.status(500).json({ error: 'Failed to create author' });
  }
});

/** PUT /api/library/authors/:id */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  try {
    const doc = await LibraryAuthor.findById(req.params.id);
    if (!doc) {
      res.status(404).json({ error: 'Author not found' });
      return;
    }
    if (str(body.name)) doc.name = str(body.name);
    doc.country = str(body.country);
    doc.primaryLanguage = str(body.primaryLanguage);
    doc.website = str(body.website);
    doc.goodreads = str(body.goodreads);
    doc.instagram = str(body.instagram);
    doc.shortBio = str(body.shortBio);
    doc.awards = strArray(body.awards);
    doc.priorityAuthor = Boolean(body.priorityAuthor);
    await doc.save();
    res.status(200).json({ author: doc });
  } catch (err) {
    console.error('PUT /api/library/authors/:id', err);
    res.status(500).json({ error: 'Failed to update author' });
  }
});

/** DELETE /api/library/authors/:id */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const doc = await LibraryAuthor.findByIdAndDelete(req.params.id);
    if (!doc) {
      res.status(404).json({ error: 'Author not found' });
      return;
    }
    res.status(200).json({ message: 'Author deleted' });
  } catch (err) {
    console.error('DELETE /api/library/authors/:id', err);
    res.status(500).json({ error: 'Failed to delete author' });
  }
});

export default router;
