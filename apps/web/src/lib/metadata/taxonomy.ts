/**
 * Taxonomy metadata + re-exports from universal tagging system.
 * Aggregation lives in @/lib/tags — this module adds metadata resolvers.
 */
import { getTopicHubBySlug, TOPIC_HUBS } from './topicHubs';
import type { ContentKind, TopicHubDefinition } from './types';
import { resolvePageMetadata } from './resolve';
import { resolveListingSocialImage } from './socialImage';
import {
  collectTagIndex,
  collectContentForTag,
  getTagBySlug,
  getTagDetail,
  slugToTagLabel,
  tagToSlug,
  pickThumbnail,
  type TaggedContentRef,
  type TagIndexEntry,
} from '@/lib/tags';

export type { TagIndexEntry, TaggedContentRef as TaxonomyItemRef };

export {
  collectTagIndex,
  getTagBySlug,
  collectContentForTag,
  getTagDetail,
  TOPIC_HUBS,
};

// --- Topic hub aggregation (unchanged) ---

import {
  getAuthorSpotlightsPublic,
  getBlogPosts,
  getMusings,
  getRecommendations,
} from '@/lib/api';
import { isContentPublished } from '@/lib/contentPublish';
import { readGenres, readTags, genresMatchHub } from '@/lib/contentFields';

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

function hubMatchesItem(hub: TopicHubDefinition, kind: ContentKind, raw: Record<string, unknown>): boolean {
  const tags = readTags(raw);
  if (matchesAnyTag(tags, hub.tags)) return true;

  const itemGenres = readGenres(raw);
  if (genresMatchHub(itemGenres, hub.genres)) return true;
  if (genresMatchHub(itemGenres, hub.categories)) return true;

  const category = typeof raw.category === 'string' ? raw.category : undefined;
  if (matchesList(category, hub.categories)) return true;
  if (kind === 'musing' && Array.isArray(raw.themes)) {
    const themes = (raw.themes as unknown[]).map((t) => String(t));
    if (hub.themes?.some((ht) => themes.some((t) => norm(t) === norm(ht)))) return true;
  }
  if (kind === 'author-spotlight' && Array.isArray(raw.genres)) {
    const genres = (raw.genres as unknown[]).map((g) => String(g));
    if (hub.genres?.some((hg) => genres.some((g) => norm(g) === norm(hg)))) return true;
    if (hub.categories?.some((hc) => genres.some((g) => norm(g) === norm(hc)))) return true;
  }
  return false;
}

export async function collectContentForTopic(slug: string): Promise<{ hub: TopicHubDefinition; items: TaggedContentRef[] } | null> {
  const hub = getTopicHubBySlug(slug);
  if (!hub) return null;
  const out: TaggedContentRef[] = [];

  try {
    const { posts } = await getBlogPosts({ limit: 500, sort: 'newest' });
    for (const p of posts) {
      const r = record(p);
      if (r && hubMatchesItem(hub, 'review', r)) {
        const ref = itemRef('review', r, '/blog');
        if (ref) out.push(ref);
      }
    }
  } catch {
    /* skip */
  }

  try {
    const { items } = await getRecommendations({ limit: 500, sort: 'newest' });
    for (const p of items) {
      const r = record(p);
      if (r && hubMatchesItem(hub, 'recommendation', r)) {
        const ref = itemRef('recommendation', r, '/recommendations');
        if (ref) out.push(ref);
      }
    }
  } catch {
    /* skip */
  }

  try {
    const { items } = await getMusings({ limit: 500, sort: 'newest' });
    for (const p of items) {
      const r = record(p);
      if (r && hubMatchesItem(hub, 'musing', r)) {
        const ref = itemRef('musing', r, '/musings');
        if (ref) out.push(ref);
      }
    }
  } catch {
    /* skip */
  }

  try {
    const { spotlights } = await getAuthorSpotlightsPublic({ next: { revalidate: 300 } });
    for (const s of spotlights) {
      const r = record(s);
      if (r && hubMatchesItem(hub, 'author-spotlight', r)) {
        const ref = itemRef('author-spotlight', r, '/author-spotlight');
        if (ref) out.push(ref);
      }
    }
  } catch {
    /* skip */
  }

  return { hub, items: out };
}

export function resolveTagMetadata(
  slug: string,
  tag?: TagIndexEntry,
  previewImage?: string
) {
  const label = tag?.label ?? slugToTagLabel(slug);
  const count = tag?.count ?? 0;
  const countPhrase = count > 0 ? `${count} item${count === 1 ? '' : 's'}` : 'content';

  return resolvePageMetadata({
    path: `/tags/${slug}`,
    contentTitle: `${label} — Books & Reading`,
    fallbackTitle: `${label} — Books & Reading`,
    excerpt: `Explore ${countPhrase} tagged "${label}" — reviews, recommendations, musings, author spotlights, and shop links on Chapters.aur.Chai.`,
    fallbackDescription: `All Chapters.aur.Chai content tagged ${label} — curated for readers in India, UAE, and worldwide.`,
    keywords: [label, 'book tag', 'Chapters.aur.Chai', 'book reviews', 'reading'],
    type: 'website',
    noIndex: count === 0,
    image: resolveListingSocialImage({
      title: label,
      category: 'Tagged Reading',
      coverImage: previewImage,
    }),
  });
}

export function resolveTopicHubMetadata(
  hub: TopicHubDefinition,
  itemCount: number,
  previewImage?: string
) {
  const countPhrase = itemCount > 0 ? `${itemCount} curated post${itemCount === 1 ? '' : 's'}` : 'curated posts';
  return resolvePageMetadata({
    path: `/topics/${hub.slug}`,
    seoTitle: hub.title,
    contentTitle: `${hub.title} — Reading Guide`,
    fallbackTitle: `${hub.title} — Reading Guide`,
    seoDescription: hub.description,
    excerpt: `${hub.description} Browse ${countPhrase}.`,
    fallbackDescription: hub.description,
    keywords: [hub.title, 'topic hub', 'reading guide', 'Chapters.aur.Chai', ...(hub.tags ?? [])],
    type: 'website',
    noIndex: itemCount === 0,
    image: resolveListingSocialImage({
      title: hub.title,
      category: 'Reading Guide',
      coverImage: previewImage,
    }),
  });
}

export function resolveTagsIndexMetadata() {
  return resolvePageMetadata({
    path: '/tags',
    contentTitle: 'Browse by tag',
    fallbackTitle: 'Browse by tag',
    excerpt: 'Explore Chapters.aur.Chai content by tag — reviews, lists, musings, author spotlights, and shop.',
    fallbackDescription: 'Tag index for Chapters.aur.Chai — discover book content by topic.',
    keywords: ['tags', 'book blog tags', 'Chapters.aur.Chai'],
    type: 'website',
    image: resolveListingSocialImage({ title: 'Browse by Tag', category: 'Reading Discovery' }),
  });
}

export function resolveTopicsIndexMetadata() {
  return resolvePageMetadata({
    path: '/topics',
    contentTitle: 'Reading topic hubs',
    fallbackTitle: 'Reading topic hubs',
    excerpt: 'Curated reading guides across fiction, non-fiction, Indian literature, mythology, and more.',
    fallbackDescription: 'Topic hubs on Chapters.aur.Chai — curated collections of reviews and recommendations.',
    keywords: ['topic hubs', 'reading guides', 'Chapters.aur.Chai'],
    type: 'website',
    image: resolveListingSocialImage({ title: 'Topic Hubs', category: 'Reading Guides' }),
  });
}
