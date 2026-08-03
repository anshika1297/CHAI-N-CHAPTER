import { Router, Request, Response } from 'express';
import { LibraryBook, ILibraryBook } from '../../models/LibraryBook.js';
import { requireAuth } from '../../middlewares/auth.js';
import { librarySlugify } from '../../config/libraryEnums.js';
import {
  buildLibraryBookFilter,
  getLibraryFacets,
  sortSpecFor,
} from '../../services/libraryBookFilter.js';
import { aiEnabled } from '../../services/aiClient.js';
import {
  BOOK_ENRICH_MAX,
  suggestBookClassification,
  suggestBooksEnrichment,
} from '../../services/aiEnrich.js';
import { syncTaxonomyFromBook } from '../../services/taxonomySync.js';
import { findDuplicateBookGroups, mergeLibraryBooks } from '../../services/libraryMerge.js';

const router = Router();

// All Library OS routes are admin-only.
router.use(requireAuth);

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function strArray(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v.map((x) => (typeof x === 'string' ? x.trim() : String(x ?? '').trim())).filter(Boolean);
  }
  if (typeof v === 'string' && v.trim()) {
    return v.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function numOrUndef(v: unknown): number | undefined {
  if (v === '' || v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function dateOrUndef(v: unknown): Date | undefined {
  const s = str(v);
  if (!s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** Build a $set-friendly object from request body (create + update share this). */
function bookFieldsFromBody(body: Record<string, unknown>): Partial<ILibraryBook> {
  const fields: Record<string, unknown> = {
    subtitle: str(body.subtitle),
    coverImage: str(body.coverImage),
    isbn: str(body.isbn),
    asin: str(body.asin),
    format: str(body.format),
    edition: str(body.edition),
    description: str(body.description),
    author: str(body.author),
    authorGender: str(body.authorGender),
    series: str(body.series),
    publisher: str(body.publisher),
    country: str(body.country),
    originalLanguage: str(body.originalLanguage),
    translator: str(body.translator),
    status: str(body.status) || 'want-to-read',
    recommendationConfidence: str(body.recommendationConfidence),
    ownership: str(body.ownership),
    location: str(body.location),
    audience: str(body.audience),
    readingLevel: str(body.readingLevel),
    writingStyle: str(body.writingStyle),
    oneLineRecommendation: str(body.oneLineRecommendation),
    personalNotes: str(body.personalNotes),
    favouriteCharacter: str(body.favouriteCharacter),
    favouriteQuote: str(body.favouriteQuote),
    favouriteScene: str(body.favouriteScene),
    whyIRecommendIt: str(body.whyIRecommendIt),
    discoverySource: str(body.discoverySource),
    discoveryStatus: str(body.discoveryStatus),
    fictionType: str(body.fictionType),
    primaryGenre: str(body.primaryGenre),
    secondaryGenre: str(body.secondaryGenre),
    womenFocus: str(body.womenFocus),
    instagramHook: str(body.instagramHook),
    instagramPostTopic: str(body.instagramPostTopic),
    bestPostingMonth: str(body.bestPostingMonth),
    genres: strArray(body.genres),
    subgenres: strArray(body.subgenres),
    themes: strArray(body.themes),
    tropes: strArray(body.tropes),
    moods: strArray(body.moods),
    keywords: strArray(body.keywords),
    tags: strArray(body.tags),
    triggerWarnings: strArray(body.triggerWarnings),
    similarBooks: strArray(body.similarBooks),
    seasonalRecommendation: strArray(body.seasonalRecommendation),
    collections: strArray(body.collections),
    awards: strArray(body.awards),
  };

  // Keep genres[] in sync with primary/secondary when provided.
  const primary = fields.primaryGenre as string;
  const secondary = fields.secondaryGenre as string;
  if (primary || secondary) {
    const synced = [primary, secondary].filter(Boolean);
    const existing = fields.genres as string[];
    fields.genres = synced.length ? synced : existing;
  }

  const author = fields.author as string;
  fields.authorSlug = author ? librarySlugify(author) : '';

  const boolKeys = [
    'inSeries',
    'standalone',
    'owned',
    'femaleAuthor',
    'femaleProtagonist',
  ] as const;
  for (const key of boolKeys) {
    const v = body[key];
    if (v === true || v === 'true') fields[key] = true;
    else if (v === false || v === 'false') fields[key] = false;
  }

  // Excel free-text signal columns (not Yes/No-only in the editorial sheet).
  for (const key of [
    'wishlist',
    'bestseller',
    'adaptation',
    'bookTokPopular',
    'bookstagramPopular',
  ] as const) {
    if (body[key] !== undefined && body[key] !== null) fields[key] = str(body[key]);
  }

  // Sync ownership from owned / wishlist Yes.
  if (!fields.ownership) {
    if (fields.owned === true) fields.ownership = 'owned';
    else if (String(fields.wishlist || '').toLowerCase() === 'yes') fields.ownership = 'wishlist';
  }

  const pages = numOrUndef(body.pages);
  if (pages !== undefined) fields.pages = pages;
  const rating = numOrUndef(body.rating);
  if (rating !== undefined) fields.rating = rating;
  else if (body.rating === null || body.rating === '') fields.rating = undefined;
  const seriesNumber = numOrUndef(body.seriesNumber);
  if (seriesNumber !== undefined) fields.seriesNumber = seriesNumber;
  const rereadCount = numOrUndef(body.rereadCount);
  fields.rereadCount = rereadCount ?? 0;

  const publicationDate = dateOrUndef(body.publicationDate);
  if (publicationDate) fields.publicationDate = publicationDate;
  const originalPublicationDate = dateOrUndef(body.originalPublicationDate);
  if (originalPublicationDate) fields.originalPublicationDate = originalPublicationDate;
  const startedDate = dateOrUndef(body.startedDate);
  if (startedDate) fields.startedDate = startedDate;
  const finishedDate = dateOrUndef(body.finishedDate);
  if (finishedDate) fields.finishedDate = finishedDate;

  if (Array.isArray(body.copies)) {
    fields.copies = (body.copies as unknown[])
      .map((c) => {
        const copy = c as Record<string, unknown>;
        const format = str(copy.format);
        const location = str(copy.location);
        const notes = str(copy.notes);
        if (!format && !location && !notes) return null;
        return { format, location, notes };
      })
      .filter(Boolean);
  }

  if (body.contentLinks && typeof body.contentLinks === 'object') {
    const cl = body.contentLinks as Record<string, unknown>;
    fields.contentLinks = {
      goodreads: str(cl.goodreads),
      amazon: str(cl.amazon),
      blog: str(cl.blog),
      instagram: str(cl.instagram),
      linkedin: str(cl.linkedin),
      youtube: str(cl.youtube),
      newsletter: str(cl.newsletter),
    };
  }

  if (Array.isArray(body.recommendationHistory)) {
    fields.recommendationHistory = (body.recommendationHistory as unknown[])
      .map((e) => {
        const entry = e as Record<string, unknown>;
        const date = dateOrUndef(entry.date);
        if (!date) return null;
        return {
          date,
          channel: str(entry.channel),
          note: str(entry.note),
          contentUrl: str(entry.contentUrl),
        };
      })
      .filter(Boolean);
  }

  return fields as Partial<ILibraryBook>;
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = librarySlugify(base) || `book-${Date.now()}`;
  let slug = root;
  let n = 2;
  // eslint-disable-next-line no-await-in-loop
  while (await LibraryBook.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    slug = `${root}-${n++}`;
  }
  return slug;
}

/** GET /api/library/books — list with filters, pagination, and optional facets. */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(str(req.query.page) || '1', 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(str(req.query.limit) || '24', 10) || 24));
    const sort = str(req.query.sort) || 'recent';

    const filter = await buildLibraryBookFilter({
      q: str(req.query.q),
      status: str(req.query.status),
      author: str(req.query.author),
      series: str(req.query.series),
      ownership: str(req.query.ownership),
      format: str(req.query.format),
      location: str(req.query.location),
      discoveryStatus: str(req.query.discoveryStatus),
      discoverySource: str(req.query.discoverySource),
      recommendationConfidence: str(req.query.recommendationConfidence),
      genre: str(req.query.genre),
      theme: str(req.query.theme),
      mood: str(req.query.mood),
      trope: str(req.query.trope),
      tag: str(req.query.tag),
      collection: str(req.query.collection),
      authorCountry: str(req.query.authorCountry),
      minRating: numOrUndef(req.query.minRating),
      minPages: numOrUndef(req.query.minPages),
      maxPages: numOrUndef(req.query.maxPages),
      owned: ['1', 'true', 'yes'].includes(str(req.query.owned).toLowerCase()),
    });

    const sortSpec = sortSpecFor(sort);

    const [items, total] = await Promise.all([
      LibraryBook.find(filter)
        .sort(sortSpec)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      LibraryBook.countDocuments(filter),
    ]);

    const result: Record<string, unknown> = {
      books: items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };

    if (str(req.query.facets) === 'true') {
      result.facets = await getLibraryFacets();
    }

    res.status(200).json(result);
  } catch (err) {
    console.error('GET /api/library/books', err);
    res.status(500).json({ error: 'Failed to load books' });
  }
});

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

function mergeStringLists(existing: string[] | undefined, incoming: string[]): string[] {
  const out = [...(existing ?? [])];
  const seen = new Set(out.map((v) => v.toLowerCase()));
  for (const v of incoming) {
    const t = v.trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    out.push(t);
    seen.add(key);
  }
  return out;
}

/**
 * POST /api/library/books/enrich/suggest
 * Body: { ids: string[] } — selection-based, max BOOK_ENRICH_MAX.
 * Returns rich AI suggestions for review (never auto-writes).
 */
router.post('/enrich/suggest', async (req: Request, res: Response): Promise<void> => {
  if (!aiEnabled()) {
    res.status(400).json({ error: 'No AI provider configured. Add an API key to enable AI enrichment.' });
    return;
  }
  const body = (req.body ?? {}) as Record<string, unknown>;
  const ids = Array.isArray(body.ids) ? body.ids.map((x) => String(x)).filter(Boolean) : [];
  if (ids.length === 0) {
    res.status(400).json({ error: 'Select at least one book on this page.' });
    return;
  }

  try {
    const limitedIds = ids.slice(0, BOOK_ENRICH_MAX);
    const docs = await LibraryBook.find({ _id: { $in: limitedIds } })
      .select('title author description personalNotes genres tags series publisher pages')
      .lean();
    if (docs.length === 0) {
      res.status(200).json({ suggestions: [], provider: '', errors: [], message: 'No books found.' });
      return;
    }

    // Preserve selection order.
    const byId = new Map(docs.map((d) => [String(d._id), d]));
    const ordered = limitedIds.map((id) => byId.get(id)).filter(Boolean) as typeof docs;

    const result = await suggestBooksEnrichment(
      ordered.map((d) => ({
        id: String(d._id),
        title: d.title,
        author: d.author,
        description: d.description,
        personalNotes: d.personalNotes,
        genres: d.genres,
        tags: d.tags,
        series: d.series,
        publisher: d.publisher,
        pages: d.pages,
      }))
    );

    if (result.suggestions.length === 0 && !result.provider) {
      res.status(502).json({ error: `AI enrichment failed — ${errorSummary(result.errors)}` });
      return;
    }

    res.status(200).json({
      suggestions: result.suggestions,
      provider: result.provider,
      errors: result.errors,
      processed: ordered.length,
      remaining: Math.max(0, ids.length - ordered.length),
      maxPerRequest: BOOK_ENRICH_MAX,
    });
  } catch (err) {
    console.error('POST /api/library/books/enrich/suggest', err);
    res.status(500).json({ error: 'Failed to suggest book enrichment' });
  }
});

/**
 * POST /api/library/books/enrich/apply
 * Body: { updates: [{ id, genres?, themes?, ... }] }
 * Merges array fields; fills empty scalar fields; pages only if currently unset.
 */
router.post('/enrich/apply', async (req: Request, res: Response): Promise<void> => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const updates = Array.isArray(body.updates) ? body.updates : [];
  if (updates.length === 0) {
    res.status(400).json({ error: 'No updates provided' });
    return;
  }

  const arrayKeys = [
    'genres',
    'subgenres',
    'themes',
    'moods',
    'tropes',
    'tags',
    'keywords',
    'seasonalRecommendation',
    'similarBooks',
    'triggerWarnings',
  ] as const;
  const scalarKeys = [
    'audience',
    'readingLevel',
    'writingStyle',
    'series',
    'publisher',
    'country',
    'originalLanguage',
    'description',
    'oneLineRecommendation',
  ] as const;

  try {
    let updated = 0;
    for (const u of updates) {
      const row = u as Record<string, unknown>;
      const id = str(row.id);
      if (!id) continue;

      // eslint-disable-next-line no-await-in-loop
      const doc = await LibraryBook.findById(id);
      if (!doc) continue;

      for (const key of arrayKeys) {
        const incoming = strArray(row[key]);
        if (incoming.length === 0) continue;
        (doc as unknown as Record<string, unknown>)[key] = mergeStringLists(
          (doc as unknown as Record<string, string[]>)[key],
          incoming
        );
      }

      for (const key of scalarKeys) {
        const incoming = str(row[key]);
        if (!incoming) continue;
        const current = str((doc as unknown as Record<string, unknown>)[key]);
        if (!current) (doc as unknown as Record<string, unknown>)[key] = incoming;
      }

      const pages = numOrUndef(row.pages);
      if (pages !== undefined && (doc.pages == null || doc.pages <= 0)) {
        doc.pages = pages;
      }

      // eslint-disable-next-line no-await-in-loop
      await doc.save();
      // eslint-disable-next-line no-await-in-loop
      await syncTaxonomyFromBook(doc.toObject() as unknown as Record<string, unknown>);
      updated++;
    }
    res.status(200).json({ updated });
  } catch (err) {
    console.error('POST /api/library/books/enrich/apply', err);
    res.status(500).json({ error: 'Failed to apply book enrichment' });
  }
});

