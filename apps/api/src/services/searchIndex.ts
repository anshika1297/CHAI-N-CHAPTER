import { AuthorSpotlight } from '../models/AuthorSpotlight.js';
import { Page } from '../models/Page.js';
import { filterPublishedPageItems } from '../utils/pageContentPublish.js';
import { readTags, slugToTagLabel, tagToSlug } from '../utils/tags.js';
import type { SearchGroup } from '../types/search.js';
import { arrayHasShopLinks, listBookHasShopLinks, reviewHasShopLinks } from '../utils/shopLinks.js';

export type SearchIndexDocument = {
  id: string;
  group: SearchGroup;
  title: string;
  subtitle?: string;
  excerpt?: string;
  href: string;
  bookTitles: string[];
  bookAuthors: string[];
  authorNames: string[];
  tags: string[];
  genres: string[];
  category?: string;
  bodyText: string;
};

const PAGE_SLUGS = ['blog', 'recommendations', 'musings'] as const;

function record(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function shopPath(kind: 'review' | 'recommendations' | 'author-spotlight', slug: string): string {
  const enc = encodeURIComponent(slug);
  if (kind === 'review') return `/shop/review/${enc}`;
  if (kind === 'recommendations') return `/shop/recommendations/${enc}`;
  return `/shop/author-spotlight/${enc}`;
}

async function loadPageItems(pageSlug: (typeof PAGE_SLUGS)[number]): Promise<Record<string, unknown>[]> {
  const doc = await Page.findOne({ slug: pageSlug }).lean();
  const content = doc?.content;
  if (!content || typeof content !== 'object') return [];
  const key = pageSlug === 'blog' ? 'posts' : 'items';
  const arr = (content as Record<string, unknown>)[key];
  if (!Array.isArray(arr)) return [];
  return filterPublishedPageItems(arr as Record<string, unknown>[]);
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function reviewDocs(raw: Record<string, unknown>): SearchIndexDocument[] {
  const slug = str(raw.slug);
  if (!slug) return [];
  const title = str(raw.title);
  const bookTitle = str(raw.bookTitle);
  const bookAuthor = str(raw.bookAuthor);
  const author = str(raw.author);
  const tags = readTags(raw);
  const category = str(raw.category);
  const excerpt = str(raw.excerpt);
  const content = stripHtml(str(raw.content));
  const bodyText = [excerpt, content, str(raw.verdict), str(raw.recommendedFor)].filter(Boolean).join(' ');

  const docs: SearchIndexDocument[] = [
    {
      id: `review:${slug}`,
      group: 'reviews',
      title: title || bookTitle || slug,
      subtitle: bookTitle && title ? bookTitle : undefined,
      excerpt: excerpt || undefined,
      href: `/blog/${slug}`,
      bookTitles: bookTitle ? [bookTitle] : [],
      bookAuthors: bookAuthor ? [bookAuthor] : [],
      authorNames: author ? [author] : [],
      tags,
      genres: category ? [category] : [],
      category: category || undefined,
      bodyText,
    },
  ];

  if (reviewHasShopLinks(raw)) {
    docs.push({
      id: `shop-review:${slug}`,
      group: 'shop',
      title: `Buy ${bookTitle || title || 'book'}`,
      subtitle: bookAuthor ? `by ${bookAuthor}` : undefined,
      excerpt: 'Where to buy',
      href: shopPath('review', slug),
      bookTitles: bookTitle ? [bookTitle] : [],
      bookAuthors: bookAuthor ? [bookAuthor] : [],
      authorNames: author ? [author] : [],
      tags,
      genres: category ? [category] : [],
      category,
      bodyText,
    });
  }

  return docs;
}

function recommendationDocs(raw: Record<string, unknown>): SearchIndexDocument[] {
  const slug = str(raw.slug);
  if (!slug) return [];
  const title = str(raw.title);
  const author = str(raw.author);
  const tags = readTags(raw);
  const category = str(raw.category);
  const excerpt = str(raw.excerpt);
  const intro = stripHtml(str(raw.intro));
  const conclusion = stripHtml(str(raw.conclusion));
  const bodyText = [excerpt, intro, conclusion, str(raw.quickAnswer)].filter(Boolean).join(' ');

  const bookTitles: string[] = [];
  const bookAuthors: string[] = [];
  const books = Array.isArray(raw.books) ? raw.books : [];
  let hasShop = false;
  for (const b of books) {
    const book = record(b);
    if (!book) continue;
    const bt = str(book.title);
    const ba = str(book.author);
    if (bt) bookTitles.push(bt);
    if (ba) bookAuthors.push(ba);
    if (listBookHasShopLinks(book)) hasShop = true;
  }

  const docs: SearchIndexDocument[] = [
    {
      id: `recommendation:${slug}`,
      group: 'recommendations',
      title: title || slug,
      excerpt: excerpt || undefined,
      href: `/recommendations/${slug}`,
      bookTitles,
      bookAuthors,
      authorNames: author ? [author] : [],
      tags,
      genres: category ? [category] : [],
      category: category || undefined,
      bodyText,
    },
  ];

  if (hasShop) {
    docs.push({
      id: `shop-recommendation:${slug}`,
      group: 'shop',
      title: `Buy books — ${title || slug}`,
      excerpt: 'Shop links for this list',
      href: shopPath('recommendations', slug),
      bookTitles,
      bookAuthors,
      authorNames: author ? [author] : [],
      tags,
      genres: category ? [category] : [],
      category,
      bodyText,
    });
  }

  return docs;
}

function musingDocs(raw: Record<string, unknown>): SearchIndexDocument[] {
  const slug = str(raw.slug);
  if (!slug) return [];
  const title = str(raw.title);
  const author = str(raw.author);
  const tags = readTags(raw);
  const category = str(raw.category);
  const themes = Array.isArray(raw.themes)
    ? (raw.themes as unknown[]).map((t) => str(t)).filter(Boolean)
    : [];
  const excerpt = str(raw.excerpt);
  const content = stripHtml(str(raw.content));
  const bodyText = [excerpt, content, str(raw.keyTakeaway)].filter(Boolean).join(' ');

  return [
    {
      id: `musing:${slug}`,
      group: 'musings',
      title: title || slug,
      excerpt: excerpt || undefined,
      href: `/musings/${slug}`,
      bookTitles: [],
      bookAuthors: [],
      authorNames: author ? [author] : [],
      tags,
      genres: [...(category ? [category] : []), ...themes],
      category: category || undefined,
      bodyText,
    },
  ];
}

function spotlightDocs(raw: Record<string, unknown>): SearchIndexDocument[] {
  const slug = str(raw.slug);
  if (!slug) return [];
  const name = str(raw.name);
  const tags = readTags(raw);
  const genres = Array.isArray(raw.genres)
    ? (raw.genres as unknown[]).map((g) => str(g)).filter(Boolean)
    : [];
  const excerpt = str(raw.tagline) || str(raw.bio).slice(0, 200);
  const bodyText = [str(raw.bio), str(raw.startHere)].filter(Boolean).join(' ');

  const bookTitles: string[] = [];
  const books = Array.isArray(raw.featuredBooks) ? raw.featuredBooks : [];
  let hasShop = false;
  for (const b of books) {
    const book = record(b);
    if (!book) continue;
    const bt = str(book.title);
    if (bt) bookTitles.push(bt);
    if (arrayHasShopLinks(book.shopLinks) || str(book.buyLink)) hasShop = true;
  }

  const docs: SearchIndexDocument[] = [
    {
      id: `spotlight:${slug}`,
      group: 'author-spotlight',
      title: name || slug,
      excerpt: excerpt || undefined,
      href: `/author-spotlight/${slug}`,
      bookTitles,
      bookAuthors: [],
      authorNames: name ? [name] : [],
      tags,
      genres,
      bodyText,
    },
  ];

  if (hasShop) {
    docs.push({
      id: `shop-spotlight:${slug}`,
      group: 'shop',
      title: `Buy books — ${name || slug}`,
      excerpt: 'Shop featured books',
      href: shopPath('author-spotlight', slug),
      bookTitles,
      bookAuthors: [],
      authorNames: name ? [name] : [],
      tags,
      genres,
      bodyText,
    });
  }

  return docs;
}

let indexCache: { at: number; docs: SearchIndexDocument[]; tagSlugs: Map<string, string> } | null = null;
const INDEX_TTL_MS = 5 * 60 * 1000;

export async function buildSearchIndex(): Promise<{
  docs: SearchIndexDocument[];
  tagSlugs: Map<string, string>;
}> {
  if (indexCache && Date.now() - indexCache.at < INDEX_TTL_MS) {
    return { docs: indexCache.docs, tagSlugs: indexCache.tagSlugs };
  }

  const docs: SearchIndexDocument[] = [];
  const tagSlugs = new Map<string, string>();

  for (const p of await loadPageItems('blog')) docs.push(...reviewDocs(p));
  for (const p of await loadPageItems('recommendations')) docs.push(...recommendationDocs(p));
  for (const p of await loadPageItems('musings')) docs.push(...musingDocs(p));

  const spotlights = await AuthorSpotlight.find({ isPublished: true }).lean();
  for (const s of spotlights) docs.push(...spotlightDocs(s as unknown as Record<string, unknown>));

  for (const doc of docs) {
    for (const tag of doc.tags) {
      const slug = tagToSlug(tag);
      if (slug) tagSlugs.set(slug, slugToTagLabel(slug));
    }
  }

  indexCache = { at: Date.now(), docs, tagSlugs };
  return { docs, tagSlugs };
}

export function clearSearchIndexCache(): void {
  indexCache = null;
}
