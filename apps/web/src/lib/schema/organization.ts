import { siteConfig, canonicalUrl } from '@/lib/seo';
import { SCHEMA_CONTEXT, compact } from './utils';
import type { JsonLdObject } from './types';

/** Site-wide Organization schema (Google-compliant). */
export function buildOrganizationSchema(): JsonLdObject {
  return compact({
    '@context': SCHEMA_CONTEXT,
    '@type': 'Organization',
    '@id': `${siteConfig.url.replace(/\/$/, '')}/#organization`,
    name: siteConfig.name,
    alternateName: siteConfig.brand,
    url: siteConfig.url,
    logo: {
      '@type': 'ImageObject',
      url: `${siteConfig.url.replace(/\/$/, '')}/logo.png`,
      width: 512,
      height: 512,
    },
    description: siteConfig.description,
    email: siteConfig.email,
    founder: {
      '@type': 'Person',
      '@id': `${siteConfig.url.replace(/\/$/, '')}/#person`,
      name: siteConfig.author,
      url: canonicalUrl('/about'),
    },
    sameAs: Object.values(siteConfig.social),
    areaServed: ['IN', 'AE', 'Worldwide'],
  });
}
