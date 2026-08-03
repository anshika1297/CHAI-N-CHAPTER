import { aiJson, AiAttemptError } from './aiClient.js';

export interface AuthorSuggestion {
  id: string;
  name: string;
  country: string;
  primaryLanguage: string;
}

/** Rich AI suggestion for a library book (classification + fillable metadata). */
export interface BookClassificationSuggestion {
  genres: string[];
  subgenres: string[];
  themes: string[];
  moods: string[];
  tropes: string[];
  tags: string[];
  keywords: string[];
  seasonalRecommendation: string[];
  similarBooks: string[];
  triggerWarnings: string[];
  audience: string;
  readingLevel: string;
  writingStyle: string;
  series: string;
  publisher: string;
  country: string;
  originalLanguage: string;
  description: string;
  oneLineRecommendation: string;
  pages?: number;
}

export interface BookEnrichRow extends BookClassificationSuggestion {
  id: string;
  title: string;
  author: string;
}

const AUTHOR_BATCH = 25;
/** Keep book batches small — each call returns a large structured payload. */
const BOOK_ENRICH_MAX = 5;

function asArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x ?? '').trim()).filter(Boolean);
  if (typeof v === 'string' && v.trim()) return v.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

function asStr(v: unknown): string {
  return typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim();
}

function asPages(v: unknown): number | undefined {
  if (v == null || v === '') return undefined;
  const n = typeof v === 'number' ? v : parseInt(String(v), 10);
  return Number.isFinite(n) && n > 0 && n < 10000 ? Math.round(n) : undefined;
}

function emptySuggestion(): BookClassificationSuggestion {
  return {
    genres: [],
    subgenres: [],
    themes: [],
    moods: [],
    tropes: [],
    tags: [],
    keywords: [],
    seasonalRecommendation: [],
    similarBooks: [],
    triggerWarnings: [],
    audience: '',
    readingLevel: '',
    writingStyle: '',
    series: '',
    publisher: '',
    country: '',
    originalLanguage: '',
    description: '',
    oneLineRecommendation: '',
  };
}

function parseBookSuggestion(data: Record<string, unknown>): BookClassificationSuggestion {
  return {
    genres: asArray(data.genres),
    subgenres: asArray(data.subgenres),
    themes: asArray(data.themes),
    moods: asArray(data.moods),
    tropes: asArray(data.tropes),
    tags: asArray(data.tags),
    keywords: asArray(data.keywords),
    seasonalRecommendation: asArray(data.seasonalRecommendation ?? data.occasions),
    similarBooks: asArray(data.similarBooks),
    triggerWarnings: asArray(data.triggerWarnings),
    audience: asStr(data.audience),
    readingLevel: asStr(data.readingLevel),
    writingStyle: asStr(data.writingStyle),
    series: asStr(data.series),
    publisher: asStr(data.publisher),
    country: asStr(data.country),
    originalLanguage: asStr(data.originalLanguage),
    description: asStr(data.description),
    oneLineRecommendation: asStr(data.oneLineRecommendation ?? data.pitch),
    pages: asPages(data.pages),
  };
}

function suggestionHasContent(s: BookClassificationSuggestion): boolean {
  return (
    s.genres.length +
      s.subgenres.length +
      s.themes.length +
      s.moods.length +
      s.tropes.length +
      s.tags.length +
      s.keywords.length +
      s.seasonalRecommendation.length +
      s.similarBooks.length +
      s.triggerWarnings.length >
      0 ||
    Boolean(
      s.audience ||
        s.readingLevel ||
        s.writingStyle ||
        s.series ||
        s.publisher ||
        s.country ||
        s.originalLanguage ||
        s.description ||
        s.oneLineRecommendation ||
        s.pages
    )
  );
}