/**
 * POST /api/library/books/bulk-update
 * Body: {
 *   ids: string[],
 *   mode?: 'add' | 'replace',  // list fields; default 'add' (merge unique)
 *   genres?, subgenres?, themes?, tropes?, moods?, tags?, keywords?,
 *   seasonalRecommendation?, collections?,
 *   status?, ownership?, location?, recommendationConfidence?
 * }
 * Empty list fields are ignored. Scalar fields only applied when non-empty.
 */
router.post('/bulk-update', async (req: Request, res: Response): Promise<void> => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const ids = Array.isArray(body.ids)
    ? [...new Set(body.ids.map((x) => String(x ?? '').trim()).filter(Boolean))]
    : [];
  if (ids.length === 0) {
    res.status(400).json({ error: 'Select at least one book' });
    return;
  }
  if (ids.length > 200) {
    res.status(400).json({ error: 'Bulk update is limited to 200 books at a time' });
    return;
  }

  const mode = str(body.mode) === 'replace' ? 'replace' : 'add';
  const listKeys = [
    'genres',
    'subgenres',
    'themes',
    'tropes',
    'moods',
    'tags',
    'keywords',
    'seasonalRecommendation',
    'collections',
  ] as const;

  const lists: Partial<Record<(typeof listKeys)[number], string[]>> = {};
  let hasListChange = false;
  for (const key of listKeys) {
    const vals = strArray(body[key]);
    if (vals.length === 0) continue;
    lists[key] = vals;
    hasListChange = true;
  }

  const status = str(body.status);
  const ownership = str(body.ownership);
  const location = str(body.location);
  const recommendationConfidence = str(body.recommendationConfidence);
  const hasScalar =
    Boolean(status) || Boolean(ownership) || Boolean(location) || Boolean(recommendationConfidence);

  if (!hasListChange && !hasScalar) {
    res.status(400).json({
      error: 'Provide at least one field to update (tags, tropes, moods, genres, status, …)',
    });
    return;
  }

  try {
    let updated = 0;
    const failed: { id: string; reason: string }[] = [];

    for (const id of ids) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const doc = await LibraryBook.findById(id);
        if (!doc) {
          failed.push({ id, reason: 'not found' });
          continue;
        }

        for (const key of listKeys) {
          const incoming = lists[key];
          if (!incoming?.length) continue;
          const current = ((doc as unknown as Record<string, string[]>)[key] ?? []) as string[];
          (doc as unknown as Record<string, unknown>)[key] =
            mode === 'replace' ? [...incoming] : mergeStringLists(current, incoming);
        }

        if (status) doc.status = status as ILibraryBook['status'];
        if (ownership) doc.ownership = ownership as ILibraryBook['ownership'];
        if (location) doc.location = location;
        if (recommendationConfidence) {
          doc.recommendationConfidence =
            recommendationConfidence as ILibraryBook['recommendationConfidence'];
        }

        // eslint-disable-next-line no-await-in-loop
        await doc.save();
        // eslint-disable-next-line no-await-in-loop
        await syncTaxonomyFromBook(doc.toObject() as unknown as Record<string, unknown>);
        updated++;
      } catch (rowErr) {
        failed.push({
          id,
          reason: rowErr instanceof Error ? rowErr.message : 'update failed',
        });
      }
    }

    res.status(200).json({ updated, failed, mode, total: ids.length });
  } catch (err) {
    console.error('POST /api/library/books/bulk-update', err);
    res.status(500).json({ error: 'Failed to bulk-update books' });
  }
});

