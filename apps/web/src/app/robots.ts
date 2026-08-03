import { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/seo';

/**
 * Crawl rules for search engines.
 * Sitemap is generated dynamically at /sitemap.xml (revalidates every 5 minutes).
 * When URL count exceeds SITEMAP_MAX_URLS_PER_FILE, enable generateSitemaps() in sitemap.ts
 * — robots sitemap URL stays /sitemap.xml (Next.js serves the index automatically).
 */
export default function robots(): MetadataRoute.Robots {
  const base = siteConfig.url.replace(/\/$/, '');

  const publicDisallow = [
    '/admin/',
    '/api/',
    '/search',
    '/subscribe/unsubscribe',
  ] as const;

  const ogAllow = '/api/og';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [ogAllow, '/'],
        disallow: [...publicDisallow],
      },
      {
        userAgent: 'Googlebot',
        allow: [ogAllow, '/'],
        disallow: [...publicDisallow],
      },
      {
        userAgent: 'Bingbot',
        allow: [ogAllow, '/'],
        disallow: [...publicDisallow],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
