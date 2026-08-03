import {
  getAuthorSpotlightsPublic,
  getBlogPosts,
  getMusings,
  getRecommendations,
  getTagDetailPublic,
  getTagsIndexPublic,
  type TagDetailDto,
} from '@/lib/api';
import { unstable_noStore as noStore } from 'next/cache';
import { isContentPublished } from '@/lib/contentPublish';
import { readTags } from '@/lib/contentFields';
import {
  hasShopLinks,
  resolveListBookShopLinks,
  resolveReviewShopLinks,
  resolveSpotlightBookShopLinks,
  shopPath,
} from '@/lib/shopLinks';
import { relatedTagsFromItems, topicClustersForTag } from './cluster';
import { pickThumbnail } from './images';
import { slugToTagLabel, tagToSlug } from './normalize';
import type { TagDetail, TagIndexEntry, TaggedContentRef } from './types';

const PAGE_SIZE = 50;

function record(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function editorialRef(
  kind: TaggedContentRef['kind'],
  raw: Record<string, unknown>,
  pathPrefix: string
): TaggedContentRef | null {
  if (!isContentPublished(raw as { isPublished?: boolean })) return null;
  const slug = str(raw.slug);
  if (!slug) return null;
  const title =
    kind === 'author-spotlight' ? str(raw.name) : str(raw.title);
  if (!title) return null;
  return {
    kind,
    slug,
    title,
    excerpt: str(raw.excerpt) || str(raw.tagline) || undefined,
    href: `${pathPrefix}/${slug}`,
    tags: readTags(raw),
    image: pickThumbnail(kind, raw),
  };
}

function shopRefsFromRaw(
  kind: 'shop-review' | 'shop-recommendation' | 'shop-spotlight',
  raw: Record<string, unknown>,
  shopKind: 'review' | 'recommendations' | 'author-spotlight'
): TaggedContentRef[] {
  const slug = str(raw.slug);
  if (!slug || !isContentPublished(raw as { isPublished?: boolean })) return [];

  let hasLinks = false;
  if (shopKind === 'review') {
    hasLinks = hasShopLinks(resolveReviewShopLinks(raw));
  } else if (shopKind === 'recommendations') {
    const books = Array.isArray(raw.books) ? raw.books : [];
    hasLinks = books.some((b) => {
      const book = record(b);
      return book && hasShopLinks(resolveListBookShopLinks(book));
    });
  } else {
    const books = Array.isArray(raw.featuredBooks) ? raw.featuredBooks : [];
    hasLinks = books.some((b) => {
      const book = record(b);
      return book && hasShopLinks(resolveSpotlightBookShopLinks(book));
    });
  }
  if (!hasLinks) return [];

  const title =
    shopKind === 'author-spotlight'
      ? `Buy books — ${str(raw.name) || slug}`
      : shopKind === 'review'
        ? `Buy ${str(raw.bookTitle) || str(raw.title) || 'book'}`
        : `Buy books — ${str(raw.title) || slug}`;

  return [
    {
      kind,
      slug,
      title,
      excerpt: 'Where to buy — shop links',
      href: shopPath(shopKind, slug),
      tags: readTags(raw),
      image: pickThumbnail(kind, raw),
    },
  ];
}

async function fetchAllPaginated<T>(
  fetchPage: (page: number, limit: number) => Promise<{ items: T[]; total: number }>
): Promise<T[]> {
  const all: T[] = [];
  let page = 1;
  while (true) {
    const { items, total } = await fetchPage(page, PAGE_SIZE);
    all.push(...items);
    if (items.length === 0 || all.length >= total) break;
    page += 1;
  }
  return all;
}

let tagIndexCache: { at: number; entries: TagIndexEntry[] } | null = null;
const TAG_CACHE_MS = 5 * 60 * 1000;

export function clearTagIndexCache(): void {
  tagIndexCache = null;
}

function mapTagDetailDto(dto: TagDetailDto): TagDetail {
  return {
    slug: dto.slug,
    label: dto.label,
    count: dto.count,
    items: dto.items,
    topicClusters: topicClustersForTag(dto.slug),
    relatedTags: dto.relatedTags,
  };
}

async function collectAllTaggedItemsLocal(): Promise<TaggedContentRef[]> {
  const out: TaggedContentRef[] = [];

  try {
    const posts = await fetchAllPaginated(async (page, limit) => {
      const { posts: items, total } = await getBlogPosts({ page, limit, sort: 'newest' });
      return { items, total };
    });
    for (const p of posts) {
      const r = record(p);
      if (!r) continue;
      const ref = editorialRef('review', r, '/blog');
      if (ref) out.push(ref);
      out.push(...shopRefsFromRaw('shop-review', r, 'review'));
    }
  } catch {
    /* skip */
  }

  try {
    const items = await fetchAllPaginated(async (page, limit) => {
      const { items, total } = await getRecommendations({ page, limit, sort: 'newest' });
      return { items, total };
    });
    for (const p of items) {
      const r = record(p);
      if (!r) continue;
      const ref = editorialRef('recommendation', r, '/recommendations');
      if (ref) out.push(ref);
      out.push(...shopRefsFromRaw('shop-recommendation', r, 'recommendations'));
    }
  } catch {
    /* skip */
  }

  try {
    const items = await fetchAllPaginated(async (page, limit) => {
      const { items, total } = await getMusings({ page, limit, sort: 'newest' });
      return { items, total };
    });
    for (const p of items) {
      const r = record(p);
      if (!r) continue;
      const ref = editorialRef('musing', r, '/musings');
      if (ref) out.push(ref);
    }
  } catch {
    /* skip */
  }

  try {
    const { spotlights } = await getAuthorSpotlightsPublic({ next: { revalidate: 300 } });
    for (const s of spotlights) {
      const r = record(s);
      if (!r) continue;
      const ref = editorialRef('author-spotlight', r, '/author-spotlight');
      if (ref) out.push(ref);
      out.push(...shopRefsFromRaw('shop-spotlight', r, 'author-spotlight'));
    }
  } catch {
    /* skip */
  }

  return out;
}

/** All tags from published editorial + shop content. Prefers full API index when available. */
export async function collectTagIndex(): Promise<TagIndexEntry[]> {
  noStore();
  if (tagIndexCache && Date.now() - tagIndexCache.at < TAG_CACHE_MS) {
    return tagIndexCache.entries;
  }

  try {
    const { tags } = await getTagsIndexPublic({ next: { revalidate: 300 } });
    if (tags.length) {
      tagIndexCache = { at: Date.now(), entries: tags };
      return tags;
    }
  } catch {
    /* fall back to local aggregate */
  }

  const items = await collectAllTaggedItemsLocal();
  const counts = new Map<string, number>();
  for (const item of items) {
    for (const tag of item.tags) {
      const slug = tagToSlug(tag);
      if (!slug) continue;
      counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
  }

  const entries: TagIndexEntry[] = [...counts.entries()]
    .map(([slug, count]) => ({ slug, label: slugToTagLabel(slug), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  tagIndexCache = { at: Date.now(), entries };
  return entries;
}

export async function getTagBySlug(slug: string): Promise<TagIndexEntry | undefined> {
  const s = slug.trim().toLowerCase();
  const index = await collectTagIndex();
  return index.find((t) => t.slug === s);
}

async function collectContentForTagLocal(slug: string): Promise<TaggedContentRef[]> {
  const tagSlug = slug.trim().toLowerCase();
  const items = await collectAllTaggedItemsLocal();
  return items.filter((item) => item.tags.some((t) => tagToSlug(t) === tagSlug));
}

/** All published items (editorial + shop) matching a tag slug. */
export async function collectContentForTag(slug: string): Promise<TaggedContentRef[]> {
  return collectContentForTagLocal(slug);
}

/** Full tag detail for /tags/[slug] and API. Prefers API aggregation when available. */
export async function getTagDetail(slug: string): Promise<TagDetail | null> {
  const tagSlug = slug.trim().toLowerCase();

  try {
    const dto = await getTagDetailPublic(tagSlug, { next: { revalidate: 300 } });
    if (dto) return mapTagDetailDto(dto);
  } catch {
    /* fall back to local */
  }

  const items = await collectContentForTagLocal(tagSlug);
  if (!items.length) {
    const index = await collectTagIndex();
    const entry = index.find((t) => t.slug === tagSlug);
    if (!entry) return null;
    return {
      slug: tagSlug,
      label: entry.label,
      count: 0,
      items: [],
      topicClusters: topicClustersForTag(tagSlug),
      relatedTags: [],
    };
  }

  const index = await collectTagIndex();
  const entry = index.find((t) => t.slug === tagSlug);

  return {
    slug: tagSlug,
    label: entry?.label ?? slugToTagLabel(tagSlug),
    count: items.length,
    items,
    topicClusters: topicClustersForTag(tagSlug),
    relatedTags: relatedTagsFromItems(items, tagSlug),
  };
}
