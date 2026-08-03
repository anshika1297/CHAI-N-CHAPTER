import { FilterQuery } from 'mongoose';
import { LibraryBook, ILibraryBook } from '../models/LibraryBook.js';
import { LibraryAuthor } from '../models/LibraryAuthor.js';

/**
 * Normalised query params understood by the Library book search. Both the
 * `/api/library/books` list route and the natural-language `/api/library/query`
 * route funnel into this so filtering behaves identically everywhere.
 */
export interface LibraryBookQueryParams {
  q?: string;
  status?: string;
  author?: string;
  series?: string;
  ownership?: string;
  format?: string;
  location?: string;
  discoveryStatus?: string;
  discoverySource?: string;
  recommendationConfidence?: string;
  genre?: string;
  theme?: string;
  mood?: string;
  trope?: string;
  tag?: string;
  collection?: string;
  season?: string;
  language?: string;
  authorCountry?: string;
  minRating?: number;
  minPages?: number;
  maxPages?: number;
  owned?: boolean;
  /** Only books never recommended (empty recommendationHistory). */
  neverRecommended?: boolean;
  /** Exclude books recommended within the last N days. */
  notRecommendedDays?: number;
}

const SORT_MAP: Record<string, Record<string, 1 | -1>> = {
  recent: { createdAt: -1 },
  title: { title: 1 },
  rating: { rating: -1, title: 1 },
  finished: { finishedDate: -1 },
  added: { addedDate: -1 },
  pages: { pages: 1 },
};

export function sortSpecFor(sort?: string): Record<string, 1 | -1> {
  return SORT_MAP[sort ?? 'recent'] ?? SORT_MAP.recent;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Case-insensitive partial match — not exact / not whitespace-sensitive. */
function containsRe(value: string): RegExp {
  const cleaned = value.trim().replace(/\s+/g, ' ');
  return new RegExp(escapeRegex(cleaned).replace(/\s+/g, '\\s+'), 'i');
}

function pushAnd(
  filter: FilterQuery<ILibraryBook>,
  clause: FilterQuery<ILibraryBook>
): void {
  filter.$and = [...((filter.$and as FilterQuery<ILibraryBook>[]) ?? []), clause];
}

/**
 * Soft “vibe” match: look across taxonomy + free-text fields so
 * “heartbreaking” / “partition” / “Independence Day” still hit when the
 * exact facet string isn’t filled in on every book.
 */
function vibeClause(value: string): FilterQuery<ILibraryBook> {
  const re = containsRe(value);
  return {
    $or: [
      { genres: re },
      { subgenres: re },
      { themes: re },
      { moods: re },
      { tropes: re },
      { tags: re },
      { keywords: re },
      { collections: re },
      { seasonalRecommendation: re },
      { oneLineRecommendation: re },
      { personalNotes: re },
      { whyIRecommendIt: re },
      { description: re },
      { title: re },
      { subtitle: re },
    ],
  };
}

/**
 * Universal keyword match — every meaningful text column on a Library book.
 * Used by free-text `q` so admins can search without remembering which field
 * a word lives in.
 */
function keywordMatchClause(token: string): FilterQuery<ILibraryBook> {
  const re = containsRe(token);
  return {
    $or: [
      { title: re },
      { subtitle: re },
      { author: re },
      { authorSlug: re },
      { authorGender: re },
      { slug: re },
      { series: re },
      { isbn: re },
      { asin: re },
      { publisher: re },
      { country: re },
      { originalLanguage: re },
      { translator: re },
      { edition: re },
      { format: re },
      { location: re },
      { status: re },
      { ownership: re },
      { audience: re },
      { readingLevel: re },
      { writingStyle: re },
      { recommendationConfidence: re },
      { discoverySource: re },
      { discoveryStatus: re },
      { fictionType: re },
      { primaryGenre: re },
      { secondaryGenre: re },
      { womenFocus: re },
      { description: re },
      { personalNotes: re },
      { oneLineRecommendation: re },
      { whyIRecommendIt: re },
      { favouriteCharacter: re },
      { favouriteQuote: re },
      { favouriteScene: re },
      { instagramHook: re },
      { instagramPostTopic: re },
      { bestPostingMonth: re },
      { genres: re },
      { subgenres: re },
      { themes: re },
      { moods: re },
      { tropes: re },
      { tags: re },
      { keywords: re },
      { collections: re },
      { seasonalRecommendation: re },
      { similarBooks: re },
      { triggerWarnings: re },
      { awards: re },
      { 'copies.location': re },
      { 'copies.notes': re },
      { 'copies.format': re },
      { 'recommendationHistory.note': re },
      { 'recommendationHistory.channel': re },
      { 'contentLinks.goodreads': re },
      { 'contentLinks.amazon': re },
      { 'contentLinks.blog': re },
    ],
  };
}

/** Split `q` into keywords. Quoted phrases stay together: `partition "women writers"`. */
function tokenizeKeywords(q: string): string[] {
  const tokens: string[] = [];
  const re = /"([^"]+)"|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(q))) {
    const t = (m[1] || m[2] || '').trim();
    if (t.length >= 2) tokens.push(t);
  }
  // Dedupe while preserving order
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tokens) {
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
}