function buildBookPrompt(book: {
  title: string;
  author?: string;
  description?: string;
  personalNotes?: string;
  genres?: string[];
  tags?: string[];
  series?: string;
  publisher?: string;
  pages?: number;
}): string {
  return [
    'You are a librarian enriching a book for a personal content-planning library (blog, Instagram, newsletters, seasonal posts).',
    'Return ONLY one JSON object with these keys (use empty string or [] when unknown — do not invent plot spoilers):',
    '{',
    '  "genres": string[], "subgenres": string[], "themes": string[], "moods": string[], "tropes": string[],',
    '  "tags": string[], "keywords": string[], "seasonalRecommendation": string[], "similarBooks": string[],',
    '  "triggerWarnings": string[],',
    '  "audience": string, "readingLevel": string, "writingStyle": string,',
    '  "series": string, "publisher": string, "country": string, "originalLanguage": string,',
    '  "description": string, "oneLineRecommendation": string, "pages": number|null',
    '}',
    'Guidelines:',
    '- genres: 1-3 broad genres (e.g. "Historical Fiction", "Literary Fiction", "Thriller", "Mythology").',
    '- subgenres: 0-3 more specific (e.g. "Indian Mythology", "Domestic Thriller").',
    '- themes: 3-8 core themes (e.g. "grief", "identity", "partition", "war", "found family").',
    '- moods: 2-5 moods (e.g. "heartbreaking", "hopeful", "atmospheric", "dark", "witty").',
    '- tropes: 0-5 if applicable.',
    '- tags: 4-10 content-planning tags (occasions + hooks), human-readable',
    '  (e.g. "Indian author", "partition story", "Independence Day", "book club pick", "translated fiction", "under 300 pages").',
    '- keywords: 3-8 search/discovery keywords.',
    '- seasonalRecommendation: 0-5 occasions/seasons this book fits (e.g. "Diwali", "Women\'s History Month", "rainy day read").',
    '- similarBooks: 0-4 well-known comparable titles (title only).',
    '- triggerWarnings: only clear, commonly noted ones; else [].',
    '- audience: e.g. "adult", "YA", "general adult".',
    '- readingLevel: e.g. "accessible", "literary", "dense".',
    '- writingStyle: short phrase (e.g. "lyrical", "fast-paced prose").',
    '- series / publisher / country / originalLanguage: fill when known; else "".',
    '- country: setting or cultural origin of the story when relevant (e.g. "India").',
    '- description: 1-3 sentence spoiler-free blurb (only if useful; else "").',
    '- oneLineRecommendation: one punchy sentence why someone should read/recommend it.',
    '- pages: approximate page count only if reasonably known; else null.',
    'Keep values concise and human-readable. Prefer existing vocabulary when given.',
    '',
    `Title: ${JSON.stringify(book.title)}`,
    `Author: ${JSON.stringify(book.author ?? '')}`,
    `Series (known): ${JSON.stringify(book.series ?? '')}`,
    `Publisher (known): ${JSON.stringify(book.publisher ?? '')}`,
    `Pages (known): ${JSON.stringify(book.pages ?? null)}`,
    `Existing genres: ${JSON.stringify(book.genres ?? [])}`,
    `Existing tags: ${JSON.stringify(book.tags ?? [])}`,
    `Description/notes: ${JSON.stringify((book.description || book.personalNotes || '').slice(0, 1500))}`,
  ].join('\n');
}

/**
 * Infer author nationality + primary writing language from names, in batches.
 * Returns suggestions the admin reviews before applying (never auto-writes).
 */
