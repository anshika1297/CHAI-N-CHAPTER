import { AuthorSpotlight } from '../models/AuthorSpotlight.js';
import { Page } from '../models/Page.js';
import { filterPublishedPageItems } from '../utils/pageContentPublish.js';
import { readTags, slugToTagLabel, tagToSlug } from '../utils/tags.js';
import type { TagDetail, TagIndexEntry, TaggedContentRef } from '../types/tags.js';
import { arrayHasShopLinks, listBookHasShopLinks, reviewHasShopLinks } from '../utils/shopLinks.js';

const PAGE_SLUGS = ['blog', 'recommendations', 'musings'] as const;

function record(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function pickThumbnail(kind: TaggedContentRef['kind'], raw: Record<string, unknown>): string | undefined {
  if (kind === 'author-spotlight' || kind === 'shop-spotlight') {
    return str(raw.coverImage) || str(raw.profileImage) || str(raw.ogImage) || undefined;
  }
  if (kind === 'musing') {
    return str(raw.image) || str(raw.coverImage) || undefined;
  }
  return str(raw.image) || undefined;
}

function shopPath(kind: 'review' | 'recommendations' | 'author-spotlight', slug: string): string {
  const enc = encodeURIComponent(slug);
  if (kind === 'review') return `/shop/review/${enc}`;
  if (kind === 'recommendations') return `/shop/recommendations/${enc}`;
  return `/shop/author-spotlight/${enc}`;
}

function editorialRef(
  kind: TaggedContentRef['kind'],
  raw: Record<string, unknown>,
  pathPrefix: string
): TaggedContentRef | null {
  const slug = str(raw.slug);
  if (!slug) return null;
  const title = kind === 'author-spotlight' ? str(raw.name) : str(raw.title);
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

function shopRefs(
  kind: 'shop-review' | 'shop-recommendation' | 'shop-spotlight',
  raw: Record<string, unknown>,
  shopKind: 'review' | 'recommendations' | 'author-spotlight'
): TaggedContentRef[] {
  const slug = str(raw.slug);
  if (!slug) return [];

  let linked = false;
  if (shopKind === 'review') linked = reviewHasShopLinks(raw);
  else if (shopKind === 'recommendations') {
    const books = Array.isArray(raw.books) ? raw.books : [];
    linked = books.some((b) => {
      const book = record(b);
      return book ? listBookHasShopLinks(book) : false;
    });
  } else {
    const books = Array.isArray(raw.featuredBooks) ? raw.featuredBooks : [];
    linked = books.some((b) => {
      const book = record(b);
      return book && (arrayHasShopLinks(book.shopLinks) || str(book.buyLink));
    });
  }
  if (!linked) return [];

  const title =
    shopKind === 'author-spotlight'
      ? `Buy books — ${str(raw.name) || slug}`
      : shopKind === 'review'
        ? `Buy ${str(raw.bookTitle) || str(raw.title) || 'book'}`
        : `Buy books — ${str(raw.title) || slug}`;

  return [{
    kind,
    slug,
    title,
    excerpt: 'Where to buy',
    href: shopPath(shopKind, slug),
    tags: readTags(raw),
    image: pickThumbnail(kind, raw),
  }];
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

export async function collectAllTaggedItems(): Promise<TaggedContentRef[]> {
  const out: TaggedContentRef[] = [];

  for (const p of await loadPageItems('blog')) {
    const ref = editorialRef('review', p, '/blog');
    if (ref) out.push(ref);
    out.push(...shopRefs('shop-review', p, 'review'));
  }

  for (const p of await loadPageItems('recommendations')) {
    const ref = editorialRef('recommendation', p, '/recommendations');
    if (ref) out.push(ref);
    out.push(...shopRefs('shop-recommendation', p, 'recommendations'));
  }

  for (const p of await loadPageItems('musings')) {
    const ref = editorialRef('musing', p, '/musings');
    if (ref) out.push(ref);
  }

  const spotlights = await AuthorSpotlight.find({ isPublished: true }).lean();
  for (const s of spotlights) {
    const raw = s as unknown as Record<string, unknown>;
    const ref = editorialRef('author-spotlight', raw, '/author-spotlight');
    if (ref) out.push(ref);
    out.push(...shopRefs('shop-spotlight', raw, 'author-spotlight'));
  }

  return out;
}

export async function collectTagIndex(): Promise<TagIndexEntry[]> {
  const items = await collectAllTaggedItems();
  const counts = new Map<string, number>();
  for (const item of items) {
    for (const tag of item.tags) {
      const slug = tagToSlug(tag);
      if (!slug) continue;
      counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([slug, count]) => ({ slug, label: slugToTagLabel(slug), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export async function getTagDetail(slug: string): Promise<TagDetail | null> {
  const tagSlug = slug.trim().toLowerCase();
  const all = await collectAllTaggedItems();
  const items = all.filter((item) => item.tags.some((t) => tagToSlug(t) === tagSlug));
  const index = await collectTagIndex();
  const entry = index.find((t) => t.slug === tagSlug);

  if (!items.length && !entry) return null;

  const relatedCounts = new Map<string, number>();
  for (const item of items) {
    const slugs = new Set(item.tags.map((t) => tagToSlug(t)));
    for (const s of slugs) {
      if (s === tagSlug) continue;
      relatedCounts.set(s, (relatedCounts.get(s) ?? 0) + 1);
    }
  }
  const relatedTags = [...relatedCounts.entries()]
    .map(([s, count]) => ({ slug: s, label: slugToTagLabel(s), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    slug: tagSlug,
    label: entry?.label ?? slugToTagLabel(tagSlug),
    count: items.length,
    items,
    topicClusters: [],
    relatedTags,
  };
}