/**
 * Turn normalised params into a Mongo filter. Async because author-nationality
 * filtering requires resolving author slugs from the LibraryAuthor collection.
 */
export async function buildLibraryBookFilter(
  params: LibraryBookQueryParams
): Promise<FilterQuery<ILibraryBook>> {
  const filter: FilterQuery<ILibraryBook> = {};
  const set = filter as Record<string, unknown>;

  const q = params.q?.trim();
  if (q) {
    const tokens = tokenizeKeywords(q);
    if (tokens.length === 1) {
      pushAnd(filter, keywordMatchClause(tokens[0]));
    } else if (tokens.length > 1) {
      // Every keyword must match somewhere (AND across tokens, OR across fields).
      for (const token of tokens) {
        pushAnd(filter, keywordMatchClause(token));
      }
    } else {
      // Single short token (<2 chars) — still try full-string match
      pushAnd(filter, keywordMatchClause(q));
    }
  }

  const singleFilters: [keyof LibraryBookQueryParams, string][] = [
    ['status', 'status'],
    ['author', 'author'],
    ['series', 'series'],
    ['ownership', 'ownership'],
    ['recommendationConfidence', 'recommendationConfidence'],
  ];
  for (const [key, field] of singleFilters) {
    const val = params[key];
    if (typeof val === 'string' && val.trim()) set[field] = val.trim();
  }

  // Discovery inbox: one status or comma-separated list (pipeline "all").
  if (params.discoveryStatus?.trim()) {
    const values = params.discoveryStatus
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    if (values.length === 1) set.discoveryStatus = values[0];
    else if (values.length > 1) set.discoveryStatus = { $in: values };
  }

  // Format / location live on the book AND/OR on copies (Goodreads + editor mix both).
  if (params.format?.trim()) {
    const format = params.format.trim();
    pushAnd(filter, {
      $or: [{ format }, { 'copies.format': format }],
    });
  }
  if (params.location?.trim()) {
    const location = params.location.trim();
    pushAnd(filter, {
      $or: [{ location }, { 'copies.location': location }],
    });
  }

  // Theme / mood / trope / tag / season / collection — soft cross-field match.
  const vibeKeys: (keyof LibraryBookQueryParams)[] = [
    'theme',
    'mood',
    'trope',
    'tag',
    'collection',
    'season',
  ];
  for (const key of vibeKeys) {
    const raw = params[key];
    if (typeof raw !== 'string' || !raw.trim()) continue;
    const values = raw
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    for (const value of values) {
      pushAnd(filter, vibeClause(value));
    }
  }

  // Genre: partial match across genre-ish + vibe text (shelves often land in tags).
  if (params.genre?.trim()) {
    const values = params.genre
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    for (const value of values) {
      pushAnd(filter, vibeClause(value));
    }
  }

  if (params.language && params.language.trim()) {
    set.originalLanguage = containsRe(params.language);
  }

  if (params.minRating !== undefined) filter.rating = { $gte: params.minRating };

  if (params.minPages !== undefined || params.maxPages !== undefined) {
    const pageRange: Record<string, number> = {};
    if (params.minPages !== undefined) pageRange.$gte = params.minPages;
    if (params.maxPages !== undefined) pageRange.$lte = params.maxPages;
    filter.pages = pageRange;
  }

  if (params.owned) {
    pushAnd(filter, {
      $or: [
        { ownership: 'owned' },
        { 'copies.0': { $exists: true } },
      ],
    });
  }

  if (params.discoverySource?.trim()) {
    set.discoverySource = params.discoverySource.trim();
  }

  if (params.authorCountry && params.authorCountry.trim()) {
    const countryRe = containsRe(params.authorCountry);
    const matchingAuthors = await LibraryAuthor.find({ country: countryRe })
      .select('slug')
      .lean();
    const slugs = matchingAuthors.map((a) => a.slug).filter(Boolean);
    // Authors collection OR country text on the book (when author link is missing).
    const countryOr: FilterQuery<ILibraryBook>[] = [{ country: countryRe }];
    if (slugs.length) countryOr.unshift({ authorSlug: { $in: slugs } });
    pushAnd(filter, { $or: countryOr });
  }

  if (params.neverRecommended) {
    pushAnd(filter, {
      $or: [
        { recommendationHistory: { $exists: false } },
        { recommendationHistory: { $size: 0 } },
        { recommendationHistory: null },
      ],
    });
  } else if (params.notRecommendedDays !== undefined && params.notRecommendedDays > 0) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - params.notRecommendedDays);
    pushAnd(filter, {
      $or: [
        { recommendationHistory: { $exists: false } },
        { recommendationHistory: { $size: 0 } },
        { recommendationHistory: { $not: { $elemMatch: { date: { $gte: cutoff } } } } },
      ],
    });
  }

  return filter;
}

