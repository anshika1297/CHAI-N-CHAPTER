import { siteConfig } from '@/lib/seo';
import { SCHEMA_CONTEXT, compact } from './utils';
import type { JsonLdObject } from './types';

/** Site-wide WebSite schema with SearchAction for /search?q= */
export function buildWebSiteSchema(): JsonLdObject {
  const base = siteConfig.url.replace(/\/$/, '');
  return compact({
    '@context': SCHEMA_CONTEXT,
    '@type': 'WebSite',
    '@id': `${base}/#website`,
    name: siteConfig.name,
    alternateName: siteConfig.brand,
    url: siteConfig.url,
    description: siteConfig.description,
    publisher: { '@id': `${base}/#organization` },
    inLanguage: 'en-IN',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${base}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  });
}
