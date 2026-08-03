import { canonicalUrl, siteConfig } from '@/lib/seo';
import { buildBreadcrumbSchema } from '@/lib/schema/webPage';
import { genreHubDisplayTitle } from '@/lib/metadata/genreHubs';
import { resolveBookEditorialLink } from '@/lib/books/viewHref';
import type { GenreHubContent } from '@/lib/metadata/genres';
import type { JsonLdObject } from '@/lib/schema/types';

const SCHEMA_CONTEXT = 'https://schema.org';

export function buildGenreHubSchemas(content: GenreHubContent): JsonLdObject[] {
  const { hub } = content;
  const url = canonicalUrl(`/genres/${hub.slug}`);
  const name = genreHubDisplayTitle(hub);

  const allItems = [
    ...content.reviews.map((r) => ({ title: r.title, href: r.href })),
    ...content.recommendations.map((r) => ({ title: r.title, href: r.href })),
    ...content.authorSpotlights.map((r) => ({ title: r.title, href: r.href })),
    ...content.books.map((b) => {
      const link = resolveBookEditorialLink(b);
      return { title: b.title, href: link.href };
    }),
  ];

  const itemListElement = allItems.slice(0, 50).map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.title,
    url: canonicalUrl(item.href),
  }));

  const schemas: JsonLdObject[] = [
    {
      '@context': SCHEMA_CONTEXT,
      '@type': 'CollectionPage',
      '@id': url,
      name,
      description: hub.description,
      url,
      inLanguage: 'en-IN',
      isPartOf: {
        '@type': 'WebSite',
        name: siteConfig.name,
        url: siteConfig.url,
      },
      about: {
        '@type': 'Thing',
        name: hub.title,
        description: hub.description,
      },
      mainEntity: {
        '@type': 'ItemList',
        name: `${hub.title} on Chapters.aur.Chai`,
        numberOfItems: allItems.length,
        itemListElement,
      },
    },
    buildBreadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Genres', path: '/genres' },
      { name: hub.title, path: `/genres/${hub.slug}` },
    ]),
  ];

  if (content.topicHub) {
    schemas.push({
      '@context': SCHEMA_CONTEXT,
      '@type': 'WebPage',
      name: content.topicHub.title,
      url: canonicalUrl(content.topicHub.href),
      description: `Related reading guide for ${hub.title}`,
    });
  }

  return schemas;
}
