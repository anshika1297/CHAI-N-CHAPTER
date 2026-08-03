import { canonicalUrl, siteConfig } from '@/lib/seo';
import type { ResolvedReadingPath } from './types';

/** ItemList JSON-LD — canonical URL is the dedicated reading path page. */
export function buildReadingPathSchema(path: ResolvedReadingPath) {
  const url = canonicalUrl(path.pageHref);
  const items = path.steps.flatMap((step) =>
    step.items.map((item, i) => ({
      '@type': 'ListItem',
      position: step.step * 10 + i + 1,
      name: item.title,
      url: canonicalUrl(item.href),
      description: item.excerpt,
    }))
  );

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': url,
    name: path.title,
    description: path.description,
    url,
    numberOfItems: items.length,
    itemListElement: items,
    isPartOf: {
      '@type': 'WebSite',
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };
}
