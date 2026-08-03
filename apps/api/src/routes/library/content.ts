import { Router, Request, Response } from 'express';
import { LibraryBook } from '../../models/LibraryBook.js';
import { LibraryTaxonomy } from '../../models/LibraryTaxonomy.js';
import { requireAuth } from '../../middlewares/auth.js';
import { aiEnabled } from '../../services/aiClient.js';
import {
  generateListHooks,
  generateSingleBookHooks,
  LIST_HOOK_MAX,
  STYLE_PATTERN_MAX,
} from '../../services/aiContent.js';
import {
  buildLibraryBookFilter,
  getLibraryFacets,
  sortSpecFor,
  type LibraryBookQueryParams,
} from '../../services/libraryBookFilter.js';
import { parseLibraryQuery } from '../../services/libraryQueryParser.js';
import { aiParseQuery } from '../../services/aiQueryParser.js';
import {
  gatherFitCandidates,
  rankBooksByFit,
} from '../../services/aiBookFit.js';

const router = Router();
router.use(requireAuth);

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

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

async function loadStylePatterns(body: Record<string, unknown>): Promise<string[]> {
  if (Array.isArray(body.stylePatterns)) {
    return body.stylePatterns
      .map((x) => String(x ?? '').trim())
      .filter(Boolean)
      .slice(0, STYLE_PATTERN_MAX);
  }
  if (body.useWinningHooks === false) return [];

  const items = await LibraryTaxonomy.find({ type: 'hook-pattern' })
    .select('name')
    .sort({ updatedAt: -1 })
    .limit(STYLE_PATTERN_MAX)
    .lean();
  return items.map((i) => i.name).filter(Boolean);
}

async function resolveQueryParams(q: string): Promise<{
  params: LibraryBookQueryParams;
  summary: string;
  engine: 'ai' | 'heuristic';
  queryProvider: string;
}> {
  const facets = await getLibraryFacets();
  // Heuristic first — saves an AI call when tags/genres/authors already match.
  const parsed = parseLibraryQuery(q, facets);
  const usefulKeys = Object.keys(parsed.params).filter((k) => k !== 'q');
  if (parsed.chips.length > 0 || usefulKeys.length > 0) {
    return {
      params: parsed.params,
      summary: q,
      engine: 'heuristic',
      queryProvider: '',
    };
  }

  const ai = await aiParseQuery(q, facets);
  if (ai && Object.keys(ai.params).length > 0) {
    return {
      params: ai.params,
      summary: ai.summary || q,
      engine: 'ai',
      queryProvider: ai.provider,
    };
  }
  return {
    params: parsed.params,
    summary: q,
    engine: 'heuristic',
    queryProvider: '',
  };
}

/**
 * POST /api/library/content/ask-hooks
 * Natural-language ask → matching books + one hook each.
 */
