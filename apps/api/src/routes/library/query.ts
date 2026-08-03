import { Router, Request, Response } from 'express';
import { LibraryBook } from '../../models/LibraryBook.js';
import { requireAuth } from '../../middlewares/auth.js';
import {
  buildLibraryBookFilter,
  getLibraryFacets,
  sortSpecFor,
  LibraryBookQueryParams,
} from '../../services/libraryBookFilter.js';
import { parseLibraryQuery, QueryChip } from '../../services/libraryQueryParser.js';
import { aiEnabled, aiParseQuery } from '../../services/aiQueryParser.js';

const router = Router();
router.use(requireAuth);

const FIELD_LABELS: Record<string, string> = {
  status: 'status',
  author: 'by',
  genre: 'genre',
  theme: 'theme',
  mood: 'mood',
  trope: 'trope',
  tag: 'tag',
  collection: 'collection',
  format: 'format',
  location: 'in',
  authorCountry: 'authors from',
  series: 'series',
  q: 'keywords',
};

/** Build display chips from params (used for the AI path, which has no chips). */
function chipsFromParams(params: LibraryBookQueryParams): QueryChip[] {
  const chips: QueryChip[] = [];
  if (params.maxPages !== undefined) chips.push({ field: 'maxPages', value: String(params.maxPages), label: `≤ ${params.maxPages} pages` });
  if (params.minPages !== undefined) chips.push({ field: 'minPages', value: String(params.minPages), label: `≥ ${params.minPages} pages` });
  if (params.minRating !== undefined) chips.push({ field: 'minRating', value: String(params.minRating), label: `${params.minRating}★ and up` });
  if (params.owned) chips.push({ field: 'owned', value: 'true', label: 'owned' });
  for (const [field, label] of Object.entries(FIELD_LABELS)) {
    const val = (params as Record<string, unknown>)[field];
    if (typeof val !== 'string' || !val.trim()) continue;
    for (const part of val.split(',').map((v) => v.trim()).filter(Boolean)) {
      chips.push({ field, value: part, label: `${label}: ${part}`.replace('by:', 'by').replace('in:', 'in').replace('authors from:', 'authors from') });
    }
  }
  return chips;
}

/**
 * POST /api/library/query
 * Body: { q: string, sort?: string, limit?: number }
 * Interprets a natural-language request (LLM if configured, else heuristic),
 * executes it against the library, and returns results + how it was interpreted.
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const q = typeof body.q === 'string' ? body.q.trim() : '';
  if (!q) {
    res.status(400).json({ error: 'A query is required' });
    return;
  }

  const limit = Math.min(100, Math.max(1, parseInt(String(body.limit ?? '48'), 10) || 48));
  const requestedSort = typeof body.sort === 'string' ? body.sort.trim() : '';

  try {
    const facets = await getLibraryFacets();

    let params: LibraryBookQueryParams;
    let chips: QueryChip[];
    let summary = '';
    let engine: 'ai' | 'heuristic' = 'heuristic';
    let aiProvider = '';
    let suggestedSort: string | undefined;

    // Heuristic first — avoid burning Gemini/Groq when shelves/tags already match.
    const parsed = parseLibraryQuery(q, facets);
    const usefulKeys = Object.keys(parsed.params).filter((k) => k !== 'q');
    if (parsed.chips.length > 0 || usefulKeys.length > 0) {
      params = parsed.params;
      chips = parsed.chips;
      suggestedSort = parsed.sort;
      engine = 'heuristic';
    } else {
      const ai = await aiParseQuery(q, facets);
      if (ai && Object.keys(ai.params).length > 0) {
        params = ai.params;
        summary = ai.summary;
        chips = chipsFromParams(params);
        engine = 'ai';
        aiProvider = ai.provider;
      } else {
        params = parsed.params;
        chips = parsed.chips;
        suggestedSort = parsed.sort;
        engine = 'heuristic';
      }
    }

    const filter = await buildLibraryBookFilter(params);
    const sort = requestedSort || suggestedSort || 'recent';

    const [books, total] = await Promise.all([
      LibraryBook.find(filter).sort(sortSpecFor(sort)).limit(limit).lean(),
      LibraryBook.countDocuments(filter),
    ]);

    res.status(200).json({
      query: q,
      engine,
      aiProvider,
      aiAvailable: aiEnabled(),
      summary,
      chips,
      params,
      total,
      books,
    });
  } catch (err) {
    console.error('POST /api/library/query', err);
    res.status(500).json({ error: 'Failed to run query' });
  }
});

export default router;
