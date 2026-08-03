import { librarySlugify } from '../config/libraryEnums.js';
import type { BookFormat, ReadingStatus } from '../config/libraryEnums.js';
import { BULK_TEMPLATE_HEADERS, BULK_TEMPLATE_EXAMPLE_ROW } from '../config/libraryExcelSchema.js';
import { parseCsv, csvToRecords } from './libraryImport.js';
import { toCsv } from '../utils/libraryCsv.js';

export { BULK_TEMPLATE_HEADERS } from '../config/libraryExcelSchema.js';

/**
 * Canonical Library OS sheet columns — source of truth for import/export/admin.
 * Matches the editorial Excel schema (all columns mandatory in the template).
 */

/** Downloadable template: header + one example row (Excel opens this CSV cleanly). */
export function buildBulkImportTemplateCsv(): string {
  return toCsv([...BULK_TEMPLATE_HEADERS], [[...BULK_TEMPLATE_EXAMPLE_ROW]]);
}

/**
 * All Excel columns are mandatory in the file header (cells may be empty or "—").
 * Returns missing headers (empty array = OK). Case-insensitive match.
 */
export function missingBulkTemplateHeaders(csv: string): string[] {
  const rows = parseCsv(csv);
  if (!rows.length) return [...BULK_TEMPLATE_HEADERS];
  const present = new Set(
    rows[0]
      .map((h) => {
        const t = h.trim();
        // Sheet2 sometimes exports Tropes with a blank header name.
        return t ? t.toLowerCase() : 'tropes';
      })
      .filter(Boolean)
  );
  return BULK_TEMPLATE_HEADERS.filter((h) => !present.has(h.toLowerCase()));
}

/** Title + Author are required per row; other columns may be blank/"—". */
export function validateTemplateBookRow(b: { title?: string; author?: string }): string | null {
  if (!b.title?.trim()) return 'Title is required';
  if (!b.author?.trim()) return 'Author is required';
  return null;
}

function splitList(v: string | undefined): string[] {
  if (!v?.trim()) return [];
  const cleaned = v.trim();
  if (cleaned === '—' || cleaned === '-' || cleaned.toLowerCase() === 'n/a') return [];
  return cleaned
    .split(/[|;,]/)
    .map((s) => s.trim())
    .filter((s) => s && s !== '—' && s !== '-');
}

function blankToEmpty(v: string): string {
  const t = v.trim();
  if (!t || t === '—' || t === '-' || t.toLowerCase() === 'n/a') return '';
  return t;
}

