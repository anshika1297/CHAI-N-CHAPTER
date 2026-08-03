import type { AuthorSpotlightFeaturedBook } from '@/lib/api';
import { hasShopLinks, resolveSpotlightBookShopLinks, shopPath } from '@/lib/shopLinks';

/** Shop URL for a featured book — anchor on author shop page when buy links exist. */
export function spotlightBookShopHref(
  spotlightSlug: string,
  book: AuthorSpotlightFeaturedBook,
  index: number
): string | null {
  const base = shopPath('author-spotlight', spotlightSlug);
  const links = hasShopLinks(resolveSpotlightBookShopLinks(book as unknown as Record<string, unknown>));
  if (links) return `${base}#book-${index}`;
  if (book.shopBook?.bookSlug?.trim()) return `${base}#book-${index}`;
  if (book.buyLink?.trim()) return `${base}#book-${index}`;
  return null;
}

export function spotlightBookHasShopEntry(
  book: AuthorSpotlightFeaturedBook
): boolean {
  return spotlightBookShopHref('x', book, 0) !== null || Boolean(book.buyLink?.trim());
}