router.post('/ask-hooks', async (req: Request, res: Response): Promise<void> => {
  if (!aiEnabled()) {
    res.status(400).json({ error: 'No AI provider configured. Add an API key to enable hooks.' });
    return;
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const q = str(body.q);
  if (!q) {
    res.status(400).json({
      error: 'Ask for something — e.g. “Independence Day books” or “partition stories”.',
    });
    return;
  }

  const limit = Math.min(
    LIST_HOOK_MAX,
    Math.max(1, parseInt(String(body.limit ?? LIST_HOOK_MAX), 10) || LIST_HOOK_MAX)
  );

  try {
    const { params, summary, engine, queryProvider } = await resolveQueryParams(q);
    // Planning defaults — incomplete taxonomy should not block the shortlist.
    if (body.neverRecommended === true || body.neverRecommended === 'true') {
      params.neverRecommended = true;
    }
    if (typeof body.status === 'string' && body.status.trim()) {
      params.status = body.status.trim();
    }

    const useAiFit = body.aiFit !== false;
    let docs: {
      _id: unknown;
      title: string;
      author?: string;
      oneLineRecommendation?: string;
      genres?: string[];
      themes?: string[];
      moods?: string[];
      tags?: string[];
      pages?: number;
      rating?: number;
    }[] = [];
    let fitProvider = '';
    let fitEngine: 'ai-fit' | 'filter' = 'filter';
    const fitReasons: Record<string, string> = {};

    if (useAiFit) {
      const { candidates, docs: pool } = await gatherFitCandidates(params);
      const ranked = await rankBooksByFit(q, candidates, limit);
      fitProvider = ranked.provider;
      if (ranked.picks.length > 0) {
        fitEngine = 'ai-fit';
        const byId = new Map(pool.map((d) => [String(d._id), d]));
        docs = ranked.picks
          .map((p) => {
            fitReasons[p.id] = p.reason;
            return byId.get(p.id);
          })
          .filter(Boolean) as typeof docs;
      }
    }

    if (docs.length === 0) {
      const filter = await buildLibraryBookFilter(params);
      docs = await LibraryBook.find(filter)
        .sort(sortSpecFor('rating'))
        .limit(limit)
        .select(
          'title author oneLineRecommendation genres themes moods tags pages rating coverImage status'
        )
        .lean();
      fitEngine = 'filter';
    }

    if (docs.length === 0) {
      res.status(200).json({
        mode: 'ask',
        query: q,
        summary,
        engine: fitEngine === 'ai-fit' ? 'ai' : engine,
        queryProvider: fitProvider || queryProvider,
        fitEngine,
        total: 0,
        hooks: [],
        provider: '',
        message:
          'No books fit that ask yet. Try broader wording, or add a one-line pitch on a few books so AI has something to judge.',
      });
      return;
    }

    const stylePatterns = await loadStylePatterns(body);
    const result = await generateListHooks(
      docs.map((d) => ({
        id: String(d._id),
        title: d.title,
        author: d.author,
        oneLineRecommendation: d.oneLineRecommendation,
        genres: d.genres,
        themes: d.themes,
        moods: d.moods,
        tags: d.tags,
        pages: d.pages,
        rating: d.rating,
      })),
      { occasion: q, stylePatterns }
    );

    if (result.hooks.length === 0 && !result.provider) {
      res.status(502).json({ error: `Hook generation failed — ${errorSummary(result.errors)}` });
      return;
    }

    res.status(200).json({
      mode: 'ask',
      query: q,
      summary,
      engine: fitEngine === 'ai-fit' ? 'ai' : engine,
      queryProvider: fitProvider || queryProvider,
      fitEngine,
      fitReasons,
      params,
      total: docs.length,
      returned: result.hooks.length,
      hooks: result.hooks,
      provider: result.provider,
      errors: result.errors,
      stylePatternsUsed: stylePatterns.length,
      maxPerRequest: LIST_HOOK_MAX,
    });
  } catch (err) {
    console.error('POST /api/library/content/ask-hooks', err);
    res.status(500).json({ error: 'Failed to ask + generate hooks' });
  }
});

/**
 * POST /api/library/content/hooks
 * Body: { ids[] } list mode, or { bookId } single mode.
 */
router.post('/hooks', async (req: Request, res: Response): Promise<void> => {
  if (!aiEnabled()) {
    res.status(400).json({ error: 'No AI provider configured. Add an API key to enable hooks.' });
    return;
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const occasion = str(body.occasion) || undefined;
  const ids = Array.isArray(body.ids) ? body.ids.map((x) => String(x)).filter(Boolean) : [];
  const bookId = str(body.bookId);

  try {
    const stylePatterns = await loadStylePatterns(body);

    if (bookId && ids.length === 0) {
      const doc = await LibraryBook.findById(bookId)
        .select('title author oneLineRecommendation genres themes moods tags pages rating')
        .lean();
      if (!doc) {
        res.status(404).json({ error: 'Book not found' });
        return;
      }
      const purposeRaw = str(body.purpose);
      const purpose =
        purposeRaw === 'review' || purposeRaw === 'list' || purposeRaw === 'recommendation'
          ? purposeRaw
          : 'recommendation';

      const result = await generateSingleBookHooks(
        {
          title: doc.title,
          author: doc.author,
          oneLineRecommendation: doc.oneLineRecommendation,
          genres: doc.genres,
          themes: doc.themes,
          moods: doc.moods,
          tags: doc.tags,
          pages: doc.pages,
          rating: doc.rating,
        },
        { occasion, purpose, stylePatterns }
      );

      if (result.hooks.length === 0) {
        res.status(502).json({ error: `Hook generation failed — ${errorSummary(result.errors)}` });
        return;
      }

      res.status(200).json({
        mode: 'single',
        book: { _id: String(doc._id), title: doc.title, author: doc.author },
        hooks: result.hooks,
        provider: result.provider,
        errors: result.errors,
        stylePatternsUsed: stylePatterns.length,
      });
      return;
    }

    if (ids.length === 0) {
      res.status(400).json({ error: 'Pass ids[] for a list, or bookId for a single book.' });
      return;
    }

    const limited = ids.slice(0, LIST_HOOK_MAX);
    const docs = await LibraryBook.find({ _id: { $in: limited } })
      .select('title author oneLineRecommendation genres themes moods tags pages rating')
      .lean();
    const byId = new Map(docs.map((d) => [String(d._id), d]));
    const ordered = limited.map((id) => byId.get(id)).filter(Boolean) as typeof docs;

    if (ordered.length === 0) {
      res.status(200).json({ mode: 'list', hooks: [], provider: '', message: 'No books found.' });
      return;
    }

    const result = await generateListHooks(
      ordered.map((d) => ({
        id: String(d._id),
        title: d.title,
        author: d.author,
        oneLineRecommendation: d.oneLineRecommendation,
        genres: d.genres,
        themes: d.themes,
        moods: d.moods,
        tags: d.tags,
        pages: d.pages,
        rating: d.rating,
      })),
      { occasion, stylePatterns }
    );

    if (result.hooks.length === 0 && !result.provider) {
      res.status(502).json({ error: `Hook generation failed — ${errorSummary(result.errors)}` });
      return;
    }

    res.status(200).json({
      mode: 'list',
      hooks: result.hooks,
      provider: result.provider,
      errors: result.errors,
      processed: ordered.length,
      remaining: Math.max(0, ids.length - limited.length),
      maxPerRequest: LIST_HOOK_MAX,
      stylePatternsUsed: stylePatterns.length,
    });
  } catch (err) {
    console.error('POST /api/library/content/hooks', err);
    res.status(500).json({ error: 'Failed to generate hooks' });
  }
});

/**
 * POST /api/library/content/hook-to-books
 * Body: { hookId? | hookText?, limit?, generateHooks?, useWinningHooks? }
 * Reverse of ask-hooks: start from a winning (or pasted) hook → matching library books
 * (+ optional new hooks for each).
 */
router.post('/hook-to-books', async (req: Request, res: Response): Promise<void> => {
  if (!aiEnabled()) {
    res.status(400).json({ error: 'No AI provider configured. Add an API key to enable hooks.' });
    return;
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const hookId = str(body.hookId);
  let hookText = str(body.hookText);
  let sourceId: string | undefined;

  try {
    if (hookId) {
      const item = await LibraryTaxonomy.findById(hookId).select('name type').lean();
      if (!item || item.type !== 'hook-pattern') {
        res.status(404).json({ error: 'Winning hook not found' });
        return;
      }
      hookText = String(item.name || '').trim();
      sourceId = String(item._id);
    }

    if (!hookText) {
      res.status(400).json({
        error: 'Pick a winning hook or paste hook text.',
      });
      return;
    }

    const limit = Math.min(
      LIST_HOOK_MAX,
      Math.max(1, parseInt(String(body.limit ?? LIST_HOOK_MAX), 10) || LIST_HOOK_MAX)
    );
    const generateHooksFlag = body.generateHooks !== false;

    const { params, summary, engine, queryProvider } = await resolveQueryParams(hookText);
    const useAiFit = body.aiFit !== false;
    let docs: {
      _id: unknown;
      title: string;
      author?: string;
      oneLineRecommendation?: string;
      genres?: string[];
      themes?: string[];
      moods?: string[];
      tags?: string[];
      pages?: number;
      rating?: number;
      status?: string;
    }[] = [];
    let fitProvider = '';
    let fitEngine: 'ai-fit' | 'filter' = 'filter';

    if (useAiFit) {
      const { candidates, docs: pool } = await gatherFitCandidates(params);
      const ranked = await rankBooksByFit(hookText, candidates, limit);
      fitProvider = ranked.provider;
      if (ranked.picks.length > 0) {
        fitEngine = 'ai-fit';
        const byId = new Map(pool.map((d) => [String(d._id), d]));
        docs = ranked.picks.map((p) => byId.get(p.id)).filter(Boolean) as typeof docs;
      }
    }

    if (docs.length === 0) {
      const filter = await buildLibraryBookFilter(params);
      docs = await LibraryBook.find(filter)
        .sort(sortSpecFor('rating'))
        .limit(limit)
        .select(
          'title author oneLineRecommendation genres themes moods tags pages rating coverImage status'
        )
        .lean();
      fitEngine = 'filter';
    }

    if (docs.length === 0) {
      res.status(200).json({
        mode: 'hook-match',
        sourceHook: { id: sourceId, text: hookText },
        summary,
        engine: fitEngine === 'ai-fit' ? 'ai' : engine,
        queryProvider: fitProvider || queryProvider,
        fitEngine,
        params,
        total: 0,
        hooks: [],
        books: [],
        provider: '',
        message:
          'No books fit this hook’s vibe yet. Try another winner, or add short pitches so AI can judge incomplete books.',
      });
      return;
    }

    const books = docs.map((d) => ({
      _id: String(d._id),
      title: d.title,
      author: d.author || '',
      genres: d.genres ?? [],
      themes: d.themes ?? [],
      tags: d.tags ?? [],
      rating: d.rating,
      status: d.status,
    }));

    if (!generateHooksFlag) {
      res.status(200).json({
        mode: 'hook-match',
        sourceHook: { id: sourceId, text: hookText },
        summary,
        engine: fitEngine === 'ai-fit' ? 'ai' : engine,
        queryProvider: fitProvider || queryProvider,
        fitEngine,
        params,
        total: books.length,
        returned: books.length,
        books,
        hooks: [],
        provider: '',
        stylePatternsUsed: 0,
        maxPerRequest: LIST_HOOK_MAX,
      });
      return;
    }

    const stylePatterns = await loadStylePatterns(body);
    // Prefer the source hook itself as the lead style reference.
    const styled = [hookText, ...stylePatterns.filter((p) => p !== hookText)].slice(
      0,
      STYLE_PATTERN_MAX
    );

    const result = await generateListHooks(
      docs.map((d) => ({
        id: String(d._id),
        title: d.title,
        author: d.author,
        oneLineRecommendation: d.oneLineRecommendation,
        genres: d.genres,
        themes: d.themes,
        moods: d.moods,
        tags: d.tags,
        pages: d.pages,
        rating: d.rating,
      })),
      { occasion: hookText, stylePatterns: styled }
    );

    if (result.hooks.length === 0 && !result.provider) {
      res.status(502).json({ error: `Hook generation failed — ${errorSummary(result.errors)}` });
      return;
    }

    res.status(200).json({
      mode: 'hook-match',
      sourceHook: { id: sourceId, text: hookText },
      summary,
      engine: fitEngine === 'ai-fit' ? 'ai' : engine,
      queryProvider: fitProvider || queryProvider,
      fitEngine,
      params,
      total: books.length,
      returned: result.hooks.length,
      books,
      hooks: result.hooks,
      provider: result.provider,
      errors: result.errors,
      stylePatternsUsed: styled.length,
      maxPerRequest: LIST_HOOK_MAX,
    });
  } catch (err) {
    console.error('POST /api/library/content/hook-to-books', err);
    res.status(500).json({ error: 'Failed to match books from hook' });
  }
});

export default router;
