import { readTags } from '@/lib/contentFields';
import { tagToSlug } from '@/lib/tags/normalize';
import {
  legacyBuyLinkFromBookLink,
  listBookGoodreadsLink,
  reviewGoodreadsLink,
} from '@/lib/shopLinks';
import { suggestBookSlug } from './slugify';
import { parseShopBookMeta, parseShopLinksFromRaw } from './sanitize';
import type { ResolvedShopBook, ShopBookMeta, ShopEditorialRef, ShopPurchaseLink } from './types';

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function record(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function mergeMeta(
  editorial: { title: string; author: string; genre?: string; coverImage?: string },
  shopBook?: ShopBookMeta
): Pick<ResolvedShopBook, 'title' | 'author' | 'genre' | 'coverImage' | 'isbn' | 'bookSlug'> {
  const title = str(shopBook?.title) || editorial.title;
  const author = str(shopBook?.author) || editorial.author;
  const genre = str(shopBook?.genre) || editorial.genre;
  const coverImage = str(shopBook?.coverImage) || editorial.coverImage;
  const isbn = str(shopBook?.isbn);
  const bookSlug = str(shopBook?.bookSlug) || (title ? suggestBookSlug(title, author) : undefined);
  return { title, author, genre: genre || undefined, coverImage: coverImage || undefined, isbn: isbn || undefined, bookSlug };
}

function goodreadsFromLinks(links: ShopPurchaseLink[], fallback?: string): string | undefined {
  const fromChannel = links.find((l) => l.channel === 'goodreads')?.url;
  if (fromChannel) return fromChannel;
  return fallback;
}

export function resolveShopBookFromReview(post: Record<string, unknown>, slug: string): ResolvedShopBook | null {
  const explicitBuy = str(post.buyLink);
  const legacyBuy = explicitBuy || legacyBuyLinkFromBookLink(str(post.bookLink)) || '';
  const purchaseLinks = parseShopLinksFromRaw(post.shopLinks, legacyBuy || undefined);
  if (!purchaseLinks.length) return null;

  const shopBook = parseShopBookMeta(post.shopBook);
  const merged = mergeMeta(
    {
      title: str(post.bookTitle) || str(post.title) || 'Book',
      author: str(post.bookAuthor),
      genre: str(post.category),
      coverImage: str(post.image),
    },
    shopBook
  );

  const editorial: ShopEditorialRef = {
    kind: 'review',
    slug,
    title: str(post.title) || slug,
    href: `/blog/${slug}`,
  };

  return {
    ...merged,
    purchaseLinks,
    goodreadsUrl: goodreadsFromLinks(purchaseLinks, reviewGoodreadsLink(post)),
    editorial,
    tags: readTags(post),
  };
}

export function resolveShopBookFromListItem(
  book: Record<string, unknown>,
  editorial: ShopEditorialRef,
  listTags: string[]
): ResolvedShopBook | null {
  const explicitBuy = str(book.buyLink);
  const legacyBuy = explicitBuy || legacyBuyLinkFromBookLink(str(book.bookLink)) || '';
  const purchaseLinks = parseShopLinksFromRaw(book.shopLinks, legacyBuy || undefined);
  if (!purchaseLinks.length) return null;

  const shopBook = parseShopBookMeta(book.shopBook);
  const merged = mergeMeta(
    {
      title: str(book.title) || 'Book',
      author: str(book.author),
      coverImage: str(book.image),
    },
    shopBook
  );

  return {
    ...merged,
    purchaseLinks,
    goodreadsUrl: goodreadsFromLinks(purchaseLinks, listBookGoodreadsLink(book)),
    editorial,
    tags: listTags,
  };
}

export function resolveShopBookFromSpotlightItem(
  book: Record<string, unknown>,
  editorial: ShopEditorialRef,
  listTags: string[],
  anchorIndex: number
): ResolvedShopBook | null {
  const purchaseLinks = parseShopLinksFromRaw(book.shopLinks, str(book.buyLink) || undefined);
  if (!purchaseLinks.length) return null;

  const shopBook = parseShopBookMeta(book.shopBook);
  const merged = mergeMeta(
    {
      title: str(book.title) || 'Book',
      author: '',
      coverImage: str(book.coverImage),
    },
    shopBook
  );

  const goodreads = goodreadsFromLinks(purchaseLinks, str(book.goodreadsLink) || undefined);

  return {
    ...merged,
    purchaseLinks,
    goodreadsUrl: goodreads,
    editorial: { ...editorial, href: `${editorial.href}#book-${anchorIndex}` },
    tags: listTags,
  };
}

export function recommendationHasResolvedShop(item: Record<string, unknown>): boolean {
  const books = Array.isArray(item.books) ? item.books : [];
  const tags = readTags(item);
  const editorial: ShopEditorialRef = {
    kind: 'recommendations',
    slug: str(item.slug),
    title: str(item.title),
    href: `/recommendations/${str(item.slug)}`,
  };
  return books.some((b) => {
    const book = record(b);
    return book && resolveShopBookFromListItem(book, editorial, tags);
  });
}

export function genreTagHref(genre: string | undefined): string | undefined {
  if (!genre?.trim()) return undefined;
  const slug = tagToSlug(genre);
  return slug ? `/tags/${encodeURIComponent(slug)}` : undefined;
}
