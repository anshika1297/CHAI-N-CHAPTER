import type { BookSourceRef, CatalogBook } from '@/lib/books/catalog';
import type { ResolvedShopBook } from '@/lib/shop/types';

/** Future canonical book entity URL — directory lives at /books; [slug] pages planned. */
export function bookPath(slug: string): string {
  return `/books/${encodeURIComponent(slug.trim().toLowerCase())}`;
}

/** Directory index — live at /books. */
export function booksDirectoryPath(): string {
  return '/books';
}

export type BookRegistryEntry = {
  bookSlug: string;
  title: string;
  author: string;
  genre?: string;
  coverImage?: string;
  isbn?: string;
  purchaseLinks: ResolvedShopBook['purchaseLinks'];
  goodreadsUrl?: string;
  sources: CatalogBook['sourceRefs'];
  tags: string[];
};

/** Map API catalog books by slug (preferred for /books/[slug] hub). */
export function indexCatalogBooks(books: CatalogBook[]): Map<string, BookRegistryEntry> {
  const map = new Map<string, BookRegistryEntry>();
  for (const book of books) {
    map.set(book.bookSlug, {
      bookSlug: book.bookSlug,
      title: book.title,
      author: book.author,
      genre: book.genre,
      coverImage: book.coverImage,
      isbn: book.isbn,
      purchaseLinks: book.purchaseLinks as ResolvedShopBook['purchaseLinks'],
      goodreadsUrl: book.goodreadsUrl,
      sources: book.sourceRefs,
      tags: book.tags,
    });
  }
  return map;
}

/** Legacy: aggregate resolved shop books from editorial pages at build time. */
export function indexBooksBySlug(books: ResolvedShopBook[]): Map<string, BookRegistryEntry> {
  const map = new Map<string, BookRegistryEntry>();
  for (const book of books) {
    const key = book.bookSlug?.trim();
    if (!key) continue;
    const ref: BookSourceRef = {
      contentType: book.editorial.kind === 'review' ? 'blog' : book.editorial.kind,
      contentSlug: book.editorial.slug,
      contentTitle: book.editorial.title,
      href: book.editorial.href,
    };
    const hit = map.get(key);
    if (hit) {
      hit.sources.push(ref);
      continue;
    }
    map.set(key, {
      bookSlug: key,
      title: book.title,
      author: book.author,
      genre: book.genre,
      coverImage: book.coverImage,
      isbn: book.isbn,
      purchaseLinks: book.purchaseLinks,
      goodreadsUrl: book.goodreadsUrl,
      sources: [ref],
      tags: book.tags,
    });
  }
  return map;
}
