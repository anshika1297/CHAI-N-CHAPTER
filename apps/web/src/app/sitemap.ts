import { MetadataRoute } from 'next';
import { siteConfig, canonicalUrl } from '@/lib/seo';

const base = siteConfig.url.replace(/\/$/, '');

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: canonicalUrl('/about'), lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: canonicalUrl('/blog'), lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: canonicalUrl('/recommendations'), lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: canonicalUrl('/musings'), lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: canonicalUrl('/book-clubs'), lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: canonicalUrl('/work-with-me'), lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: canonicalUrl('/contact'), lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: canonicalUrl('/terms'), lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: canonicalUrl('/privacy'), lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  // TODO: When you have API, fetch blog/recommendations/musings slugs and append:
  // slugs.map(slug => ({ url: canonicalUrl(`/blog/${slug}`), lastModified, changeFrequency: 'monthly', priority: 0.8 }))
  return staticRoutes;
}
