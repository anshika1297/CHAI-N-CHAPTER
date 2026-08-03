import type { IAuthorSpotlight } from '../models/AuthorSpotlight.js';
import {
  legacyBuyLinkFromBookLink,
  parseShopBookMeta,
  parseShopLinksFromRaw,
  readTags,
  type ShopPurchaseLink,
} from '../utils/shopParse.js';
import { suggestBookSlug } from '../utils/shopSlugify.js';
import type { IBookSourceRef } from '../models/Book.js';
import { primaryGenre, readGenresFromContent } from '../utils/genres.js';

export type ExtractedBook = {
  bookSlug: string;
  title: string;
  author: string;
  coverImage?: string;
  genre?: string;
  description?: string;
  isbn?: string;
  purchaseLinks: ShopPurchaseLink[];
  goodreadsUrl?: string;
  sourceRef: IBookSourceRef;
  tags: string[];
  genres?: string[];
};

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function record(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function mergeBookFields(
  editorial: { title: string; author: string; genre?: string; coverImage?: string; description?: string },
  shopBook: ReturnType<typeof parseShopBookMeta>,
  fallbackAuthor?: string
): Pick<ExtractedBook, 'bookSlug' | 'title' | 'author' | 'genre' | 'coverImage' | 'description' | 'isbn'> {
  const title = shopBook.title || editorial.title;
  const author = shopBook.author || editorial.author || fallbackAuthor || '';
  const bookSlug = shopBook.bookSlug || (title ? suggestBookSlug(title, author) : '');
  return {
    bookSlug,
    title,
    author,
    genre: shopBook.genre || editorial.genre,
    coverImage: shopBook.coverImage || editorial.coverImage,
    description: editorial.description,
    isbn: shopBook.isbn,
  };
}

function goodreadsFromLinks(links: ShopPurchaseLink[], fallback?: string): string | undefined {
  const fromChannel = links.find((l) => l.channel === 'goodreads')?.url;
  return fromChannel || fallback || undefined;
}

function refKey(ref: IBookSourceRef): string {
  return `${ref.contentType}:${ref.contentSlug}:${ref.anchor ?? ''}`;
}

export function extractBookFromReview(post: Record<string, unknown>): ExtractedBook | null {
  const slug = str(post.slug);
  if (!slug) return null;

  const explicitBuy = str(post.buyLink);
  const legacyBuy = explicitBuy || legacyBuyLinkFromBookLink(str(post.bookLink)) || '';
  const purchaseLinks = parseShopLinksFromRaw(post.shopLinks, legacyBuy || undefined);
  const shopBook = parseShopBookMeta(post.shopBook);

  const contentGenres = readGenresFromContent(post);
  const merged = mergeBookFields(
    {
      title: str(post.bookTitle) || str(post.title) || 'Book',
      author: str(post.bookAuthor),
      genre: primaryGenre(contentGenres) || str(post.category),
      coverImage: str(post.image),
    },
    shopBook
  );

  if (!merged.bookSlug || !merged.title) return null;

  const bookLink = str(post.bookLink);
  const goodreads = goodreadsFromLinks(purchaseLinks, GOODREADS(bookLink) ? bookLink : undefined);

  return {
    ...merged,
    purchaseLinks,
    goodreadsUrl: goodreads,
    tags: readTags(post),
    genres: [
      ...new Set([
        ...(shopBook.genre ? [shopBook.genre] : []),
        ...contentGenres,
        ...(merged.genre ? [merged.genre] : []),
      ]),
    ].filter(Boolean),
    sourceRef: {
      contentType: 'blog',
      contentSlug: slug,
      contentTitle: str(post.title) || slug,
      href: `/blog/${slug}`,
    },
  };
}

function GOODREADS(url: string): boolean {
  return /goodreads\.com/i.test(url);
}

export function extractBooksFromRecommendationList(item: Record<string, unknown>): ExtractedBook[] {
  const listSlug = str(item.slug);
  if (!listSlug) return [];

  const listTitle = str(item.title) || listSlug;
  const listTags = readTags(item);
  const listGenres = readGenresFromContent(item);
  const books = Array.isArray(item.books) ? item.books : [];
  const out: ExtractedBook[] = [];

  for (const raw of books) {
    const book = record(raw);
    if (!book) continue;
    const explicitBuy = str(book.buyLink);
    const legacyBuy = explicitBuy || legacyBuyLinkFromBookLink(str(book.bookLink)) || '';
    const purchaseLinks = parseShopLinksFromRaw(book.shopLinks, legacyBuy || undefined);
    const shopBook = parseShopBookMeta(book.shopBook);
    const merged = mergeBookFields(
      {
        title: str(book.title) || 'Book',
        author: str(book.author),
        genre: primaryGenre(listGenres) || shopBook.genre,
        coverImage: str(book.image),
        description: str(book.description),
      },
      shopBook
    );
    if (!merged.bookSlug || !merged.title) continue;

    const bookLink = str(book.bookLink);
    out.push({
      ...merged,
      purchaseLinks,
      goodreadsUrl: goodreadsFromLinks(purchaseLinks, GOODREADS(bookLink) ? bookLink : undefined),
      tags: listTags,
      genres: [
        ...new Set([
          ...listGenres,
          ...(shopBook.genre ? [shopBook.genre] : []),
          ...(merged.genre ? [merged.genre] : []),
        ]),
      ].filter(Boolean),
      sourceRef: {
        contentType: 'recommendations',
        contentSlug: listSlug,
        contentTitle: listTitle,
        href: `/recommendations/${listSlug}`,
      },
    });
  }
  return out;
}

export function extractBooksFromSpotlight(
  spotlight: Pick<
    IAuthorSpotlight,
    'slug' | 'name' | 'featuredBooks' | 'tags' | 'genres'
  >
): ExtractedBook[] {
  const spotlightSlug = str(spotlight.slug);
  if (!spotlightSlug) return [];

  const listTags = [
    ...(Array.isArray(spotlight.tags) ? spotlight.tags.map((t) => String(t).trim().toLowerCase()) : []),
    ...(Array.isArray(spotlight.genres) ? spotlight.genres.map((g) => String(g).trim().toLowerCase()) : []),
  ].filter(Boolean);

  const books = Array.isArray(spotlight.featuredBooks) ? spotlight.featuredBooks : [];
  const out: ExtractedBook[] = [];

  books.forEach((raw, index) => {
    const book = raw as unknown as Record<string, unknown>;
    const purchaseLinks = parseShopLinksFromRaw(book.shopLinks, str(book.buyLink) || undefined);
    const shopBook = parseShopBookMeta(book.shopBook);
    const merged = mergeBookFields(
      {
        title: str(book.title) || 'Book',
        author: shopBook.author || '',
        coverImage: str(book.coverImage),
        description: str(book.description),
        genre:
          shopBook.genre ||
          (spotlight.genres?.[0] ? String(spotlight.genres[0]) : undefined),
      },
      shopBook,
      str(spotlight.name)
    );
    const spotlightGenres = [
      ...(Array.isArray(spotlight.genres) ? spotlight.genres.map((g) => String(g).trim()) : []),
    ];
    if (!merged.bookSlug || !merged.title) return;

    out.push({
      ...merged,
      purchaseLinks,
      goodreadsUrl: goodreadsFromLinks(purchaseLinks, str(book.goodreadsLink) || undefined),
      tags: listTags,
      genres: [
        ...new Set([
          ...spotlightGenres,
          ...(shopBook.genre ? [shopBook.genre] : []),
          ...(merged.genre ? [merged.genre] : []),
        ]),
      ].filter(Boolean),
      sourceRef: {
        contentType: 'author-spotlight',
        contentSlug: spotlightSlug,
        contentTitle: str(spotlight.name) || spotlightSlug,
        href: `/author-spotlight/${spotlightSlug}`,
        anchor: `book-${index}`,
      },
    });
  });

  return out;
}

export { refKey };
