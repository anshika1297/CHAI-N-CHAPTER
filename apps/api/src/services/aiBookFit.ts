import { LibraryBook } from '../models/LibraryBook.js';
import { aiJson, AiAttemptError, aiEnabled } from './aiClient.js';
import {
  buildLibraryBookFilter,
  type LibraryBookQueryParams,
} from './libraryBookFilter.js';

/** Max books sent to the model in one fit call (context + cost). */
export const AI_FIT_CANDIDATE_MAX = 48;
/** Hard ceiling for how many picks we ask for. */
export const AI_FIT_PICK_MAX = 12;

export interface FitCandidate {
  id: string;
  title: string;
  author?: string;
  oneLineRecommendation?: string;
  personalNotes?: string;
  whyIRecommendIt?: string;
  description?: string;
  genres?: string[];
  themes?: string[];
  moods?: string[];
  tags?: string[];
  tropes?: string[];
  seasonalRecommendation?: string[];
  pages?: number;
  rating?: number;
  status?: string;
}

export interface FitPick {
  id: string;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface FitRankResult {
  picks: FitPick[];
  provider: string;
  errors: AiAttemptError[];
}

function asStr(v: unknown): string {
  return typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim();
}

function clip(s: string | undefined, n: number): string {
  const t = (s ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return '';
  return t.length <= n ? t : `${t.slice(0, n - 1)}…`;
}

/**
 * Structural / planning filters only — vibe taxonomy is left to the AI judge
 * so incomplete tags don't exclude good books.
 */
export function structuralParamsOnly(params: LibraryBookQueryParams): LibraryBookQueryParams {
  return {
    status: params.status,
    owned: params.owned,
    ownership: params.ownership,
    minRating: params.minRating,
    minPages: params.minPages,
    maxPages: params.maxPages,
    neverRecommended: params.neverRecommended,
    notRecommendedDays: params.notRecommendedDays,
    language: params.language,
    authorCountry: params.authorCountry,
    format: params.format,
    location: params.location,
  };
}

function compactCandidate(b: FitCandidate) {
  return {
    id: b.id,
    title: b.title,
    author: b.author ?? '',
    pitch: clip(b.oneLineRecommendation, 160),
    why: clip(b.whyIRecommendIt, 160),
    notes: clip(b.personalNotes, 120),
    blurb: clip(b.description, 180),
    genres: (b.genres ?? []).slice(0, 4),
    themes: (b.themes ?? []).slice(0, 4),
    moods: (b.moods ?? []).slice(0, 3),
    tags: (b.tags ?? []).slice(0, 5),
    tropes: (b.tropes ?? []).slice(0, 3),
    seasonal: (b.seasonalRecommendation ?? []).slice(0, 3),
    pages: b.pages ?? null,
    rating: b.rating ?? null,
    status: b.status ?? '',
  };
}

const FIT_SELECT =
  'title author oneLineRecommendation personalNotes whyIRecommendIt description ' +
  'genres themes moods tags tropes seasonalRecommendation pages rating status ' +
  'recommendationHistory copies ownership coverImage slug recommendationConfidence country originalLanguage';

/**
 * Broad candidate pool for AI judging:
 * 1) soft/tag matches (when present) so enriched books still surface
 * 2) structural-only shelf (status/pages/owned/etc.) so incomplete books can too
 */
export async function gatherFitCandidates(
  softParams: LibraryBookQueryParams,
  opts?: { max?: number }
): Promise<{ candidates: FitCandidate[]; docs: Record<string, unknown>[] }> {
  const max = Math.min(AI_FIT_CANDIDATE_MAX, Math.max(8, opts?.max ?? AI_FIT_CANDIDATE_MAX));
  const structural = structuralParamsOnly(softParams);
  const byId = new Map<string, Record<string, unknown>>();

  const softFilter = await buildLibraryBookFilter(softParams);
  const softDocs = await LibraryBook.find(softFilter)
    .sort({ rating: -1, title: 1 })
    .limit(max)
    .select(FIT_SELECT)
    .lean();
  for (const d of softDocs) byId.set(String(d._id), d as Record<string, unknown>);

  if (byId.size < max) {
    const structFilter = await buildLibraryBookFilter(structural);
    const structDocs = await LibraryBook.find(structFilter)
      .sort({ rating: -1, finishedDate: -1, title: 1 })
      .limit(max)
      .select(FIT_SELECT)
      .lean();
    for (const d of structDocs) {
      const id = String(d._id);
      if (!byId.has(id)) byId.set(id, d as Record<string, unknown>);
      if (byId.size >= max) break;
    }
  }

  // Prefer candidates that have *some* text signal, but keep sparse ones too.
  const docs = [...byId.values()].sort((a, b) => {
    const score = (x: Record<string, unknown>) => {
      let s = 0;
      if (asStr(x.oneLineRecommendation)) s += 3;
      if (asStr(x.whyIRecommendIt)) s += 2;
      if (asStr(x.description)) s += 2;
      if (asStr(x.personalNotes)) s += 1;
      if (Array.isArray(x.genres) && x.genres.length) s += 1;
      if (Array.isArray(x.tags) && x.tags.length) s += 1;
      s += Number(x.rating ?? 0);
      return s;
    };
    return score(b) - score(a);
  });

  const candidates: FitCandidate[] = docs.map((d) => ({
    id: String(d._id),
    title: asStr(d.title) || 'Untitled',
    author: asStr(d.author),
    oneLineRecommendation: asStr(d.oneLineRecommendation),
    personalNotes: asStr(d.personalNotes),
    whyIRecommendIt: asStr(d.whyIRecommendIt),
    description: asStr(d.description),
    genres: (d.genres as string[]) ?? [],
    themes: (d.themes as string[]) ?? [],
    moods: (d.moods as string[]) ?? [],
    tags: (d.tags as string[]) ?? [],
    tropes: (d.tropes as string[]) ?? [],
    seasonalRecommendation: (d.seasonalRecommendation as string[]) ?? [],
    pages: typeof d.pages === 'number' ? d.pages : undefined,
    rating: typeof d.rating === 'number' ? d.rating : undefined,
    status: asStr(d.status),
  }));

  return { candidates, docs };
}

/**
 * Ask the model which library books fit a brief — even when themes/moods/tags
 * are sparse. Grounds judgment in title/author/pitch/notes/description + any
 * taxonomy that happens to exist.
 */
export async function rankBooksByFit(
  brief: string,
  candidates: FitCandidate[],
  limit = 10
): Promise<FitRankResult> {
  const ask = brief.trim();
  if (!ask) {
    return {
      picks: [],
      provider: '',
      errors: [{ provider: 'none', message: 'empty brief' }],
    };
  }
  if (!aiEnabled()) {
    return {
      picks: [],
      provider: '',
      errors: [{ provider: 'none', message: 'no AI provider configured' }],
    };
  }

  const slice = candidates.slice(0, AI_FIT_CANDIDATE_MAX);
  if (slice.length === 0) {
    return {
      picks: [],
      provider: '',
      errors: [{ provider: 'none', message: 'no candidates' }],
    };
  }

  const pickLimit = Math.min(AI_FIT_PICK_MAX, Math.max(1, limit));
  const payload = slice.map(compactCandidate);

  const prompt = [
    'You help a book blogger (ChaptersAurChai) build a recommendation LIST from their personal library.',
    `Brief / category: ${JSON.stringify(ask)}`,
    '',
    'IMPORTANT REALITY: library metadata is often incomplete. Many good books are missing themes, moods, tags, or seasons.',
    'Judge fit from whatever EXISTS — especially title, author, pitch, why-I-recommend, notes, blurb — plus any genres/tags present.',
    'INCLUDE a book if it reasonably fits the brief even with sparse fields.',
    'EXCLUDE books that clearly do not fit (wrong genre/vibe/topic).',
    'When unsure but plausible, include with confidence "low" or "medium".',
    'Prefer stronger fits first. Do not invent facts that are not in the candidate payload.',
    `Return at most ${pickLimit} books.`,
    'Return ONLY JSON:',
    '{"picks":[{"id":"...","reason":"≤12 words","confidence":"high|medium|low"}]}',
    'Use exact candidate ids. No extra keys.',
    '',
    `Candidates: ${JSON.stringify(payload)}`,
  ].join('\n');

  const result = await aiJson<{ picks?: unknown }>(prompt, {
    temperature: 0.35,
    timeoutMs: 35000,
  });

  if (!result.data || !result.provider) {
    return { picks: [], provider: '', errors: result.errors };
  }

  const allowed = new Set(slice.map((c) => c.id));
  const rows = Array.isArray(result.data.picks) ? result.data.picks : [];
  const picks: FitPick[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const r = row as Record<string, unknown>;
    const id = asStr(r.id);
    if (!id || !allowed.has(id) || seen.has(id)) continue;
    seen.add(id);
    const confRaw = asStr(r.confidence).toLowerCase();
    const confidence: FitPick['confidence'] =
      confRaw === 'high' || confRaw === 'medium' || confRaw === 'low' ? confRaw : 'medium';
    picks.push({
      id,
      reason: asStr(r.reason).slice(0, 120),
      confidence,
    });
    if (picks.length >= pickLimit) break;
  }

  return { picks, provider: result.provider, errors: result.errors };
}
