import type { MetadataRoute } from 'next';

/** Revalidate sitemap on this interval (seconds). Picks up new publishes without redeploy. */
export const SITEMAP_REVALIDATE_SECONDS = 300;

/**
 * Max URLs per sitemap file (Google limit 50_000). Keep lower on shared hosting;
 * use splitSitemapChunks() when enabling generateSitemaps() in app/sitemap.ts.
 */
export const SITEMAP_MAX_URLS_PER_FILE = 5_000;

export type SitemapChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;

/** Content silo — extend when adding tags, topic hubs, author directory, book pages. */
export type SitemapContentKind =
  | 'static'
  | 'review'
  | 'recommendation'
  | 'musing'
  | 'author-spotlight'
  | 'shop'
  | 'tag'
  | 'topic-hub'
  | 'author-directory'
  | 'book';

export const SITEMAP_PRIORITIES = {
  home: 1,
  hub: 0.9,
  staticHigh: 0.85,
  staticMid: 0.75,
  content: 0.8,
  shop: 0.7,
  shopHub: 0.75,
  legal: 0.3,
  utility: 0.5,
  /** Future silos (tags, topic hubs, etc.) */
  taxonomy: 0.65,
  book: 0.72,
} as const;

export const SITEMAP_FREQUENCIES = {
  home: 'weekly' as SitemapChangeFrequency,
  hubDaily: 'daily' as SitemapChangeFrequency,
  hubWeekly: 'weekly' as SitemapChangeFrequency,
  content: 'monthly' as SitemapChangeFrequency,
  contentFresh: 'weekly' as SitemapChangeFrequency,
  static: 'monthly' as SitemapChangeFrequency,
  legal: 'yearly' as SitemapChangeFrequency,
  shop: 'weekly' as SitemapChangeFrequency,
  taxonomy: 'weekly' as SitemapChangeFrequency,
} as const;

/** Public list APIs cap limit at 50 — paginate with this page size. */
export const SITEMAP_API_PAGE_SIZE = 50;