/** Distinct facet values used by both the list UI and the query parser. */
export async function getLibraryFacets(): Promise<{
  authors: string[];
  genres: string[];
  themes: string[];
  moods: string[];
  tropes: string[];
  tags: string[];
  locations: string[];
  authorCountries: string[];
  seasons: string[];
  languages: string[];
  collections: string[];
}> {
  const [
    authors,
    genres,
    themes,
    moods,
    tropes,
    tags,
    copyLocations,
    bookLocations,
    authorCountries,
    seasons,
    languages,
    collections,
  ] = await Promise.all([
    LibraryBook.distinct('author', { author: { $ne: '' } }),
    LibraryBook.distinct('genres'),
    LibraryBook.distinct('themes'),
    LibraryBook.distinct('moods'),
    LibraryBook.distinct('tropes'),
    LibraryBook.distinct('tags'),
    LibraryBook.distinct('copies.location', { 'copies.location': { $ne: '' } }),
    LibraryBook.distinct('location', { location: { $ne: '' } }),
    LibraryAuthor.distinct('country', { country: { $ne: '' } }),
    LibraryBook.distinct('seasonalRecommendation'),
    LibraryBook.distinct('originalLanguage', { originalLanguage: { $ne: '' } }),
    LibraryBook.distinct('collections'),
  ]);
  const clean = (arr: unknown) =>
    [...new Set((arr as string[]).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  return {
    authors: clean(authors),
    genres: clean(genres),
    themes: clean(themes),
    moods: clean(moods),
    tropes: clean(tropes),
    tags: clean(tags),
    locations: clean([...(copyLocations as string[]), ...(bookLocations as string[])]),
    authorCountries: clean(authorCountries),
    seasons: clean(seasons),
    languages: clean(languages),
    collections: clean(collections),
  };
}
