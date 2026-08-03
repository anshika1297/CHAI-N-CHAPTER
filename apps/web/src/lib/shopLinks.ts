import { parseShopLinksFromRaw, sanitizeShopLinksForSave as sanitizeLinks } from '@/lib/shop/sanitize';
import type { ShopBookMeta, ShopLinkChannel, ShopPurchaseLink } from '@/lib/shop/types';

/** @deprecated Use ShopPurchaseLink — kept for existing imports */
export type ShopLink = ShopPurchaseLink;
export type { ShopBookMeta, ShopLinkChannel };

const GOODREADS_RE = /goodreads\.com/i;
const BUY_URL_RE =
  /amazon\.|amzn\.|flipkart\.|bookshop\.org|books\.google|penguinrandomhouse|harpercollins|simonandschuster|macmillan|audible\.|kobo\.|barnesandnoble/i;

export function isGoodreadsUrl(url: string): boolean {
  return GOODREADS_RE.test(url.trim());
}

/** Historical CMS data: `bookLink` sometimes held Amazon/retailer URLs before shop links existed. */
export function legacyBuyLinkFromBookLink(bookLink: string | undefined | null): string | undefined {
  const u = (bookLink ?? '').trim();
  if (!u || isGoodreadsUrl(u)) return undefined;
  if (BUY_URL_RE.test(u)) return u;
  return undefined;
}

export function reviewGoodreadsLink(post: Record<string, unknown>): string | undefined {
  const bookLink = typeof post.bookLink === 'string' ? post.bookLink.trim() : '';
  if (bookLink && isGoodreadsUrl(bookLink)) return bookLink;
  return undefined;
}

export function resolveReviewShopLinks(post: Record<string, unknown>): ShopPurchaseLink[] {
  const explicitBuy = typeof post.buyLink === 'string' ? post.buyLink : '';
  const legacyBuy = explicitBuy.trim() || legacyBuyLinkFromBookLink(typeof post.bookLink === 'string' ? post.bookLink : '');
  return normalizeShopLinks(post.shopLinks, legacyBuy || undefined);
}

export function listBookGoodreadsLink(book: Record<string, unknown>): string | undefined {
  const bookLink = typeof book.bookLink === 'string' ? book.bookLink.trim() : '';
  if (bookLink && isGoodreadsUrl(bookLink)) return bookLink;
  const gr = typeof book.goodreadsLink === 'string' ? book.goodreadsLink.trim() : '';
  return gr || undefined;
}

export function resolveListBookShopLinks(book: Record<string, unknown>): ShopPurchaseLink[] {
  const explicitBuy = typeof book.buyLink === 'string' ? book.buyLink : '';
  const legacyBuy =
    explicitBuy.trim() || legacyBuyLinkFromBookLink(typeof book.bookLink === 'string' ? book.bookLink : '');
  return normalizeShopLinks(book.shopLinks, legacyBuy || undefined);
}

export function recommendationHasShopLinks(item: Record<string, unknown>): boolean {
  const books = Array.isArray(item.books) ? item.books : [];
  return books.some((b) => b && typeof b === 'object' && hasShopLinks(resolveListBookShopLinks(b as Record<string, unknown>)));
}

export function resolveSpotlightBookShopLinks(book: Record<string, unknown>): ShopPurchaseLink[] {
  const buyLink = typeof book.buyLink === 'string' ? book.buyLink : '';
  return normalizeShopLinks(book.shopLinks, buyLink.trim() || undefined);
}

export function spotlightHasShopLinks(spotlight: Record<string, unknown>): boolean {
  const books = Array.isArray(spotlight.featuredBooks) ? spotlight.featuredBooks : [];
  return books.some(
    (b) => b && typeof b === 'object' && hasShopLinks(resolveSpotlightBookShopLinks(b as Record<string, unknown>))
  );
}

export function normalizeShopLinks(raw: unknown, legacyBuyLink?: string): ShopPurchaseLink[] {
  return parseShopLinksFromRaw(raw, legacyBuyLink);
}

export function hasShopLinks(links: ShopPurchaseLink[] | undefined): boolean {
  return Boolean(links?.length);
}

export function sanitizeShopLinksForSave(raw: ShopPurchaseLink[] | undefined): ShopPurchaseLink[] {
  return sanitizeLinks(raw);
}

export function shopPath(
  kind: 'review' | 'recommendations' | 'author-spotlight',
  slug: string
): string {
  const enc = encodeURIComponent(slug.trim());
  if (kind === 'review') return `/shop/review/${enc}`;
  if (kind === 'recommendations') return `/shop/recommendations/${enc}`;
  return `/shop/author-spotlight/${enc}`;
}
