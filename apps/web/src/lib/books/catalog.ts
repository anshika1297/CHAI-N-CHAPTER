import { getFetchBaseUrl } from '@/lib/apiBase';
import type { AuthorSpotlightDto, AuthorSpotlightFeaturedBook } from '@/lib/api';
import { parseShopBookMeta } from '@/lib/shop/sanitize';
import { suggestBookSlug } from '@/lib/shop/slugify';
import { bookPath } from '@/lib/books/registry';

export type BookSourceRef = {
  contentType: 'blog' | 'recommendations' | 'author-spotlight';
  contentSlug: string;
  contentTitle: string;
  href: string;
  anchor?: string;
};

export type CatalogBook = {
  bookSlug: string;
  title: string;
  author: string;
  coverImage?: string;
  genre?: string;
  description?: string;
  isbn?: string;
  purchaseLinks: { label: string; url: string; channel?: string }[];
  goodreadsUrl?: string;
  sourceRefs: BookSourceRef[];
  tags: string[];
  genres?: string[];
  referenceCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

/** Resolve catalog slug for a spotlight featured book (matches API sync logic). */
export function featuredBookSlug(
  book: AuthorSpotlightFeaturedBook,
  spotlightAuthorName?: string
): string | null {
  const shopBook = parseShopBookMeta(book.shopBook);
  const title = shopBook?.title || str(book.title);
  const author = shopBook?.author || spotlightAuthorName || '';
  const explicit = shopBook?.bookSlug;
  if (explicit) return explicit;
  if (!title) return null;
  return suggestBookSlug(title, author);
}

export function featuredBookSlugsFromSpotlight(spotlight: AuthorSpotlightDto): string[] {
  const slugs: string[] = [];
  const seen = new Set<string>();
  for (const book of spotlight.featuredBooks ?? []) {
    const slug = featuredBookSlug(book, spotlight.name);
    if (slug && !seen.has(slug)) {
      seen.add(slug);
      slugs.push(slug);
    }
  }
  return slugs;
}

export function catalogBookHref(book: CatalogBook): string {
  return bookPath(book.bookSlug);
}

export async function fetchCatalogBooks(slugs: string[]): Promise<CatalogBook[]> {
  const unique = [...new Set(slugs.map((s) => s.trim().toLowerCase()).filter(Boolean))];
  if (!unique.length) return [];
  try {
    const params = new URLSearchParams({ slugs: unique.join(','), limit: String(unique.length) });
    const res = await fetch(`${getFetchBaseUrl()}/api/books?${params}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { books?: CatalogBook[] };
    const books = Array.isArray(data.books) ? data.books : [];
    const order = new Map(unique.map((s, i) => [s, i]));
    return books.sort((a, b) => (order.get(a.bookSlug) ?? 99) - (order.get(b.bookSlug) ?? 99));
  } catch {
    return [];
  }
}

export async function fetchCatalogBook(bookSlug: string): Promise<CatalogBook | null> {
  const slug = bookSlug.trim().toLowerCase();
  if (!slug) return null;
  try {
    const res = await fetch(`${getFetchBaseUrl()}/api/books/${encodeURIComponent(slug)}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { book?: CatalogBook };
    return data.book ?? null;
  } catch {
    return null;
  }
}
