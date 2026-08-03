import type { ContentKind, GenreHubDefinition } from './types';
import { getGenreHubBySlug, GENRE_HUBS, genreHubDisplayTitle } from './genreHubs';
import { getTopicHubBySlug } from './topicHubs';
import { resolvePageMetadata } from './resolve';
import { resolveListingSocialImage } from './socialImage';
import {
  getAuthorSpotlightsPublic,
  getBlogPosts,
  getRecommendations,
} from '@/lib/api';
import { isContentPublished } from '@/lib/contentPublish';
import { readGenres, readTags, genresMatchHub } from '@/lib/contentFields';
import { parseShopBookMeta } from '@/lib/shop/sanitize';
import { fetchBooksForGenreHub } from '@/lib/books/directory';
import type { DirectoryBook } from '@/lib/books/directory';
import type { TaggedContentRef } from '@/lib/tags';
import { pickThumbnail } from '@/lib/tags';

export type GenreHubContent = {
  hub: GenreHubDefinition;
  books: DirectoryBook[];
  reviews: TaggedContentRef[];
  recommendations: TaggedContentRef[];
  authorSpotlights: TaggedContentRef[];
  relatedGenres: GenreHubDefinition[];
  topicHub?: { slug: string; title: string; href: string };
};

function record(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function norm(s: string): string {
  return s.trim().toLowerCase();
}

function matchesList(value: string | undefined, list: string[] | undefined): boolean {
  if (!value?.trim() || !list?.length) return false;
  const v = norm(value);
  return list.some((item) => norm(item) === v);
}

function matchesAnyTag(itemTags: string[], hubTags: string[] | undefined): boolean {
  if (!hubTags?.length || !itemTags.length) return false;
  const set = new Set(itemTags.map(norm));
  return hubTags.some((t) => set.has(norm(t)));
}

function itemRef(
  kind: ContentKind,
  raw: Record<string, unknown>,
  pathPrefix: string
): TaggedContentRef | null {
  const slug = String(raw.slug ?? '').trim();
  if (!slug || !isContentPublished(raw as { isPublished?: boolean })) return null;
  const title =
    kind === 'author-spotlight' ? String(raw.name ?? '').trim() : String(raw.title ?? '').trim();
  if (!title) return null;
  return {
    kind,
    slug,
    title,
    excerpt: String(raw.excerpt ?? raw.tagline ?? '').trim() || undefined,
    href: `${pathPrefix}/${slug}`,
    tags: readTags(raw),
    image: pickThumbnail(kind, raw),
  };
}

function genreMatchesItem(hub: GenreHubDefinition, kind: ContentKind, raw: Record<string, unknown>): boolean {
  const itemGenres = readGenres(raw);
  if (genresMatchHub(itemGenres, hub.genres)) return true;
  if (genresMatchHub(itemGenres, hub.bookGenres)) return true;

  const tags = readTags(raw);
  if (matchesAnyTag(tags, hub.tags)) return true;

  const category = typeof raw.category === 'string' ? raw.category : undefined;
  if (matchesList(category, hub.categories)) return true;

  if (kind === 'musing' && Array.isArray(raw.themes)) {
    const themes = (raw.themes as unknown[]).map((t) => String(t));
    if (hub.themes?.some((ht) => themes.some((t) => norm(t) === norm(ht)))) return true;
    if (genresMatchHub(themes, hub.genres)) return true;
  }

  if (kind === 'author-spotlight' && Array.isArray(raw.genres)) {
    const genres = (raw.genres as unknown[]).map((g) => String(g));
    if (genresMatchHub(genres, hub.genres)) return true;
    if (matchesList(category, hub.categories)) return true;
  }

  if (kind === 'recommendation' && Array.isArray(raw.books)) {
    for (const b of raw.books) {
      const book = record(b);
      if (!book) continue;
      const shopBook = parseShopBookMeta(book.shopBook);
      const bookGenre = shopBook?.genre?.trim();
      if (bookGenre && genresMatchHub([bookGenre], [...(hub.bookGenres ?? []), ...(hub.genres ?? [])])) {
        return true;
      }
    }
  }

  return false;
}

export async function collectContentForGenre(slug: string): Promise<GenreHubContent | null> {
  const hub = getGenreHubBySlug(slug);
  if (!hub) return null;

  const reviews: TaggedContentRef[] = [];
  const recommendations: TaggedContentRef[] = [];
  const authorSpotlights: TaggedContentRef[] = [];

  try {
    const { posts } = await getBlogPosts({ limit: 500, sort: 'newest' });
    for (const p of posts) {
      const r = record(p);
      if (r && genreMatchesItem(hub, 'review', r)) {
        const ref = itemRef('review', r, '/blog');
        if (ref) reviews.push(ref);
      }
    }
  } catch {
    /* skip */
  }

  try {
    const { items } = await getRecommendations({ limit: 500, sort: 'newest' });
    for (const p of items) {
      const r = record(p);
      if (r && genreMatchesItem(hub, 'recommendation', r)) {
        const ref = itemRef('recommendation', r, '/recommendations');
        if (ref) recommendations.push(ref);
      }
    }
  } catch {
    /* skip */
  }

  try {
    const { spotlights } = await getAuthorSpotlightsPublic({ next: { revalidate: 300 } });
    for (const s of spotlights) {
      const r = record(s);
      if (r && genreMatchesItem(hub, 'author-spotlight', r)) {
        const ref = itemRef('author-spotlight', r, '/author-spotlight');
        if (ref) authorSpotlights.push(ref);
      }
    }
  } catch {
    /* skip */
  }

  const books = await fetchBooksForGenreHub(hub);

  const relatedGenres = (hub.relatedGenres ?? [])
    .map((s) => getGenreHubBySlug(s))
    .filter((g): g is GenreHubDefinition => g != null);

  const topic = hub.topicHubSlug ? getTopicHubBySlug(hub.topicHubSlug) : undefined;

  return {
    hub,
    books,
    reviews,
    recommendations,
    authorSpotlights,
    relatedGenres,
    topicHub: topic
      ? { slug: topic.slug, title: topic.title, href: `/topics/${topic.slug}` }
      : undefined,
  };
}

export function resolveGenreHubMetadata(hub: GenreHubDefinition, content: GenreHubContent) {
  const displayTitle = genreHubDisplayTitle(hub);
  const totalItems =
    content.reviews.length +
    content.recommendations.length +
    content.authorSpotlights.length +
    content.books.length;
  const countPhrase = totalItems > 0 ? `${totalItems} curated item${totalItems === 1 ? '' : 's'}` : 'curated content';

  const previewImage =
    content.books[0]?.coverImage || content.reviews[0]?.image || content.recommendations[0]?.image;

  return resolvePageMetadata({
    path: `/genres/${hub.slug}`,
    seoTitle: displayTitle,
    contentTitle: displayTitle,
    fallbackTitle: displayTitle,
    seoDescription: hub.description,
    excerpt: `${hub.description} Browse ${countPhrase} across reviews, lists, author spotlights, and shop books.`,
    fallbackDescription: hub.description,
    keywords: [
      hub.title,
      'book genre',
      'book reviews',
      'book recommendations',
      'Chapters.aur.Chai',
      ...(hub.genres ?? []),
      ...(hub.tags ?? []),
    ],
    type: 'website',
    noIndex: totalItems === 0,
    image: resolveListingSocialImage({
      title: displayTitle,
      category: hub.title,
      coverImage: previewImage,
    }),
  });
}

export function resolveGenresIndexMetadata() {
  return resolvePageMetadata({
    path: '/genres',
    contentTitle: 'Browse by genre',
    fallbackTitle: 'Browse by genre',
    excerpt:
      'Genre pillar pages for Indian mythology, historical fiction, literary fiction, classics, and more — reviews, lists, and author spotlights.',
    fallbackDescription:
      'Explore Chapters.aur.Chai by book genre — curated reviews, recommendations, author spotlights, and shop books.',
    keywords: ['book genres', 'genre guide', 'Chapters.aur.Chai', 'book discovery'],
    type: 'website',
    image: resolveListingSocialImage({ title: 'Browse by Genre', category: 'Genre Guides' }),
  });
}

export { GENRE_HUBS, getGenreHubBySlug, getAllGenreHubSlugs } from './genreHubs';
export { genreHubDisplayTitle } from './genreHubs';
