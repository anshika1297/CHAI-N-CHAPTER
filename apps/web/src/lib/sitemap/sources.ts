import {
  getAuthorSpotlightsPublic,
  getBlogPosts,
  getMusings,
  getRecommendations,
} from '@/lib/api';
import {
  SITEMAP_API_PAGE_SIZE,
  SITEMAP_FREQUENCIES,
  SITEMAP_PRIORITIES,
} from './constants';
import type { SitemapEntryDraft } from './types';

function record(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function parseLastModified(...candidates: unknown[]): Date | undefined {
  for (const c of candidates) {
    if (c instanceof Date && !Number.isNaN(c.getTime())) return c;
    if (typeof c === 'string' && c.trim()) {
      const d = new Date(c.trim());
      if (!Number.isNaN(d.getTime())) return d;
    }
  }
  return undefined;
}

async function fetchAllPaginated<T>(
  fetchPage: (page: number, limit: number) => Promise<{ items: T[]; total: number }>
): Promise<T[]> {
  const all: T[] = [];
  let page = 1;
  const limit = SITEMAP_API_PAGE_SIZE;
  while (true) {
    const { items, total } = await fetchPage(page, limit);
    all.push(...items);
    if (items.length === 0 || all.length >= total) break;
    page += 1;
  }
  return all;
}

/** Static marketing and utility pages. */
export function collectStaticSitemapEntries(): SitemapEntryDraft[] {
  return [
    { path: '/', changeFrequency: SITEMAP_FREQUENCIES.home, priority: SITEMAP_PRIORITIES.home, kind: 'static' },
    { path: '/about', changeFrequency: SITEMAP_FREQUENCIES.static, priority: SITEMAP_PRIORITIES.staticHigh, kind: 'static' },
    { path: '/blog', changeFrequency: SITEMAP_FREQUENCIES.hubDaily, priority: SITEMAP_PRIORITIES.hub, kind: 'static' },
    { path: '/recommendations', changeFrequency: SITEMAP_FREQUENCIES.hubWeekly, priority: SITEMAP_PRIORITIES.hub, kind: 'static' },
    { path: '/musings', changeFrequency: SITEMAP_FREQUENCIES.hubWeekly, priority: SITEMAP_PRIORITIES.hub, kind: 'static' },
    { path: '/author-spotlight', changeFrequency: SITEMAP_FREQUENCIES.hubWeekly, priority: SITEMAP_PRIORITIES.hub, kind: 'static' },
    { path: '/shop', changeFrequency: SITEMAP_FREQUENCIES.shop, priority: SITEMAP_PRIORITIES.shopHub, kind: 'static' },
    { path: '/tags', changeFrequency: SITEMAP_FREQUENCIES.taxonomy, priority: SITEMAP_PRIORITIES.taxonomy, kind: 'static' },
    { path: '/topics', changeFrequency: SITEMAP_FREQUENCIES.taxonomy, priority: SITEMAP_PRIORITIES.taxonomy, kind: 'static' },
    { path: '/book-clubs', changeFrequency: SITEMAP_FREQUENCIES.static, priority: SITEMAP_PRIORITIES.staticMid, kind: 'static' },
    { path: '/work-with-me', changeFrequency: SITEMAP_FREQUENCIES.static, priority: SITEMAP_PRIORITIES.staticHigh, kind: 'static' },
    { path: '/contact', changeFrequency: SITEMAP_FREQUENCIES.static, priority: SITEMAP_PRIORITIES.staticMid, kind: 'static' },
    { path: '/subscribe', changeFrequency: SITEMAP_FREQUENCIES.static, priority: SITEMAP_PRIORITIES.utility, kind: 'static' },
    { path: '/start-here', changeFrequency: SITEMAP_FREQUENCIES.static, priority: SITEMAP_PRIORITIES.staticHigh, kind: 'static' },
    { path: '/terms', changeFrequency: SITEMAP_FREQUENCIES.legal, priority: SITEMAP_PRIORITIES.legal, kind: 'static' },
    { path: '/privacy', changeFrequency: SITEMAP_FREQUENCIES.legal, priority: SITEMAP_PRIORITIES.legal, kind: 'static' },
  ];
}

export async function collectReviewSitemapEntries(): Promise<SitemapEntryDraft[]> {
  try {
    const posts = await fetchAllPaginated(async (page, limit) => {
      const { posts: items, total } = await getBlogPosts({ page, limit, sort: 'newest' });
      return { items, total };
    });
    return posts.flatMap((raw): SitemapEntryDraft[] => {
      const p = record(raw);
      const slug = p ? String(p.slug ?? '').trim() : '';
      if (!slug) return [];
      return [{
        path: `/blog/${slug}`,
        lastModified: parseLastModified(p?.updatedAt, p?.publishedAt),
        changeFrequency: SITEMAP_FREQUENCIES.contentFresh,
        priority: SITEMAP_PRIORITIES.content,
        kind: 'review',
      }];
    });
  } catch (err) {
    console.error('[sitemap] reviews', err);
    return [];
  }
}

export async function collectRecommendationSitemapEntries(): Promise<SitemapEntryDraft[]> {
  try {
    const items = await fetchAllPaginated(async (page, limit) => {
      const { items, total } = await getRecommendations({ page, limit, sort: 'newest' });
      return { items, total };
    });
    return items.flatMap((raw): SitemapEntryDraft[] => {
      const p = record(raw);
      const slug = p ? String(p.slug ?? '').trim() : '';
      if (!slug) return [];
      return [{
        path: `/recommendations/${slug}`,
        lastModified: parseLastModified(p?.updatedAt, p?.publishedAt),
        changeFrequency: SITEMAP_FREQUENCIES.content,
        priority: SITEMAP_PRIORITIES.content,
        kind: 'recommendation',
      }];
    });
  } catch (err) {
    console.error('[sitemap] recommendations', err);
    return [];
  }
}

export async function collectMusingSitemapEntries(): Promise<SitemapEntryDraft[]> {
  try {
    const items = await fetchAllPaginated(async (page, limit) => {
      const { items, total } = await getMusings({ page, limit, sort: 'newest' });
      return { items, total };
    });
    return items.flatMap((raw): SitemapEntryDraft[] => {
      const p = record(raw);
      const slug = p ? String(p.slug ?? '').trim() : '';
      if (!slug) return [];
      return [{
        path: `/musings/${slug}`,
        lastModified: parseLastModified(p?.updatedAt, p?.publishedAt),
        changeFrequency: SITEMAP_FREQUENCIES.content,
        priority: SITEMAP_PRIORITIES.content,
        kind: 'musing',
      }];
    });
  } catch (err) {
    console.error('[sitemap] musings', err);
    return [];
  }
}

export async function collectAuthorSpotlightSitemapEntries(): Promise<SitemapEntryDraft[]> {
  try {
    const { spotlights } = await getAuthorSpotlightsPublic({ next: { revalidate: 300 } });
    return spotlights.flatMap((s): SitemapEntryDraft[] => {
      const slug = String(s.slug ?? '').trim();
      if (!slug) return [];
      return [{
        path: `/author-spotlight/${slug}`,
        lastModified: parseLastModified(s.publishDate),
        changeFrequency: SITEMAP_FREQUENCIES.content,
        priority: SITEMAP_PRIORITIES.content,
        kind: 'author-spotlight',
      }];
    });
  } catch (err) {
    console.error('[sitemap] author spotlights', err);
    return [];
  }
}

/** Shop detail pages are noindex (affiliate); only /shop hub is listed in static entries. */
export async function collectShopSitemapEntries(): Promise<SitemapEntryDraft[]> {
  return [];
}

/** Fetch all current content silos in parallel. */
export async function collectAllSitemapDrafts(): Promise<SitemapEntryDraft[]> {
  const [reviews, recommendations, musings, spotlights, shop, future] = await Promise.all([
    collectReviewSitemapEntries(),
    collectRecommendationSitemapEntries(),
    collectMusingSitemapEntries(),
    collectAuthorSpotlightSitemapEntries(),
    collectShopSitemapEntries(),
    import('./future').then((m) => m.collectFutureSitemapEntries()),
  ]);

  return [
    ...collectStaticSitemapEntries(),
    ...reviews,
    ...recommendations,
    ...musings,
    ...spotlights,
    ...shop,
    ...future,
  ];
}
