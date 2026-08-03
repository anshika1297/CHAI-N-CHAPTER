import { Book } from '../models/Book.js';
import { LibraryBook } from '../models/LibraryBook.js';
import { librarySlugify } from '../config/libraryEnums.js';
import { normalizeTitleAuthor } from './libraryMerge.js';

export type SiteImportBook = {
  title: string;
  slug: string;
  author: string;
  authorSlug: string;
  isbn?: string;
  genres: string[];
  coverImage?: string;
  contentLinks?: { goodreads?: string };
  /** Public catalog slug (for preview only). */
  bookSlug?: string;
  status: 'want-to-read';
};

function isbnDigits(isbn: string | undefined): string {
  return (isbn || '').replace(/\D/g, '');
}

function genresFromPublic(doc: {
  genre?: string;
  genres?: string[];
}): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const g of [...(doc.genres ?? []), doc.genre ?? '']) {
    const t = String(g ?? '').trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

/**
 * Map public Book catalog → minimal LibraryBook rows (title, author, genres + light extras).
 * Dedupes within the catalog by title+author / ISBN / slug.
 */
export async function mapSiteBooksForLibraryImport(): Promise<SiteImportBook[]> {
  const docs = await Book.find({})
    .select('bookSlug title author coverImage genre genres isbn goodreadsUrl')
    .lean();

  const out: SiteImportBook[] = [];
  const seenKeys = new Set<string>();
  const seenSlugs = new Set<string>();
  const seenIsbn = new Set<string>();

  for (const doc of docs) {
    const title = String(doc.title ?? '').trim();
    if (!title) continue;
    const author = String(doc.author ?? '').trim();
    const slug = librarySlugify(`${title}-${author || 'unknown'}`);
    const isbnRaw = String(doc.isbn ?? '').trim();
    const isbnKey = isbnDigits(isbnRaw);
    const taKey = normalizeTitleAuthor(title, author);

    if (seenSlugs.has(slug) || seenKeys.has(taKey) || (isbnKey.length >= 10 && seenIsbn.has(isbnKey))) {
      continue;
    }
    seenSlugs.add(slug);
    seenKeys.add(taKey);
    if (isbnKey.length >= 10) seenIsbn.add(isbnKey);

    const coverImage = String(doc.coverImage ?? '').trim();
    const goodreads = String(doc.goodreadsUrl ?? '').trim();
    const row: SiteImportBook = {
      title,
      slug,
      author,
      authorSlug: author ? librarySlugify(author) : '',
      genres: genresFromPublic(doc),
      status: 'want-to-read',
      bookSlug: String(doc.bookSlug ?? '').trim() || undefined,
    };
    if (isbnRaw) row.isbn = isbnRaw;
    if (coverImage) row.coverImage = coverImage;
    if (goodreads) row.contentLinks = { goodreads };
    out.push(row);
  }

  out.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
  return out;
}

/** Flag rows that already exist in Library OS (slug, ISBN, or title+author). */
export async function markSiteImportDuplicates(
  books: SiteImportBook[]
): Promise<(SiteImportBook & { isDuplicate: boolean })[]> {
  if (books.length === 0) return [];

  const existing = await LibraryBook.find({})
    .select('slug isbn title author')
    .lean();

  const slugSet = new Set(existing.map((b) => b.slug).filter(Boolean));
  const isbnSet = new Set(
    existing
      .map((b) => isbnDigits(b.isbn))
      .filter((d) => d.length >= 10)
  );
  const taSet = new Set(
    existing.map((b) => normalizeTitleAuthor(b.title || '', b.author || ''))
  );

  return books.map((b) => {
    const isbnKey = isbnDigits(b.isbn);
    const isDuplicate =
      slugSet.has(b.slug) ||
      taSet.has(normalizeTitleAuthor(b.title, b.author)) ||
      (isbnKey.length >= 10 && isbnSet.has(isbnKey));
    return { ...b, isDuplicate };
  });
}