export async function suggestAuthorNationalities(
  authors: { id: string; name: string }[]
): Promise<{ suggestions: AuthorSuggestion[]; provider: string; errors: AiAttemptError[] }> {
  const suggestions: AuthorSuggestion[] = [];
  let usedProvider = '';
  const errors: AiAttemptError[] = [];

  for (let i = 0; i < authors.length; i += AUTHOR_BATCH) {
    const batch = authors.slice(i, i + AUTHOR_BATCH);
    const prompt = [
      'For each author below, give their nationality (country) and primary writing language.',
      'Return ONLY a JSON array of objects: [{"name": string, "country": string, "primaryLanguage": string}].',
      'Use the country the author is most associated with. If genuinely unknown, use "" (empty string). Do not guess wildly.',
      'Country should be a plain name like "India", "USA", "UK", "Japan".',
      '',
      `Authors: ${JSON.stringify(batch.map((a) => a.name))}`,
    ].join('\n');

    // eslint-disable-next-line no-await-in-loop
    const result = await aiJson<unknown>(prompt);
    if (!result.data || !result.provider) {
      errors.push(...result.errors);
      continue;
    }
    usedProvider = result.provider;

    // Model may return an array, or an object wrapping the array.
    let rows: unknown[] = [];
    if (Array.isArray(result.data)) rows = result.data;
    else if (result.data && typeof result.data === 'object') {
      const obj = result.data as Record<string, unknown>;
      const arr = obj.authors ?? obj.results ?? obj.data ?? Object.values(obj)[0];
      if (Array.isArray(arr)) rows = arr;
    }

    const byName = new Map<string, { country: string; primaryLanguage: string }>();
    for (const row of rows) {
      const r = row as Record<string, unknown>;
      const name = String(r.name ?? '').trim().toLowerCase();
      if (!name) continue;
      byName.set(name, {
        country: String(r.country ?? '').trim(),
        primaryLanguage: String(r.primaryLanguage ?? r.language ?? '').trim(),
      });
    }

    for (const a of batch) {
      const hit = byName.get(a.name.trim().toLowerCase());
      if (hit && (hit.country || hit.primaryLanguage)) {
        suggestions.push({ id: a.id, name: a.name, country: hit.country, primaryLanguage: hit.primaryLanguage });
      }
    }
  }

  return { suggestions, provider: usedProvider, errors };
}

/**
 * Suggest rich classification + metadata for a single book.
 * The admin reviews and applies.
 */
export async function suggestBookClassification(book: {
  title: string;
  author?: string;
  description?: string;
  personalNotes?: string;
  genres?: string[];
  tags?: string[];
  series?: string;
  publisher?: string;
  pages?: number;
}): Promise<
  | { suggestion: BookClassificationSuggestion; provider: string; errors?: AiAttemptError[] }
  | { errors: AiAttemptError[] }
> {
  const result = await aiJson<Record<string, unknown>>(buildBookPrompt(book));
  if (!result.data || !result.provider) {
    return { errors: result.errors };
  }

  return {
    suggestion: parseBookSuggestion(result.data),
    provider: result.provider,
  };
}

/**
 * Enrich multiple books (selection-based). Processes one book at a time for quality.
 * Cap is BOOK_ENRICH_MAX — callers should pass a page selection.
 */
export async function suggestBooksEnrichment(
  books: {
    id: string;
    title: string;
    author?: string;
    description?: string;
    personalNotes?: string;
    genres?: string[];
    tags?: string[];
    series?: string;
    publisher?: string;
    pages?: number;
  }[]
): Promise<{ suggestions: BookEnrichRow[]; provider: string; errors: AiAttemptError[] }> {
  const slice = books.slice(0, BOOK_ENRICH_MAX);
  const suggestions: BookEnrichRow[] = [];
  let usedProvider = '';
  const errors: AiAttemptError[] = [];

  for (const book of slice) {
    // eslint-disable-next-line no-await-in-loop
    const result = await suggestBookClassification(book);
    if (!('suggestion' in result)) {
      errors.push(...result.errors);
      continue;
    }
    usedProvider = result.provider;
    if (suggestionHasContent(result.suggestion)) {
      suggestions.push({
        id: book.id,
        title: book.title,
        author: book.author ?? '',
        ...result.suggestion,
      });
    } else {
      suggestions.push({
        id: book.id,
        title: book.title,
        author: book.author ?? '',
        ...emptySuggestion(),
      });
    }
  }

  return { suggestions, provider: usedProvider, errors };
}

export { BOOK_ENRICH_MAX };
