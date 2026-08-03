import { canonicalUrl, siteConfig } from '@/lib/seo';
import { editorialTaggedItems } from './editorialFilter';
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

/** CollectionPage + ItemList for /tags/[slug] */
export function buildTagCollectionSchema(input: {
  slug: string;
  label: string;
  items: TaggedContentRef[];
}): JsonLdObject[] {
  const url = pageUrl(`/tags/${input.slug}`);
  const collection = compact({
    '@context': SCHEMA_CONTEXT,
    '@type': 'CollectionPage',
    '@id': url,
    name: `${input.label} — Tagged Content`,
    description: `Content tagged "${input.label}" on ${siteConfig.name}`,
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
    { name: 'Tags', path: '/tags' },
    { name: input.label, path: `/tags/${input.slug}` },
  ]);

  const schemaItems = editorialTaggedItems(input.items);
  if (!schemaItems.length) return [collection, breadcrumbs];

  const itemList = compact({
    '@context': SCHEMA_CONTEXT,
    '@type': 'ItemList',
    name: `Posts tagged ${input.label}`,
    numberOfItems: schemaItems.length,
    itemListElement: schemaItems.map((item, i) => ({
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