/** GET /api/library/books/duplicates — groups of likely duplicate books. */
router.get('/duplicates', async (_req: Request, res: Response): Promise<void> => {
  try {
    const groups = await findDuplicateBookGroups();
    res.status(200).json({ groups, totalGroups: groups.length });
  } catch (err) {
    console.error('GET /api/library/books/duplicates', err);
    res.status(500).json({ error: 'Failed to find duplicates' });
  }
});

/**
 * POST /api/library/books/merge
 * Body: { keepId, dropId } — merge drop into keep, then delete drop.
 */
router.post('/merge', async (req: Request, res: Response): Promise<void> => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const keepId = str(body.keepId);
  const dropId = str(body.dropId);
  if (!keepId || !dropId) {
    res.status(400).json({ error: 'keepId and dropId are required' });
    return;
  }
  try {
    const { book } = await mergeLibraryBooks(keepId, dropId);
    await syncTaxonomyFromBook(book.toObject() as unknown as Record<string, unknown>);
    res.status(200).json({ book });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Merge failed';
    const status = /not found/i.test(msg) ? 404 : /itself/i.test(msg) ? 400 : 500;
    if (status === 500) console.error('POST /api/library/books/merge', err);
    res.status(status).json({ error: msg });
  }
});

/**
 * POST /api/library/books/:id/enrich/suggest
 * Uses AI to suggest rich classification + metadata for one book.
 * Returns suggestions only — the admin reviews and saves via the normal update.
 */
