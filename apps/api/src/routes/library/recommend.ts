import { Router, Request, Response } from 'express';
import { LibraryBook } from '../../models/LibraryBook.js';
import { LibraryTaxonomy } from '../../models/LibraryTaxonomy.js';
import { requireAuth } from '../../middlewares/auth.js';
import { aiEnabled } from '../../services/aiClient.js';
import {
  gatherFitCandidates,
  rankBooksByFit,
} from '../../services/aiBookFit.js';
import { generateListHooks, STYLE_PATTERN_MAX } from '../../services/aiContent.js';
import {
  buildLibraryBookFilter,
  getLibraryFacets,
  type LibraryBookQueryParams,
} from '../../services/libraryBookFilter.js';
import { parseLibraryQuery } from '../../services/libraryQueryParser.js';
import { aiParseQuery } from '../../services/aiQueryParser.js';

const router = Router();
router.use(requireAuth);

const CHANNELS = [
  'instagram',
  'blog',
  'newsletter',
  'linkedin',
  'youtube',
  'threads',
  'book-club',
  'other',
] as const;

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function numOrUndef(v: unknown): number | undefined {
  if (v === '' || v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function lastRecommendedAt(
  history: { date?: Date | string }[] | undefined
): Date | null {
  if (!history?.length) return null;
  let latest: Date | null = null;
  for (const entry of history) {
    if (!entry?.date) continue;
    const d = entry.date instanceof Date ? entry.date : new Date(entry.date);
    if (Number.isNaN(d.getTime())) continue;
    if (!latest || d > latest) latest = d;
  }
  return latest;
}

function daysSince(date: Date | null): number | null {
  if (!date) return null;
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function paramsFromQuery(q: Request['query']): LibraryBookQueryParams {
  const neverRecommended = str(q.neverRecommended) === 'true';
  const notRecommendedDays = numOrUndef(q.notRecommendedDays);
  return {
    q: str(q.q) || undefined,
    status: str(q.status) || undefined,
    author: str(q.author) || undefined,
    ownership: str(q.ownership) || undefined,
    format: str(q.format) || undefined,
    location: str(q.location) || undefined,
    recommendationConfidence: str(q.recommendationConfidence) || undefined,
    genre: str(q.genre) || undefined,
    theme: str(q.theme) || undefined,
    mood: str(q.mood) || undefined,
    trope: str(q.trope) || undefined,
    tag: str(q.tag) || undefined,
    season: str(q.season) || undefined,
    collection: str(q.collection) || undefined,
    language: str(q.language) || undefined,
    authorCountry: str(q.authorCountry) || undefined,
    minRating: numOrUndef(q.minRating),
    minPages: numOrUndef(q.minPages),
    maxPages: numOrUndef(q.maxPages),
    owned: ['1', 'true', 'yes'].includes(str(q.owned).toLowerCase()) || undefined,
    neverRecommended: neverRecommended || undefined,
    notRecommendedDays: neverRecommended ? undefined : notRecommendedDays,
  };
}

function splitTerms(...parts: (string | undefined)[]): string[] {
  const out: string[] = [];
  for (const part of parts) {
    if (!part?.trim()) continue;
    for (const bit of part.split(',')) {
      const t = bit.trim().toLowerCase();
      if (t) out.push(t);
    }
  }
  return out;
}

function fitScore(
  book: {
    title?: string;
    genres: string[];
    themes: string[];
    moods: string[];
    tags: string[];
    seasonalRecommendation: string[];
    collections?: string[];
    oneLineRecommendation?: string;
  },
  terms: string[]
): number {
  if (terms.length === 0) return 0;
  const hay = [
    book.title,
    book.oneLineRecommendation,
    ...book.genres,
    ...book.themes,
    ...book.moods,
    ...book.tags,
    ...book.seasonalRecommendation,
    ...(book.collections ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (hay.includes(term)) score += 3;
    else {
      const token = term.split(/\s+/).find((w) => w.length >= 4);
      if (token && hay.includes(token)) score += 1;
    }
  }
  return score;
}

async function findWithParams(params: LibraryBookQueryParams) {
  const filter = await buildLibraryBookFilter(params);
  return LibraryBook.find(filter)
    .select(
        'title author coverImage slug status rating pages genres themes moods tags ' +
          'seasonalRecommendation collections oneLineRecommendation recommendationConfidence ' +
          'recommendationHistory copies ownership country originalLanguage'
    )
    .lean();
}

/**
 * GET /api/library/recommend
 * Recommendation Builder — filtered shortlist with last-recommended metadata.
 * Query: same filters as books list + neverRecommended / notRecommendedDays + limit.
 * Matching is soft (partial / cross-field). Empty results auto-relax a bit.
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(str(req.query.limit) || '48', 10) || 48));
    const wantFacets = str(req.query.facets) === 'true';
    const params = paramsFromQuery(req.query);
    const relaxed: string[] = [];

    let docs = await findWithParams(params);

    // Empty list? Loosen the strictest content-planning filters first.
    if (docs.length === 0 && params.neverRecommended) {
      docs = await findWithParams({
        ...params,
        neverRecommended: undefined,
        notRecommendedDays: params.notRecommendedDays ?? 90,
      });
      if (docs.length > 0) {
        relaxed.push(
          'No never-recommended matches — showing books not recommended in the last 90 days instead.'
        );
      }
    }
    if (docs.length === 0 && params.status) {
      docs = await findWithParams({
        ...params,
        neverRecommended: undefined,
        status: undefined,
        notRecommendedDays: params.notRecommendedDays ?? 90,
      });
      if (docs.length > 0) {
        relaxed.push('Still empty — dropped reading-status filter.');
      }
    }
    if (docs.length === 0 && (params.owned || params.minRating != null || params.maxPages != null)) {
      docs = await findWithParams({
        ...params,
        neverRecommended: undefined,
        status: undefined,
        owned: undefined,
        minRating: undefined,
        maxPages: undefined,
        notRecommendedDays: undefined,
      });
      if (docs.length > 0) {
        relaxed.push('Still empty — dropped owned / rating / page caps.');
      }
    }

    const terms = splitTerms(
      params.genre,
      params.theme,
      params.mood,
      params.tag,
      params.season,
      params.trope,
      params.collection,
      params.q
    );

    const books = docs
      .map((b) => {
        const last = lastRecommendedAt(b.recommendationHistory);
        const mapped = {
          _id: String(b._id),
          title: b.title,
          author: b.author,
          coverImage: b.coverImage,
          slug: b.slug,
          status: b.status,
          rating: b.rating,
          pages: b.pages,
          genres: b.genres ?? [],
          themes: b.themes ?? [],
          moods: b.moods ?? [],
          tags: b.tags ?? [],
          seasonalRecommendation: b.seasonalRecommendation ?? [],
          collections: (b as { collections?: string[] }).collections ?? [],
          oneLineRecommendation: b.oneLineRecommendation,
          recommendationConfidence: b.recommendationConfidence,
          ownership: b.ownership,
          owned: Array.isArray(b.copies) && b.copies.length > 0,
          country: b.country,
          originalLanguage: b.originalLanguage,
          timesRecommended: b.recommendationHistory?.length ?? 0,
          lastRecommendedAt: last ? last.toISOString() : null,
          daysSinceRecommended: daysSince(last),
          fitScore: 0,
        };
        mapped.fitScore = fitScore(mapped, terms);
        return mapped;
      })
      // Best vibe fit first, then never-rec / gap / rating.
      .sort((a, b) => {
        if (a.fitScore !== b.fitScore) return b.fitScore - a.fitScore;
        const aNever = a.lastRecommendedAt == null ? 1 : 0;
        const bNever = b.lastRecommendedAt == null ? 1 : 0;
        if (aNever !== bNever) return bNever - aNever;
        const aDays = a.daysSinceRecommended ?? 99999;
        const bDays = b.daysSinceRecommended ?? 99999;
        if (aDays !== bDays) return bDays - aDays;
        return (b.rating ?? 0) - (a.rating ?? 0);
      })
      .slice(0, limit);

    const result: Record<string, unknown> = {
      total: docs.length,
      returned: books.length,
      filters: params,
      books,
      channels: CHANNELS,
      relaxed,
    };
    if (wantFacets) result.facets = await getLibraryFacets();

    res.status(200).json(result);
  } catch (err) {
    console.error('GET /api/library/recommend', err);
    res.status(500).json({ error: 'Failed to build recommendation list' });
  }
});

/**
 * POST /api/library/recommend/ask
 * Plain-English brief → AI judges fit across your shelf (incomplete tags OK),
 * returns a shortlist (+ optional hooks).
 */
router.post('/ask', async (req: Request, res: Response): Promise<void> => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const q = str(body.q);
  if (!q) {
    res.status(400).json({
      error: 'Ask for a list — e.g. “Independence Day books” or “rainy-day comfort reads”.',
    });
    return;
  }

  const limit = Math.min(48, Math.max(1, parseInt(String(body.limit ?? '12'), 10) || 12));
  const generateHooksFlag = body.generateHooks === true;
  const useAiFit = body.aiFit !== false;

  try {
    const facets = await getLibraryFacets();
    const parsed = parseLibraryQuery(q, facets);
    let params: LibraryBookQueryParams = { ...parsed.params };
    let summary = q;
    let parseEngine: 'ai' | 'heuristic' = 'heuristic';
    let parseProvider = '';

    const usefulKeys = Object.keys(parsed.params).filter((k) => k !== 'q');
    if (parsed.chips.length === 0 && usefulKeys.length === 0) {
      const ai = await aiParseQuery(q, facets);
      if (ai && Object.keys(ai.params).length > 0) {
        params = { ...ai.params };
        summary = ai.summary || q;
        parseEngine = 'ai';
        parseProvider = ai.provider;
      }
    }

    // Planning toggles from the builder UI win over parser guesses.
    if (typeof body.collection === 'string' && body.collection.trim()) {
      params.collection = body.collection.trim();
    }
    if (typeof body.status === 'string' && body.status.trim()) {
      params.status = body.status.trim();
    } else if (!params.status) {
      params.status = 'read';
    }
    if (body.neverRecommended === true || body.neverRecommended === 'true') {
      params.neverRecommended = true;
    }
    if (body.owned === true || body.owned === 'true' || body.owned === '1') {
      params.owned = true;
    }
    const maxPages = numOrUndef(body.maxPages);
    if (maxPages !== undefined) params.maxPages = maxPages;
    const minRating = numOrUndef(body.minRating);
    if (minRating !== undefined) params.minRating = minRating;
    if (!params.neverRecommended) {
      const days = numOrUndef(body.notRecommendedDays);
      if (days !== undefined) params.notRecommendedDays = days;
    }

    let pickedDocs: Record<string, unknown>[] = [];
    let fitProvider = '';
    let fitEngine: 'ai-fit' | 'filter' = 'filter';
    const fitReasons: Record<string, { reason: string; confidence: string }> = {};

    if (useAiFit && aiEnabled()) {
      const { candidates, docs: pool } = await gatherFitCandidates(params);
      const ranked = await rankBooksByFit(q, candidates, limit);
      fitProvider = ranked.provider;
      if (ranked.picks.length > 0) {
        fitEngine = 'ai-fit';
        const byId = new Map(pool.map((d) => [String(d._id), d]));
        pickedDocs = ranked.picks
          .map((p) => {
            fitReasons[p.id] = { reason: p.reason, confidence: p.confidence };
            return byId.get(p.id);
          })
          .filter(Boolean) as Record<string, unknown>[];
      }
    }

    if (pickedDocs.length === 0) {
      const filter = await buildLibraryBookFilter(params);
      pickedDocs = (await LibraryBook.find(filter)
        .sort({ rating: -1, title: 1 })
        .limit(limit)
        .select(
        'title author coverImage slug status rating pages genres themes moods tags ' +
          'seasonalRecommendation collections oneLineRecommendation recommendationConfidence ' +
          'recommendationHistory copies ownership country originalLanguage'
        )
        .lean()) as Record<string, unknown>[];
      fitEngine = 'filter';
    }

    const books = pickedDocs.map((b) => {
      const hist = b.recommendationHistory as { date?: Date | string }[] | undefined;
      const last = lastRecommendedAt(hist);
      const id = String(b._id);
      return {
        _id: id,
        title: b.title,
        author: b.author,
        coverImage: b.coverImage,
        slug: b.slug,
        status: b.status,
        rating: b.rating,
        pages: b.pages,
        genres: (b.genres as string[]) ?? [],
        themes: (b.themes as string[]) ?? [],
        moods: (b.moods as string[]) ?? [],
        tags: (b.tags as string[]) ?? [],
        seasonalRecommendation: (b.seasonalRecommendation as string[]) ?? [],
        oneLineRecommendation: b.oneLineRecommendation,
        recommendationConfidence: b.recommendationConfidence,
        ownership: b.ownership,
        owned: Array.isArray(b.copies) && (b.copies as unknown[]).length > 0,
        country: b.country,
        originalLanguage: b.originalLanguage,
        timesRecommended: hist?.length ?? 0,
        lastRecommendedAt: last ? last.toISOString() : null,
        daysSinceRecommended: daysSince(last),
        fitReason: fitReasons[id]?.reason,
        fitConfidence: fitReasons[id]?.confidence,
      };
    });

    let hooks: { id: string; title: string; author: string; hook: string }[] = [];
    let hooksProvider = '';
    let stylePatternsUsed = 0;

    if (generateHooksFlag && books.length > 0) {
      if (!aiEnabled()) {
        res.status(400).json({ error: 'No AI provider configured for hooks.' });
        return;
      }
      let stylePatterns: string[] = [];
      if (body.useWinningHooks !== false) {
        const items = await LibraryTaxonomy.find({ type: 'hook-pattern' })
          .select('name')
          .sort({ updatedAt: -1 })
          .limit(STYLE_PATTERN_MAX)
          .lean();
        stylePatterns = items.map((i) => i.name).filter(Boolean);
      }
      stylePatternsUsed = stylePatterns.length;
      const hookResult = await generateListHooks(
        books.map((b) => ({
          id: b._id,
          title: String(b.title ?? ''),
          author: typeof b.author === 'string' ? b.author : '',
          oneLineRecommendation:
            typeof b.oneLineRecommendation === 'string' ? b.oneLineRecommendation : '',
          genres: b.genres,
          themes: b.themes,
          moods: b.moods,
          tags: b.tags,
          pages: typeof b.pages === 'number' ? b.pages : undefined,
          rating: typeof b.rating === 'number' ? b.rating : undefined,
        })),
        { occasion: q, stylePatterns }
      );
      hooks = hookResult.hooks;
      hooksProvider = hookResult.provider;
    }

    res.status(200).json({
      total: books.length,
      returned: books.length,
      filters: params,
      books,
      channels: CHANNELS,
      facets,
      query: q,
      summary,
      parseEngine,
      parseProvider,
      fitEngine,
      fitProvider,
      relaxed:
        fitEngine === 'ai-fit'
          ? [
              'AI judged fit from title/pitch/notes + any tags present — incomplete theme/mood fields are OK.',
            ]
          : [],
      hooks,
      hooksProvider,
      stylePatternsUsed,
    });
  } catch (err) {
    console.error('POST /api/library/recommend/ask', err);
    res.status(500).json({ error: 'Failed to ask + build recommendation list' });
  }
});

/**
 * POST /api/library/recommend/mark
 * Body: { ids: string[], channel?, note?, contentUrl?, date? }
 * Appends a recommendationHistory entry for each selected book.
 */
router.post('/mark', async (req: Request, res: Response): Promise<void> => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const ids = Array.isArray(body.ids) ? body.ids.map((x) => String(x)).filter(Boolean) : [];
  if (ids.length === 0) {
    res.status(400).json({ error: 'Select at least one book' });
    return;
  }

  const channel = str(body.channel) || 'other';
  const note = str(body.note);
  const contentUrl = str(body.contentUrl);
  const dateRaw = str(body.date);
  const date = dateRaw ? new Date(dateRaw) : new Date();
  if (Number.isNaN(date.getTime())) {
    res.status(400).json({ error: 'Invalid date' });
    return;
  }

  const entry = { date, channel, note, contentUrl };

  try {
    const result = await LibraryBook.updateMany(
      { _id: { $in: ids } },
      { $push: { recommendationHistory: entry } }
    );
    res.status(200).json({
      updated: result.modifiedCount,
      entry: {
        date: date.toISOString(),
        channel,
        note,
        contentUrl,
      },
    });
  } catch (err) {
    console.error('POST /api/library/recommend/mark', err);
    res.status(500).json({ error: 'Failed to mark books as recommended' });
  }
});

export default router;
