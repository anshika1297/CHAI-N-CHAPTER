import { MetadataRoute } from 'next';
import { siteConfig, canonicalUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  const base = siteConfig.url.replace(/\/$/, '');
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin/', '/api/'] },
      { userAgent: 'Googlebot', allow: '/', disallow: ['/admin/', '/api/'] },
      { userAgent: 'Bingbot', allow: '/', disallow: ['/admin/', '/api/'] },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
