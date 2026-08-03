import { siteConfig } from '@/lib/seo';
import { SCHEMA_CONTEXT, compact, pageUrl } from './utils';
import type { JsonLdObject } from './types';

export type BreadcrumbItem = { name: string; path: string };

/** BreadcrumbList for any static or hub page. */
export function buildBreadcrumbSchema(items: BreadcrumbItem[]): JsonLdObject {
  return compact({
    '@context': SCHEMA_CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: pageUrl(item.path),
    })),
  });
}

export type WebPageSchemaInput = {
  path: string;
  name: string;
  description: string;
  /** Optional related links surfaced for crawlers / AI search */
  relatedLinks?: { name: string; path: string }[];
};

/** WebPage schema for landing and hub pages. */
export function buildWebPageSchema(input: WebPageSchemaInput): JsonLdObject {
  const url = pageUrl(input.path);
  const schema = compact({
    '@context': SCHEMA_CONTEXT,
    '@type': 'WebPage',
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
    about: {
      '@type': 'Thing',
      name: 'Books and reading',
      description:
        'Book reviews, recommendations, literary musings, and author spotlights for readers in India, UAE, and worldwide.',
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteConfig.url,
    },
  });

  if (input.relatedLinks?.length) {
    return {
      ...schema,
      hasPart: input.relatedLinks.map((link) => ({
        '@type': 'WebPage',
        name: link.name,
        url: pageUrl(link.path),
      })),
    };
  }

  return schema;
}
