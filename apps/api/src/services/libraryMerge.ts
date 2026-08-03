import { LibraryBook, type ILibraryBook, type IRecommendationEntry, type IBookCopy } from '../models/LibraryBook.js';

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x ?? '').trim()).filter(Boolean);
}

function mergeUniqueStrings(a: string[] | undefined, b: string[] | undefined): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const v of [...(a ?? []), ...(b ?? [])]) {
    const t = v.trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

function preferNonEmpty(keep: string | undefined, drop: string | undefined): string {
  const k = (keep ?? '').trim();
  if (k) return k;
  return (drop ?? '').trim();
}

function historyKey(e: IRecommendationEntry): string {
  const d =
    e.date instanceof Date
      ? e.date.toISOString().slice(0, 10)
      : new Date(e.date).toISOString().slice(0, 10);
  return `${d}|${(e.channel || '').toLowerCase()}|${(e.contentUrl || '').toLowerCase()}`;
}

function mergeHistory(
  a: IRecommendationEntry[] | undefined,
  b: IRecommendationEntry[] | undefined
): IRecommendationEntry[] {
  const out: IRecommendationEntry[] = [];
  const seen = new Set<string>();
  for (const e of [...(a ?? []), ...(b ?? [])]) {
    if (!e?.date) continue;
    const key = historyKey(e);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
  }
  out.sort((x, y) => new Date(x.date).getTime() - new Date(y.date).getTime());
  return out;
}

function mergeCopies(a: IBookCopy[] | undefined, b: IBookCopy[] | undefined): IBookCopy[] {
  const out: IBookCopy[] = [...(a ?? [])];
  const sig = (c: IBookCopy) =>
    `${(c.format || '').toLowerCase()}|${(c.location || '').toLowerCase()}|${(c.notes || '').toLowerCase()}`;
  const seen = new Set(out.map(sig));
  for (const c of b ?? []) {
    const key = sig(c);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

const ARRAY_FIELDS = [
  'genres',
  'subgenres',
  'themes',
  'tropes',
  'moods',
  'keywords',
  'tags',
  'collections',
  'seasonalRecommendation',
  'similarBooks',
  'triggerWarnings',
] as const;

const SCALAR_FIELDS = [
  'subtitle',
  'coverImage',
  'isbn',
  'asin',
  'format',
  'edition',
  'description',
  'series',
  'publisher',
  'country',
  'originalLanguage',
  'translator',
  'ownership',
  'location',
  'audience',
  'readingLevel',
  'writingStyle',
  'oneLineRecommendation',
  'personalNotes',
  'favouriteCharacter',
  'favouriteQuote',
  'favouriteScene',
  'whyIRecommendIt',
  'discoverySource',
  'discoveryStatus',
  'recommendationConfidence',
] as const;

/**
 * Merge drop book into keep book, then delete drop.
 * Unions lists/copies/rec history; fills empty scalars from drop.
 */
export async function mergeLibraryBooks(
  keepId: string,
  dropId: string
): Promise<{ book: ILibraryBook }> {
  if (keepId === dropId) throw new Error('Cannot merge a book into itself');

  const [keep, drop] = await Promise.all([
    LibraryBook.findById(keepId),
    LibraryBook.findById(dropId),
  ]);
  if (!keep) throw new Error('Keeper book not found');
  if (!drop) throw new Error('Duplicate book not found');

  for (const field of ARRAY_FIELDS) {
    const merged = mergeUniqueStrings(
      asStringArray((keep as unknown as Record<string, unknown>)[field]),
      asStringArray((drop as unknown as Record<string, unknown>)[field])
    );
    (keep as unknown as Record<string, unknown>)[field] = merged;
  }

  for (const field of SCALAR_FIELDS) {
    const cur = String((keep as unknown as Record<string, unknown>)[field] ?? '');
    const other = String((drop as unknown as Record<string, unknown>)[field] ?? '');
    if (!cur.trim() && other.trim()) {
      (keep as unknown as Record<string, unknown>)[field] = other.trim();
    }
  }

  if ((keep.pages == null || keep.pages <= 0) && drop.pages != null && drop.pages > 0) {
    keep.pages = drop.pages;
  }
  if ((keep.rating == null || keep.rating <= 0) && drop.rating != null && drop.rating > 0) {
    keep.rating = drop.rating;
  } else if (
    typeof keep.rating === 'number' &&
    typeof drop.rating === 'number' &&
    drop.rating > keep.rating
  ) {
    keep.rating = drop.rating;
  }

  // Prefer "more read" status when keep is still want-to-read.
  const rank: Record<string, number> = {
    'want-to-read': 1,
    wishlist: 1,
    'currently-reading': 2,
    arc: 2,
    'beta-read': 2,
    read: 3,
    dnf: 2,
  };
  if ((rank[drop.status] ?? 0) > (rank[keep.status] ?? 0)) {
    keep.status = drop.status;
  }

  if (!keep.finishedDate && drop.finishedDate) keep.finishedDate = drop.finishedDate;
  if (!keep.startedDate && drop.startedDate) keep.startedDate = drop.startedDate;
  if (!keep.addedDate && drop.addedDate) keep.addedDate = drop.addedDate;
  if (!keep.publicationDate && drop.publicationDate) keep.publicationDate = drop.publicationDate;

  keep.copies = mergeCopies(keep.copies, drop.copies);
  keep.recommendationHistory = mergeHistory(keep.recommendationHistory, drop.recommendationHistory);

  if (keep.contentLinks || drop.contentLinks) {
    const k = keep.contentLinks ?? {};
    const d = drop.contentLinks ?? {};
    keep.contentLinks = {
      goodreads: preferNonEmpty(k.goodreads, d.goodreads),
      amazon: preferNonEmpty(k.amazon, d.amazon),
      blog: preferNonEmpty(k.blog, d.blog),
      instagram: preferNonEmpty(k.instagram, d.instagram),
      linkedin: preferNonEmpty(k.linkedin, d.linkedin),
      youtube: preferNonEmpty(k.youtube, d.youtube),
      newsletter: preferNonEmpty(k.newsletter, d.newsletter),
    };
  }

  if (!keep.author && drop.author) {
    keep.author = drop.author;
    keep.authorSlug = drop.authorSlug;
  }

  await keep.save();
  await LibraryBook.findByIdAndDelete(dropId);
  return { book: keep };
}

function normalizeTitleAuthor(title: string, author: string): string {
  return `${title}||${author}`
    .toLowerCase()
    .replace(/[^a-z0-9|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export { normalizeTitleAuthor };

export type DuplicateGroup = {
  key: string;
  reason: 'isbn' | 'title-author';
  books: {
    _id: string;
    title: string;
    author: string;
    isbn?: string;
    status: string;
    rating?: number;
    coverImage?: string;
    timesRecommended: number;
    fieldCount: number;
  }[];
};

function fieldRichness(b: {
  genres?: string[];
  themes?: string[];
  tags?: string[];
  personalNotes?: string;
  oneLineRecommendation?: string;
  copies?: unknown[];
  recommendationHistory?: unknown[];
  description?: string;
}): number {
  let n = 0;
  n += (b.genres?.length ?? 0) > 0 ? 1 : 0;
  n += (b.themes?.length ?? 0) > 0 ? 1 : 0;
  n += (b.tags?.length ?? 0) > 0 ? 1 : 0;
  n += b.personalNotes ? 1 : 0;
  n += b.oneLineRecommendation ? 1 : 0;
  n += (b.copies?.length ?? 0) > 0 ? 1 : 0;
  n += (b.recommendationHistory?.length ?? 0) > 0 ? 2 : 0;
  n += b.description ? 1 : 0;
  return n;
}

/** Find likely duplicate groups by ISBN or normalized title+author. */
export async function findDuplicateBookGroups(): Promise<DuplicateGroup[]> {
  const books = await LibraryBook.find({})
    .select(
      'title author isbn status rating coverImage genres themes tags personalNotes oneLineRecommendation copies recommendationHistory description'
    )
    .lean();

  const byIsbn = new Map<string, typeof books>();
  const byTitleAuthor = new Map<string, typeof books>();

  for (const b of books) {
    const isbn = (b.isbn || '').replace(/[^0-9Xx]/g, '');
    if (isbn.length >= 10) {
      const list = byIsbn.get(isbn) ?? [];
      list.push(b);
      byIsbn.set(isbn, list);
    }
    const key = normalizeTitleAuthor(b.title || '', b.author || '');
    if (key.length > 3) {
      const list = byTitleAuthor.get(key) ?? [];
      list.push(b);
      byTitleAuthor.set(key, list);
    }
  }

  const seenIds = new Set<string>();
  const groups: DuplicateGroup[] = [];

  const pushGroup = (
    reason: 'isbn' | 'title-author',
    key: string,
    list: typeof books
  ) => {
    if (list.length < 2) return;
    const ids = list.map((b) => String(b._id));
    if (ids.some((id) => seenIds.has(id))) return;
    ids.forEach((id) => seenIds.add(id));
    groups.push({
      key,
      reason,
      books: list.map((b) => ({
        _id: String(b._id),
        title: b.title,
        author: b.author || '',
        isbn: b.isbn || undefined,
        status: b.status,
        rating: b.rating,
        coverImage: b.coverImage || undefined,
        timesRecommended: b.recommendationHistory?.length ?? 0,
        fieldCount: fieldRichness(b),
      })),
    });
  };

  for (const [isbn, list] of byIsbn) pushGroup('isbn', isbn, list);
  for (const [key, list] of byTitleAuthor) pushGroup('title-author', key, list);

  groups.sort((a, b) => b.books.length - a.books.length);
  return groups;
}
