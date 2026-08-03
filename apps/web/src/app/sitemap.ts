import type { MetadataRoute } from 'next';
import { buildSitemap, SITEMAP_REVALIDATE_SECONDS } from '@/lib/sitemap';

/**
 * Dynamic sitemap — fetches all published URLs from the API on each revalidation.
 * Includes reviews, recommendations, musings, author spotlights, and shop entries.
 * Future silos (tags, topic hubs, author directory, book pages) extend lib/sitemap/future.ts.
 */
export const revalidate = SITEMAP_REVALIDATE_SECONDS;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { entries } = await buildSitemap();
  return entries;
}
