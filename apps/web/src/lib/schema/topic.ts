import { canonicalUrl, siteConfig } from '@/lib/seo';
import { SCHEMA_CONTEXT, compact, pageUrl } from './utils';
import { buildBreadcrumbSchema } from './webPage';
import type { JsonLdObject } from './types';
import type { TaggedContentRef } from '@/lib/tags';

const KIND_LABELS: Record<TaggedContentRef['kind'], string> = {
  review: 'Book Review',
  recommendation: 'Book Recommendations',
  musing: 'Musing',
  'author-spotlight': 'Author Spotlight',
  'shop-review': 'Shop — Book Review',
  'shop-recommendation': 'Shop — Book List',
  'shop-spotlight': 'Shop — Author Spotlight',
};

/** CollectionPage + ItemList (+ breadcrumbs) for /topics/[slug] */
export function buildTopicHubCollectionSchema(input: {
  slug: string;
  title: string;
  description: string;
  items: TaggedContentRef[];
}): JsonLdObject[] {
  const path = `/topics/${input.slug}`;
  const url = pageUrl(path);
  const collection = compact({
    '@context': SCHEMA_CONTEXT,
    '@type': 'CollectionPage',
    '@id': url,
    name: `${input.title} — Reading Guide`,
    description: input.description,
    url,
    isPartOf: {
      '@type': 'WebSite',
      name: siteConfig.name,
      url: siteConfig.url,
    },
    inLanguage: 'en-IN',
  });

  const breadcrumbs = buildBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Topics', path: '/topics' },
    { name: input.title, path },
  ]);

  if (!input.items.length) return [collection, breadcrumbs];

  const itemList = compact({
    '@context': SCHEMA_CONTEXT,
    '@type': 'ItemList',
    name: `Posts in ${input.title}`,
    numberOfItems: input.items.length,
    itemListElement: input.items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.title,
      url: canonicalUrl(item.href),
      item: {
        '@type': 'WebPage',
        name: item.title,
        description: item.excerpt,
        url: canonicalUrl(item.href),
        genre: KIND_LABELS[item.kind],
      },
    })),
  });

  return [collection, itemList, breadcrumbs];
}