router.post('/:id/enrich/suggest', async (req: Request, res: Response): Promise<void> => {
  if (!aiEnabled()) {
    res.status(400).json({ error: 'No AI provider configured. Add an API key to enable AI enrichment.' });
    return;
  }
  try {
    const doc = await LibraryBook.findById(req.params.id)
      .select('title author description personalNotes genres tags series publisher pages')
      .lean();
    if (!doc) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }
    const result = await suggestBookClassification({
      title: doc.title,
      author: doc.author,
      description: doc.description,
      personalNotes: doc.personalNotes,
      genres: doc.genres,
      tags: doc.tags,
      series: doc.series,
      publisher: doc.publisher,
      pages: doc.pages,
    });
    if (!('suggestion' in result)) {
      const detail = result.errors.map((e) => `${e.provider}: ${e.message}`).join(' · ') || 'no data';
      res.status(502).json({ error: `AI suggestion failed — ${detail}` });
      return;
    }
    res.status(200).json({ suggestion: result.suggestion, provider: result.provider });
  } catch (err) {
    console.error('POST /api/library/books/:id/enrich/suggest', err);
    res.status(500).json({ error: 'Failed to suggest classification' });
  }
});

/** GET /api/library/books/:id */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const doc = await LibraryBook.findById(req.params.id).lean();
    if (!doc) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }
    res.status(200).json({ book: doc });
  } catch (err) {
    console.error('GET /api/library/books/:id', err);
    res.status(500).json({ error: 'Failed to load book' });
  }
});