function toNum(v: string | undefined): number | undefined {
  const t = blankToEmpty(v || '');
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

function toDate(v: string | undefined): Date | undefined {
  const t = blankToEmpty(v || '');
  if (!t) return undefined;
  // Year-only
  if (/^\d{4}$/.test(t)) return new Date(Date.UTC(parseInt(t, 10), 0, 1));
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function toYearDate(v: string | undefined): Date | undefined {
  const t = blankToEmpty(v || '');
  if (!t) return undefined;
  const year = parseInt(t, 10);
  if (!Number.isFinite(year) || year < 1000 || year > 3000) return toDate(t);
  return new Date(Date.UTC(year, 0, 1));
}

function parseYesNo(v: string | undefined): boolean | undefined {
  const t = blankToEmpty(v || '').toLowerCase();
  if (!t) return undefined;
  if (['yes', 'y', 'true', '1'].includes(t)) return true;
  if (['no', 'n', 'false', '0'].includes(t)) return false;
  return undefined;
}

function parseGender(v: string): string {
  const t = blankToEmpty(v).toLowerCase();
  if (!t) return '';
  if (t.startsWith('f')) return 'female';
  if (t.startsWith('m') && !t.includes('non')) return 'male';
  if (t.includes('non') || t === 'nb') return 'non-binary';
  if (t === 'unknown' || t === 'other') return 'unknown';
  return blankToEmpty(v);
}

function parseFictionType(v: string): string {
  const t = blankToEmpty(v).toLowerCase();
  if (!t) return '';
  if (t.includes('non')) return 'non-fiction';
  if (t.includes('fiction')) return 'fiction';
  return blankToEmpty(v);
}

function parseWomenFocus(v: string): string {
  const t = blankToEmpty(v).toLowerCase();
  if (!t) return '';
  if (t === 'no' || t === 'n') return 'no';
  if (t === 'yes' || t === 'y') return 'yes';
  if (t.startsWith('prim')) return 'primary';
  if (t.startsWith('sec')) return 'secondary';
  return blankToEmpty(v);
}

function parseStatus(v: string): ReadingStatus {
  const t = blankToEmpty(v).toLowerCase().replace(/\s+/g, '-');
  const map: Record<string, ReadingStatus> = {
    read: 'read',
    'want-to-read': 'want-to-read',
    wanttoread: 'want-to-read',
    tbr: 'want-to-read',
    'currently-reading': 'currently-reading',
    reading: 'currently-reading',
    dnf: 'dnf',
    wishlist: 'wishlist',
    arc: 'arc',
    'beta-read': 'beta-read',
  };
  return map[t] || (t as ReadingStatus) || 'want-to-read';
}

function parseFormat(v: string): BookFormat | undefined {
  const t = blankToEmpty(v).toLowerCase();
  if (!t) return undefined;
  if (['hardcover', 'paperback', 'ebook', 'audiobook', 'other'].includes(t)) {
    return t as BookFormat;
  }
  if (t.includes('hard')) return 'hardcover';
  if (t.includes('paper')) return 'paperback';
  if (t.includes('audio')) return 'audiobook';
  if (t.includes('kindle') || t.includes('e-book') || t.includes('ebook')) return 'ebook';
  return 'other';
}

const STATUSES = new Set([
  'want-to-read',
  'currently-reading',
  'read',
  'dnf',
  'arc',
  'beta-read',
  'wishlist',
]);

export type BulkTemplateBook = {
  title: string;
  slug: string;
  author: string;
  authorSlug: string;
  subtitle?: string;
  authorGender?: string;
  country?: string;
  originalLanguage?: string;
  translator?: string;
  publicationDate?: Date;
  pages?: number;
  isbn?: string;
  coverImage?: string;
  fictionType?: string;
  primaryGenre?: string;
  secondaryGenre?: string;
  genres: string[];
  subgenres: string[];
  audience?: string;
  inSeries?: boolean;
  series?: string;
  seriesNumber?: number;
  standalone?: boolean;
  themes: string[];
  moods: string[];
  tags: string[];
  femaleAuthor?: boolean;
  femaleProtagonist?: boolean;
  womenFocus?: string;
  collections: string[];
  seasonalRecommendation: string[];
  readingLevel?: string;
  similarBooks: string[];
  oneLineRecommendation?: string;
  description?: string;
  instagramHook?: string;
  instagramPostTopic?: string;
  bestPostingMonth?: string;
  rating?: number;
  /** Set only when the sheet has a Read Status value (avoid defaulting upserts to want-to-read). */
  status?: ReadingStatus;
  finishedDate?: Date;
  format?: BookFormat;
  owned?: boolean;
  /** Excel: Wishlist — free text in editorial sheet (Yes / shelf labels / etc.) */
  wishlist?: string;
  ownership?: string;
  awards: string[];
  /** Excel: Bestseller — Yes/No or popularity / rights notes */
  bestseller?: string;
  /** Excel: Adaptation — Yes/No or adaptation notes / popularity */
  adaptation?: string;
  /** Excel: BookTok Popular — Yes/No or High/Moderate/… */
  bookTokPopular?: string;
  /** Excel: Bookstagram Popular — Yes/No or High/Moderate/… */
  bookstagramPopular?: string;
  // legacy / unused by new sheet but kept for create/update helpers
  tropes: string[];
  publisher?: string;
  location?: string;
  recommendationConfidence?: string;
  whyIRecommendIt?: string;
  personalNotes?: string;
  addedDate?: Date;
  copies?: { format?: BookFormat; location?: string }[];
};

function get(rec: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    if (rec[k]?.trim()) return rec[k].trim();
    const found = Object.keys(rec).find((h) => h.toLowerCase() === k.toLowerCase());
    if (found && rec[found]?.trim()) return rec[found].trim();
  }
  return '';
}

/** Parse the canonical Library Excel/CSV into book payloads. */
export function mapBulkTemplateCsv(csv: string): BulkTemplateBook[] {
  const records = csvToRecords(parseCsv(csv));
  const out: BulkTemplateBook[] = [];

  for (const rec of records) {
    const title = blankToEmpty(get(rec, 'Title'));
    if (!title) continue;
    const author = blankToEmpty(get(rec, 'Author'));

    const primaryGenre = blankToEmpty(get(rec, 'Primary Genre'));
    const secondaryGenre = blankToEmpty(get(rec, 'Secondary Genre'));
    const genres = [primaryGenre, secondaryGenre].filter(Boolean);
    // Back-compat: old "Genres" column
    if (!genres.length) genres.push(...splitList(get(rec, 'Genres')));

    const owned = parseYesNo(get(rec, 'Owned'));
    const wishlistRaw = blankToEmpty(get(rec, 'Wishlist'));
    const wishlistYes = parseYesNo(wishlistRaw);
    let ownership: string | undefined;
    if (owned === true) ownership = 'owned';
    else if (wishlistYes === true) ownership = 'wishlist';
    else {
      const legacy = blankToEmpty(get(rec, 'Ownership')).toLowerCase();
      if (legacy) ownership = legacy;
    }

    const format =
      parseFormat(get(rec, 'Format Read')) ||
      parseFormat(get(rec, 'Format')) ||
      undefined;

    const statusRaw = blankToEmpty(get(rec, 'Read Status', 'Status'));
    const status = statusRaw ? parseStatus(statusRaw) : undefined;
    const statusFinal =
      status && STATUSES.has(status)
        ? status
        : statusRaw
          ? ('want-to-read' as ReadingStatus)
          : undefined;

    // If sheet only marks Wishlist=Yes and has no Read Status, treat as wishlist.
    const wishlistImpliesStatus =
      !statusFinal && parseYesNo(wishlistRaw) === true
        ? ('wishlist' as ReadingStatus)
        : undefined;

    const seriesName = blankToEmpty(get(rec, 'Series Name', 'Series'));
    // If "Series" is Yes/No, Series Name is separate
    const seriesFlag = parseYesNo(get(rec, 'Series'));
    const series =
      seriesFlag !== undefined
        ? blankToEmpty(get(rec, 'Series Name'))
        : seriesName && !['yes', 'no'].includes(seriesName.toLowerCase())
          ? seriesName
          : blankToEmpty(get(rec, 'Series Name'));

    const book: BulkTemplateBook = {
      title,
      slug: librarySlugify(`${title}-${author}`),
      author,
      authorSlug: author ? librarySlugify(author) : '',
      subtitle: blankToEmpty(get(rec, 'Subtitle')) || undefined,
      authorGender: parseGender(get(rec, 'Author Gender')) || undefined,
      country: blankToEmpty(get(rec, 'Country')) || undefined,
      originalLanguage:
        blankToEmpty(get(rec, 'Original Language', 'Language')) || undefined,
      translator: blankToEmpty(get(rec, 'Translator')) || undefined,
      publicationDate: toYearDate(get(rec, 'Publication Year')),
      pages: toNum(get(rec, 'Pages')),
      isbn: blankToEmpty(get(rec, 'ISBN')) || undefined,
      coverImage: blankToEmpty(get(rec, 'Cover URL')) || undefined,
      fictionType: parseFictionType(get(rec, 'Fiction / Non-fiction')) || undefined,
      primaryGenre: primaryGenre || undefined,
      secondaryGenre: secondaryGenre || undefined,
      genres,
      subgenres: splitList(get(rec, 'Subgenre', 'Subgenres')),
      audience: blankToEmpty(get(rec, 'Audience')) || undefined,
      inSeries: seriesFlag,
      series: series || undefined,
      seriesNumber: toNum(get(rec, 'Series Number')),
      standalone: parseYesNo(get(rec, 'Standalone')),
      themes: splitList(get(rec, 'Themes')),
      moods: splitList(get(rec, 'Mood / Reading Experience', 'Moods')),
      tags: splitList(get(rec, 'Search Tags', 'Tags')),
      femaleAuthor: parseYesNo(get(rec, 'Female Author')),
      femaleProtagonist: parseYesNo(get(rec, 'Female Protagonist')),
      womenFocus: parseWomenFocus(get(rec, 'Women Focus')) || undefined,
      collections: splitList(get(rec, 'Collections')),
      seasonalRecommendation: splitList(
        get(rec, 'Recommendation Occasion', 'Seasonal')
      ),
      readingLevel: blankToEmpty(get(rec, 'Reading Level')) || undefined,
      similarBooks: splitList(get(rec, 'Similar Books')),
      oneLineRecommendation:
        blankToEmpty(get(rec, 'One-line Recommendation', 'One-line recommendation')) ||
        undefined,
      description: blankToEmpty(get(rec, 'Short Description')) || undefined,
      instagramHook: blankToEmpty(get(rec, 'Instagram Hook')) || undefined,
      instagramPostTopic: blankToEmpty(get(rec, 'Instagram Post Topic')) || undefined,
      bestPostingMonth: blankToEmpty(get(rec, 'Best Posting Month')) || undefined,
      rating: toNum(get(rec, 'Chapters.Aur.Chai Rating', 'Rating')),
      status: statusFinal || wishlistImpliesStatus,
      finishedDate: toDate(get(rec, 'Date Read', 'Finished')),
      format,
      owned,
      wishlist: wishlistRaw || undefined,
      ownership,
      awards: splitList(get(rec, 'Awards')),
      bestseller: blankToEmpty(get(rec, 'Bestseller')) || undefined,
      adaptation: blankToEmpty(get(rec, 'Adaptation')) || undefined,
      bookTokPopular: blankToEmpty(get(rec, 'BookTok Popular')) || undefined,
      bookstagramPopular: blankToEmpty(get(rec, 'Bookstagram Popular')) || undefined,
      // Sheet2 may export Tropes with a blank header → key ''
      tropes: splitList(get(rec, 'Tropes', '')),
      publisher: blankToEmpty(get(rec, 'Publisher')) || undefined,
      location: blankToEmpty(get(rec, 'Location')) || undefined,
      recommendationConfidence: blankToEmpty(get(rec, 'Confidence')).toLowerCase() || undefined,
      whyIRecommendIt: blankToEmpty(get(rec, 'Why I recommend it')) || undefined,
      personalNotes: blankToEmpty(get(rec, 'Personal notes')) || undefined,
      addedDate: toDate(get(rec, 'Added')),
    };

    if (format || book.location) {
      book.copies = [{ format: format || undefined, location: book.location || undefined }];
    }

    out.push(book);
  }

  return out;
}

/**
 * Write every Excel-schema field from the sheet onto the book.
 * Empty / "—" cells become '' or [] so the sheet is the source of truth.
 * Reading-log fields (status, rating, format, finishedDate, owned) are only
 * written when the sheet cell had a value — blanks leave existing DB values.
 */
export function enrichmentFieldsFromTemplateBook(
  b: BulkTemplateBook,
  opts: { includeSlug?: boolean } = {}
): Record<string, unknown> {
  const set: Record<string, unknown> = {
    title: b.title,
    author: b.author || '',
    authorSlug: b.authorSlug || '',
    subtitle: b.subtitle || '',
    authorGender: b.authorGender || '',
    country: b.country || '',
    originalLanguage: b.originalLanguage || '',
    translator: b.translator || '',
    pages: b.pages,
    isbn: b.isbn || '',
    coverImage: b.coverImage || '',
    fictionType: b.fictionType || '',
    primaryGenre: b.primaryGenre || '',
    secondaryGenre: b.secondaryGenre || '',
    genres: b.genres?.length
      ? b.genres
      : ([b.primaryGenre, b.secondaryGenre].filter(Boolean) as string[]),
    subgenres: b.subgenres ?? [],
    audience: b.audience || '',
    series: b.series || '',
    themes: b.themes ?? [],
    moods: b.moods ?? [],
    tropes: b.tropes ?? [],
    tags: b.tags ?? [],
    womenFocus: b.womenFocus || '',
    collections: b.collections ?? [],
    seasonalRecommendation: b.seasonalRecommendation ?? [],
    readingLevel: b.readingLevel || '',
    similarBooks: b.similarBooks ?? [],
    oneLineRecommendation: b.oneLineRecommendation || '',
    description: b.description || '',
    instagramHook: b.instagramHook || '',
    instagramPostTopic: b.instagramPostTopic || '',
    bestPostingMonth: b.bestPostingMonth || '',
    wishlist: b.wishlist || '',
    awards: b.awards ?? [],
    bestseller: b.bestseller || '',
    adaptation: b.adaptation || '',
    bookTokPopular: b.bookTokPopular || '',
    bookstagramPopular: b.bookstagramPopular || '',
  };

  // Remove undefined pages so Mongo doesn't get confused
  if (b.pages === undefined) delete set.pages;

  if (opts.includeSlug) {
    set.slug = b.slug;
  }

  if (b.pages !== undefined) set.pages = b.pages;
  if (b.publicationDate) set.publicationDate = b.publicationDate;
  if (b.seriesNumber !== undefined) set.seriesNumber = b.seriesNumber;
  if (b.inSeries !== undefined) set.inSeries = b.inSeries;
  if (b.standalone !== undefined) set.standalone = b.standalone;
  if (b.femaleAuthor !== undefined) set.femaleAuthor = b.femaleAuthor;
  if (b.femaleProtagonist !== undefined) set.femaleProtagonist = b.femaleProtagonist;

  // Reading-log: only overwrite when sheet provided a value
  if (b.status) set.status = b.status;
  if (b.rating !== undefined) set.rating = b.rating;
  if (b.format) set.format = b.format;
  if (b.finishedDate) set.finishedDate = b.finishedDate;
  if (b.owned !== undefined) set.owned = b.owned;
  if (b.ownership) set.ownership = b.ownership;

  if (b.publisher) set.publisher = b.publisher;
  if (b.location) set.location = b.location;
  if (b.recommendationConfidence) set.recommendationConfidence = b.recommendationConfidence;
  if (b.whyIRecommendIt) set.whyIRecommendIt = b.whyIRecommendIt;
  if (b.personalNotes) set.personalNotes = b.personalNotes;
  if (b.addedDate) set.addedDate = b.addedDate;
  if (b.copies && b.copies.length) set.copies = b.copies;

  return set;
}

/** Payload for LibraryBook.create from a template row. */
export function createFieldsFromTemplateBook(b: BulkTemplateBook): Record<string, unknown> {
  return {
    ...enrichmentFieldsFromTemplateBook(b, { includeSlug: true }),
    status: b.status || 'want-to-read',
    copies: b.copies ?? [],
    awards: b.awards ?? [],
    similarBooks: b.similarBooks ?? [],
    tropes: b.tropes ?? [],
    themes: b.themes ?? [],
    moods: b.moods ?? [],
    tags: b.tags ?? [],
    collections: b.collections ?? [],
    seasonalRecommendation: b.seasonalRecommendation ?? [],
    subgenres: b.subgenres ?? [],
    genres: b.genres ?? [],
  };
}

/** Upsert $set: full Excel sync, keep existing slug (avoids unique-index clashes). */
export function upsertFieldsFromTemplateBook(b: BulkTemplateBook): Record<string, unknown> {
  return enrichmentFieldsFromTemplateBook(b, { includeSlug: false });
}
