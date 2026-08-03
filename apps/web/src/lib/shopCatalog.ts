import {
  getAuthorSpotlightBySlugPublic,
  getAuthorSpotlightsPublic,
  getBlogPosts,
  getRecommendations,
} from '@/lib/api';
import { readTags } from '@/lib/contentFields';
import { isContentPublished } from '@/lib/contentPublish';
import {
  resolveShopBookFromListItem,
  resolveShopBookFromReview,
  resolveShopBookFromSpotlightItem,
} from '@/lib/shop/resolve';
import type { ResolvedShopBook, ShopPurchaseLink } from '@/lib/shop/types';
import { hasShopLinks, shopPath } from '@/lib/shopLinks';

export type ShopHubEntry = {
  kind: 'review' | 'recommendations' | 'author-spotlight';
  slug: string;
  title: string;
  subtitle?: string;
  image?: string;
  href: string;
  bookCount: number;
};

function record(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

export type ShopReviewBook = {
  bookTitle: string;
  bookAuthor: string;
  coverImage?: string;
  goodreadsLink?: string;
  shopLinks: ShopPurchaseLink[];
  editorialTitle: string;
  editorialHref: string;
  genre?: string;
  isbn?: string;
  bookSlug?: string;
  tags: string[];
};

export type ShopListBook = {
  id: string;
  title: string;
  author: string;
  image?: string;
  goodreadsLink?: string;
  shopLinks: ShopPurchaseLink[];
  genre?: string;
  isbn?: string;
  bookSlug?: string;
  tags: string[];
};

export type ShopSpotlightBook = {
  anchorId: string;
  title: string;
  author?: string;
  coverImage?: string;
  description?: string;
  goodreadsLink?: string;
  shopLinks: ShopPurchaseLink[];
  blogReviewLink?: string;
  genre?: string;
  isbn?: string;
  bookSlug?: string;
  tags: string[];
};

function fromResolved(r: ResolvedShopBook, extras?: { id?: string; anchorId?: string; description?: string; blogReviewLink?: string }): ShopReviewBook & ShopListBook & ShopSpotlightBook {
  return {
    id: extras?.id ?? r.bookSlug ?? r.title,
    anchorId: extras?.anchorId ?? r.bookSlug ?? 'book',
    bookTitle: r.title,
    bookAuthor: r.author,
    title: r.title,
    author: r.author,
    coverImage: r.coverImage,
    image: r.coverImage,
    goodreadsLink: r.goodreadsUrl,
    shopLinks: r.purchaseLinks,
    editorialTitle: r.editorial.title,
    editorialHref: r.editorial.href,
    genre: r.genre,
    isbn: r.isbn,
    bookSlug: r.bookSlug,
    tags: r.tags,
    description: extras?.description,
    blogReviewLink: extras?.blogReviewLink,
  };
}

export async function getShopHubEntries(): Promise<ShopHubEntry[]> {
  const entries: ShopHubEntry[] = [];

  try {
    const { posts } = await getBlogPosts({ limit: 500, sort: 'newest' });
    for (const raw of posts) {
      const p = record(raw);
      if (!p || !isContentPublished(p as { isPublished?: boolean })) continue;
      const slug = String(p.slug ?? '').trim();
      const resolved = slug ? resolveShopBookFromReview(p, slug) : null;
      if (!slug || !resolved) continue;
      entries.push({
        kind: 'review',
        slug,
        title: resolved.title,
        subtitle: String(p.title ?? '').trim() || undefined,
        image: resolved.coverImage,
        href: shopPath('review', slug),
        bookCount: 1,
      });
    }
  } catch {
    /* skip */
  }

  try {
    const { items } = await getRecommendations({ limit: 500, sort: 'newest' });
    for (const raw of items) {
      const p = record(raw);
      if (!p || !isContentPublished(p as { isPublished?: boolean })) continue;
      const slug = String(p.slug ?? '').trim();
      if (!slug) continue;
      const tags = readTags(p);
      const editorial = { kind: 'recommendations' as const, slug, title: String(p.title ?? ''), href: `/recommendations/${slug}` };
      const books = Array.isArray(p.books) ? p.books : [];
      let withLinks = 0;
      for (const b of books) {
        const book = record(b);
        if (book && resolveShopBookFromListItem(book, editorial, tags)) withLinks++;
      }
      if (withLinks === 0) continue;
      entries.push({
        kind: 'recommendations',
        slug,
        title: String(p.title ?? 'Recommendations'),
        subtitle: `${withLinks} book${withLinks === 1 ? '' : 's'} with buy links`,
        image: typeof p.image === 'string' ? p.image : undefined,
        href: shopPath('recommendations', slug),
        bookCount: withLinks,
      });
    }
  } catch {
    /* skip */
  }

  try {
    const { spotlights } = await getAuthorSpotlightsPublic({ next: { revalidate: 60 } });
    await Promise.all(
      spotlights.map(async (s) => {
        try {
          const spotlight = await getAuthorSpotlightBySlugPublic(s.slug, { next: { revalidate: 60 } });
          if (!spotlight) return;
          const tags = readTags(spotlight);
          const editorial = {
            kind: 'author-spotlight' as const,
            slug: s.slug,
            title: spotlight.name,
            href: `/author-spotlight/${s.slug}`,
          };
          let withLinks = 0;
          for (const [i, b] of (spotlight.featuredBooks ?? []).entries()) {
            if (resolveShopBookFromSpotlightItem(b as unknown as Record<string, unknown>, editorial, tags, i)) withLinks++;
          }
          if (withLinks === 0) return;
          entries.push({
            kind: 'author-spotlight',
            slug: s.slug,
            title: spotlight.name,
            subtitle: `${withLinks} featured book${withLinks === 1 ? '' : 's'}`,
            image: spotlight.profileImage || spotlight.ogImage,
            href: shopPath('author-spotlight', s.slug),
            bookCount: withLinks,
          });
        } catch {
          /* skip */
        }
      })
    );
  } catch {
    /* skip */
  }

  return entries;
}

export function parseShopReviewFromPost(post: Record<string, unknown>, slug: string): ShopReviewBook | null {
  const r = resolveShopBookFromReview(post, slug);
  if (!r) return null;
  const mapped = fromResolved(r);
  return {
    bookTitle: mapped.bookTitle,
    bookAuthor: mapped.bookAuthor,
    coverImage: mapped.coverImage,
    goodreadsLink: mapped.goodreadsLink,
    shopLinks: mapped.shopLinks,
    editorialTitle: mapped.editorialTitle,
    editorialHref: mapped.editorialHref,
    genre: mapped.genre,
    isbn: mapped.isbn,
    bookSlug: mapped.bookSlug,
    tags: mapped.tags,
  };
}

export function parseShopBooksFromRecommendation(item: Record<string, unknown>): ShopListBook[] {
  const slug = String(item.slug ?? '').trim();
  const tags = readTags(item);
  const editorial = {
    kind: 'recommendations' as const,
    slug,
    title: String(item.title ?? ''),
    href: `/recommendations/${slug}`,
  };
  const books = Array.isArray(item.books) ? item.books : [];
  const out: ShopListBook[] = [];
  for (const raw of books) {
    const b = record(raw);
    if (!b) continue;
    const r = resolveShopBookFromListItem(b, editorial, tags);
    if (!r) continue;
    const mapped = fromResolved(r, { id: String(b.id ?? out.length) });
    out.push({
      id: mapped.id,
      title: mapped.title,
      author: mapped.author,
      image: mapped.image,
      goodreadsLink: mapped.goodreadsLink,
      shopLinks: mapped.shopLinks,
      genre: mapped.genre,
      isbn: mapped.isbn,
      bookSlug: mapped.bookSlug,
      tags: mapped.tags,
    });
  }
  return out;
}

export function parseShopBooksFromSpotlight(spotlight: {
  slug?: string;
  name?: string;
  featuredBooks?: Array<Record<string, unknown> | object>;
  tags?: string[];
  seoKeywords?: string[];
}): ShopSpotlightBook[] {
  const slug = String(spotlight.slug ?? '').trim();
  const tags = readTags(spotlight as Record<string, unknown>);
  const editorial = {
    kind: 'author-spotlight' as const,
    slug,
    title: String(spotlight.name ?? ''),
    href: `/author-spotlight/${slug}`,
  };
  const out: ShopSpotlightBook[] = [];
  for (const [i, b] of (spotlight.featuredBooks ?? []).entries()) {
    const book = b && typeof b === 'object' ? (b as Record<string, unknown>) : null;
    if (!book) continue;
    const r = resolveShopBookFromSpotlightItem(book, editorial, tags, i);
    if (!r) continue;
    const mapped = fromResolved(r, {
      anchorId: `book-${i}`,
      description: String(book.description ?? '').trim() || undefined,
      blogReviewLink: String(book.blogReviewLink ?? '').trim() || undefined,
    });
    out.push({
      anchorId: mapped.anchorId,
      title: mapped.title,
      author: mapped.author || undefined,
      coverImage: mapped.coverImage,
      description: mapped.description,
      goodreadsLink: mapped.goodreadsLink,
      shopLinks: mapped.shopLinks,
      blogReviewLink: mapped.blogReviewLink,
      genre: mapped.genre,
      isbn: mapped.isbn,
      bookSlug: mapped.bookSlug,
      tags: mapped.tags,
    });
  }
  return out;
}

/** @deprecated use resolve helpers — kept for hasShopLinks checks */
export { hasShopLinks };
