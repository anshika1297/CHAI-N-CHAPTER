import { aiJson, AiAttemptError } from './aiClient.js';

export interface BookHookItem {
  id: string;
  title: string;
  author: string;
  hook: string;
}

const LIST_HOOK_MAX = 10;
const STYLE_PATTERN_MAX = 12;

function asStr(v: unknown): string {
  return typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim();
}

function asArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x ?? '').trim()).filter(Boolean);
  return [];
}

function styleBlock(patterns?: string[]): string {
  const cleaned = (patterns ?? []).map((p) => p.trim()).filter(Boolean).slice(0, STYLE_PATTERN_MAX);
  if (cleaned.length === 0) return '';
  return [
    'STYLE REFERENCES — these hooks performed well for this creator on Instagram.',
    'Match their ENERGY, STRUCTURE, and VOICE (questions, bold claims, emotional pulls, etc.).',
    'Do NOT copy them verbatim. Adapt the pattern to each book.',
    `Winning hooks: ${JSON.stringify(cleaned)}`,
  ].join('\n');
}

/**
 * One strong hook per book for a recommendation list / carousel.
 * Single AI call for the whole batch — cheap on quota.
 */
export async function generateListHooks(
  books: {
    id: string;
    title: string;
    author?: string;
    oneLineRecommendation?: string;
    genres?: string[];
    themes?: string[];
    moods?: string[];
    tags?: string[];
    pages?: number;
    rating?: number;
  }[],
  opts?: { occasion?: string; stylePatterns?: string[] }
): Promise<{ hooks: BookHookItem[]; provider: string; errors: AiAttemptError[] }> {
  const slice = books.slice(0, LIST_HOOK_MAX);
  if (slice.length === 0) {
    return { hooks: [], provider: '', errors: [{ provider: 'none', message: 'no books provided' }] };
  }

  const payload = slice.map((b) => ({
    id: b.id,
    title: b.title,
    author: b.author ?? '',
    pitch: b.oneLineRecommendation ?? '',
    genres: (b.genres ?? []).slice(0, 3),
    themes: (b.themes ?? []).slice(0, 4),
    moods: (b.moods ?? []).slice(0, 3),
    tags: (b.tags ?? []).slice(0, 4),
    pages: b.pages ?? null,
    rating: b.rating ?? null,
  }));

  const occasion = opts?.occasion?.trim();
  const prompt = [
    'You write TOP-NOTCH hooks for a book blogger (ChaptersAurChai).',
    'For EACH book, write ONE irresistible hook line (max ~20 words).',
    'Hooks sell curiosity — not plot spoilers, not bland blurbs.',
    'Vary rhythm across the list so a carousel does not sound samey.',
    'CRITICAL FIT RULES:',
    '- Ground every hook in THAT book’s title/pitch/genres/themes/moods/tags.',
    '- Do NOT invent a vibe the metadata does not support.',
    '- Do NOT recycle the same emotional claim across unrelated books.',
    occasion
      ? [
          `Angle / occasion (MUST fit): ${JSON.stringify(occasion)}.`,
          'Every hook should clearly serve this angle (wording or implication).',
          'If a book is a weak fit for the angle, write a honest soft-sell hook — do not force a fake connection.',
        ].join('\n')
      : 'No specific occasion — make each hook stand alone from the book’s real vibe.',
    styleBlock(opts?.stylePatterns),
    occasion
      ? 'Style references are for VOICE only — never let them override the occasion or the book’s real vibe.'
      : '',
    'Return ONLY JSON: {"hooks":[{"id":"...","hook":"..."}]}',
    'Use the exact id given for each book. No extra keys.',
    '',
    `Books: ${JSON.stringify(payload)}`,
  ]
    .filter(Boolean)
    .join('\n');

  const result = await aiJson<{ hooks?: unknown }>(prompt, {
    temperature: 0.65,
    timeoutMs: 30000,
  });

  if (!result.data || !result.provider) {
    return { hooks: [], provider: '', errors: result.errors };
  }

  const rows = Array.isArray(result.data.hooks) ? result.data.hooks : [];
  const byId = new Map<string, string>();
  for (const row of rows) {
    const r = row as Record<string, unknown>;
    const id = asStr(r.id);
    const hook = asStr(r.hook);
    if (id && hook) byId.set(id, hook);
  }

  const hooks: BookHookItem[] = slice.map((b) => ({
    id: b.id,
    title: b.title,
    author: b.author ?? '',
    hook: byId.get(b.id) || b.oneLineRecommendation || '',
  }));

  return { hooks, provider: result.provider, errors: result.errors };
}

/**
 * A few alternate hooks for a single book review / recommendation post.
 * Lightweight — replaces full multi-channel drafts.
 */
export async function generateSingleBookHooks(
  book: {
    title: string;
    author?: string;
    oneLineRecommendation?: string;
    genres?: string[];
    themes?: string[];
    moods?: string[];
    tags?: string[];
    pages?: number;
    rating?: number;
  },
  opts?: {
    occasion?: string;
    purpose?: 'review' | 'recommendation' | 'list';
    stylePatterns?: string[];
  }
): Promise<{ hooks: string[]; provider: string; errors: AiAttemptError[] }> {
  const purpose = opts?.purpose ?? 'recommendation';
  const occasion = opts?.occasion?.trim();
  const prompt = [
    'You write TOP-NOTCH hooks for ChaptersAurChai (book blog / Instagram).',
    `Purpose: ${purpose} post about ONE book.`,
    'Return ONLY JSON: {"hooks":["...","..."]} — exactly 5 hooks.',
    'Each hook: max ~20 words, spoiler-light, curiosity-first, distinct angle.',
    'Mix styles: emotional pull, question, bold claim, sensory, "who it\'s for".',
    'CRITICAL: every hook must fit THIS book’s real pitch/genres/themes/moods — no invented vibes.',
    occasion
      ? `Occasion / angle (MUST inform all 5 hooks): ${JSON.stringify(occasion)}.`
      : '',
    styleBlock(opts?.stylePatterns),
    occasion
      ? 'Style references are for VOICE only — do not override the occasion or the book’s vibe.'
      : '',
    '',
    `Title: ${JSON.stringify(book.title)}`,
    `Author: ${JSON.stringify(book.author ?? '')}`,
    `Pitch: ${JSON.stringify(book.oneLineRecommendation ?? '')}`,
    `Genres: ${JSON.stringify(book.genres ?? [])}`,
    `Themes: ${JSON.stringify((book.themes ?? []).slice(0, 5))}`,
    `Moods: ${JSON.stringify(book.moods ?? [])}`,
    `Tags: ${JSON.stringify((book.tags ?? []).slice(0, 5))}`,
    `Pages/rating: ${JSON.stringify({ pages: book.pages ?? null, rating: book.rating ?? null })}`,
  ]
    .filter(Boolean)
    .join('\n');

  const result = await aiJson<{ hooks?: unknown }>(prompt, {
    temperature: 0.7,
    timeoutMs: 25000,
  });

  if (!result.data || !result.provider) {
    return { hooks: [], provider: '', errors: result.errors };
  }

  return {
    hooks: asArray(result.data.hooks).slice(0, 5),
    provider: result.provider,
    errors: result.errors,
  };
}

export { LIST_HOOK_MAX, STYLE_PATTERN_MAX };
