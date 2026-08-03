import { siteConfig } from '@/lib/seo';
import { SCHEMA_CONTEXT, compact, pageUrl } from './utils';
import { buildBreadcrumbSchema, type BreadcrumbItem } from './webPage';
import type { JsonLdObject } from './types';

/** CollectionPage + breadcrumbs for index/listing routes (no item fetch required). */
export function buildListingHubSchema(input: {
  path: string;
  name: string;
  description: string;
  breadcrumbs: BreadcrumbItem[];
}): JsonLdObject[] {
  const url = pageUrl(input.path);
  const collection = compact({
    '@context': SCHEMA_CONTEXT,
    '@type': 'CollectionPage',
    '@id': url,
    name: input.name,
    description: input.description,
    url,
    inLanguage: 'en-IN',
    isPartOf: {
      '@type': 'WebSite',
      name: siteConfig.name,
      url: siteConfig.url,
    },
  });

  return [collection, buildBreadcrumbSchema(input.breadcrumbs)];
}
