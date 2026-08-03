import { getTagsIndexPublic } from '@/lib/api';
import { getAllTopicHubSlugs } from '@/lib/metadata/topicHubs';
import { getAllReadingPathSlugs, readingPathPagePath } from '@/lib/readingPaths/definitions';
import { getAllGenreHubSlugs } from '@/lib/metadata/genreHubs';
import { fetchGenreIndex } from '@/lib/genres';
import {
  SITEMAP_FREQUENCIES,
  SITEMAP_PRIORITIES,
} from './constants';
import type { SitemapEntryDraft } from './types';

/** /tags/[slug] — tag taxonomy pages (full API index, no 500-item cap). */
export async function collectTagSitemapEntries(): Promise<SitemapEntryDraft[]> {
  try {
    const { tags } = await getTagsIndexPublic({ next: { revalidate: 300 } });
    return tags
      .filter((tag) => tag.count > 0)
      .map((tag) => ({
        path: `/tags/${tag.slug}`,
        changeFrequency: SITEMAP_FREQUENCIES.taxonomy,
        priority: SITEMAP_PRIORITIES.taxonomy,
        kind: 'tag',
      }));
  } catch (err) {
    console.error('[sitemap] tags', err);
    return [];
  }
}

/** /topics/[slug] — curated topic hub landing pages */
export async function collectTopicHubSitemapEntries(): Promise<SitemapEntryDraft[]> {
  return getAllTopicHubSlugs().map((slug) => ({
    path: `/topics/${slug}`,
    changeFrequency: SITEMAP_FREQUENCIES.taxonomy,
    priority: SITEMAP_PRIORITIES.taxonomy,
    kind: 'topic-hub',
  }));
}

/** /genres — index + /genres/[slug] pillar pages (curated + CMS-discovered) */
export async function collectGenreHubSitemapEntries(): Promise<SitemapEntryDraft[]> {
  const index: SitemapEntryDraft = {
    path: '/genres',
    changeFrequency: SITEMAP_FREQUENCIES.taxonomy,
    priority: SITEMAP_PRIORITIES.taxonomy,
    kind: 'topic-hub',
  };
  const slugs = new Set(getAllGenreHubSlugs());
  try {
    const discovered = await fetchGenreIndex({ revalidate: 300 });
    for (const g of discovered) {
      if (g.count > 0) slugs.add(g.slug);
    }
  } catch (err) {
    console.error('[sitemap] genres', err);
  }
  const hubs = [...slugs].map((slug) => ({
    path: `/genres/${slug}`,
    changeFrequency: SITEMAP_FREQUENCIES.taxonomy,
    priority: SITEMAP_PRIORITIES.taxonomy,
    kind: 'topic-hub' as const,
  }));
  return [index, ...hubs];
}

/** /reading-paths/[slug] — curated step-by-step reading guides */
export function collectReadingPathSitemapEntries(): SitemapEntryDraft[] {
  return getAllReadingPathSlugs().map((slug) => ({
    path: readingPathPagePath(slug),
    changeFrequency: SITEMAP_FREQUENCIES.taxonomy,
    priority: SITEMAP_PRIORITIES.taxonomy,
    kind: 'topic-hub',
  }));
}

/** /authors — directory + /authors/[slug] profile pages */
export async function collectAuthorDirectorySitemapEntries(): Promise<SitemapEntryDraft[]> {
  return [];
}

/** /books — directory; /books/[slug] stubs for future entity pages */
export function collectBookPageSitemapEntries(): SitemapEntryDraft[] {
  return [
    {
      path: '/books',
      changeFrequency: SITEMAP_FREQUENCIES.taxonomy,
      priority: SITEMAP_PRIORITIES.book,
      kind: 'book',
    },
  ];
}

/** Aggregate all future silos. */
export async function collectFutureSitemapEntries(): Promise<SitemapEntryDraft[]> {
  const [tags, topics, authors] = await Promise.all([
    collectTagSitemapEntries(),
    collectTopicHubSitemapEntries(),
    collectAuthorDirectorySitemapEntries(),
  ]);
  const books = collectBookPageSitemapEntries();
  return [
    ...tags,
    ...topics,
    ...(await collectGenreHubSitemapEntries()),
    ...collectReadingPathSitemapEntries(),
    ...authors,
    ...books,
  ];
}
