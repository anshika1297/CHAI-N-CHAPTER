import { LibraryBookQueryParams } from './libraryBookFilter.js';
import { ParserFacets } from './libraryQueryParser.js';
import { aiEnabled, aiJson } from './aiClient.js';

export { aiEnabled };

export interface AiParseResult {
  params: LibraryBookQueryParams;
  summary: string;
  provider: string;
}

const NUMERIC_KEYS = ['minRating', 'minPages', 'maxPages'] as const;
const BOOL_KEYS = ['owned'] as const;
const STRING_KEYS = [
  'q', 'status', 'author', 'series', 'ownership', 'format', 'location',
  'discoveryStatus', 'recommendationConfidence', 'genre', 'theme', 'mood',
  'trope', 'tag', 'collection', 'authorCountry',
] as const;

function buildPrompt(raw: string, facets: ParserFacets): string {
  const cap = (arr: string[], n = 120) => arr.slice(0, n);
  return [
    'You translate a book-search request into a JSON filter for a personal library.',
    'Return ONLY a JSON object with two keys: "params" and "summary".',
    '',
    '"params" may include any of these keys (omit those not implied):',
    '- q: string (free-text keywords not covered by other fields)',
    '- status: one of "want-to-read" | "currently-reading" | "read" | "dnf"',
    '- minPages: number, maxPages: number (e.g. "under 300 pages" -> maxPages 300)',
    '- minRating: number 1-5 (e.g. "4 stars and up" -> 4)',
    '- owned: boolean (true if they want books they own)',
    '- format: "hardcover" | "paperback" | "ebook" | "audiobook"',
    '- location: a physical location where a copy lives',
    '- authorCountry: author nationality/country (e.g. "Indian authors" -> "India")',
    '- genre, theme, mood, trope, tag, collection: comma-separated; MUST use values that exist below.',
    '- author: a single author name from the list below.',
    '',
    'Only use genre/theme/mood/trope/tag/author/location/authorCountry values that appear in these lists (case-sensitive match preferred):',
    `genres: ${JSON.stringify(cap(facets.genres))}`,
    `moods: ${JSON.stringify(cap(facets.moods))}`,
    `themes: ${JSON.stringify(cap(facets.themes))}`,
    `tropes: ${JSON.stringify(cap(facets.tropes))}`,
    `tags: ${JSON.stringify(cap(facets.tags, 200))}`,
    `collections: ${JSON.stringify(cap(facets.collections ?? [], 120))}`,
    `locations: ${JSON.stringify(cap(facets.locations))}`,
    `authorCountries: ${JSON.stringify(cap(facets.authorCountries))}`,
    `authors: ${JSON.stringify(cap(facets.authors, 200))}`,
    '',
    'If an occasion/theme (e.g. "Independence Day", "partition") matches a tag, use that tag.',
    'Women / female-author phrasing map:',
    '- "written by women" / "female authors" / "women writers" → tag written-by-women + collection Women Writers',
    '- "about women" / "women-centric" → tag about-women + collection Women-Centric Reads',
    '- "for women" / "women\'s fiction" → tag for-women-readers + collection For Women Readers',
    '- "Indian women writers" → collection Indian Women Writers',
    '"summary" is a short human sentence describing how you interpreted the request.',
    '',
    `Request: ${JSON.stringify(raw)}`,
  ].join('\n');
}

function sanitize(obj: unknown): LibraryBookQueryParams {
  const src = (obj && typeof obj === 'object' ? obj : {}) as Record<string, unknown>;
  const out: LibraryBookQueryParams = {};
  for (const k of STRING_KEYS) {
    const v = src[k];
    if (typeof v === 'string' && v.trim()) (out as Record<string, unknown>)[k] = v.trim();
    else if (Array.isArray(v) && v.length) (out as Record<string, unknown>)[k] = v.filter(Boolean).join(',');
  }
  for (const k of NUMERIC_KEYS) {
    const v = src[k];
    const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''));
    if (Number.isFinite(n)) (out as Record<string, unknown>)[k] = n;
  }
  for (const k of BOOL_KEYS) {
    const v = src[k];
    if (v === true || v === 'true') (out as Record<string, unknown>)[k] = true;
  }
  return out;
}

/**
 * Ask the configured LLM(s) to interpret the query, with automatic provider
 * fallback. Returns null when no provider is configured or all fail, so the
 * caller can fall back to the heuristic parser.
 */
export async function aiParseQuery(raw: string, facets: ParserFacets): Promise<AiParseResult | null> {
  const result = await aiJson<{ params?: unknown; summary?: unknown }>(buildPrompt(raw, facets));
  if (!result.data || !result.provider) return null;
  return {
    params: sanitize(result.data.params),
    summary: typeof result.data.summary === 'string' ? result.data.summary : '',
    provider: result.provider,
  };
}