/** POST /api/library/books */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const title = str(body.title);
  const author = str(body.author);
  if (!title) {
    res.status(400).json({ error: 'Title is required' });
    return;
  }
  if (!author) {
    res.status(400).json({ error: 'Author is required' });
    return;
  }
  try {
    const fields = bookFieldsFromBody(body);
    const slug = await uniqueSlug(str(body.slug) || `${title}-${author}`);
    const doc = await LibraryBook.create({ ...fields, title, author, slug });
    await syncTaxonomyFromBook(doc.toObject() as unknown as Record<string, unknown>);
    res.status(201).json({ book: doc });
  } catch (err) {
    console.error('POST /api/library/books', err);
    res.status(500).json({ error: 'Failed to create book' });
  }
});

/** PUT /api/library/books/:id */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  try {
    const doc = await LibraryBook.findById(req.params.id);
    if (!doc) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }
    const fields = bookFieldsFromBody(body);
    Object.assign(doc, fields);
    const title = str(body.title);
    if (title) doc.title = title;
    const newSlug = str(body.slug);
    if (newSlug && librarySlugify(newSlug) !== doc.slug) {
      doc.slug = await uniqueSlug(newSlug, String(doc._id));
    }
    await doc.save();
    await syncTaxonomyFromBook(doc.toObject() as unknown as Record<string, unknown>);
    res.status(200).json({ book: doc });
  } catch (err) {
    console.error('PUT /api/library/books/:id', err);
    res.status(500).json({ error: 'Failed to update book' });
  }
});

/** DELETE /api/library/books/:id */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const doc = await LibraryBook.findByIdAndDelete(req.params.id);
    if (!doc) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }
    res.status(200).json({ message: 'Book deleted' });
  } catch (err) {
    console.error('DELETE /api/library/books/:id', err);
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

export default router;
