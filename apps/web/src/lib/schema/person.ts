import { siteConfig, canonicalUrl } from '@/lib/seo';
import { SCHEMA_CONTEXT, compact, pageUrl, absImage } from './utils';
import type { JsonLdObject, SpotlightPersonInput } from './types';

/** Site author Person schema (Anshika Mishra). */
export function buildSitePersonSchema(): JsonLdObject {
  return compact({
    '@context': SCHEMA_CONTEXT,
    '@type': 'Person',
    '@id': `${siteConfig.url.replace(/\/$/, '')}/#person`,
    name: siteConfig.author,
    url: canonicalUrl('/about'),
    image: absImage('/logo.png'),
    description:
      'Book reviewer, proofreader, and author strategist. Helps authors with book visibility, reviews, recommendations, spotlights, beta reading, and feedback. Based in Abu Dhabi — India & UAE.',
    jobTitle: 'Book Reviewer, Proofreader & Author Strategist',
    worksFor: {
      '@type': 'Organization',
      '@id': `${siteConfig.url.replace(/\/$/, '')}/#organization`,
      name: siteConfig.name,
      url: siteConfig.url,
    },
    sameAs: Object.values(siteConfig.social),
    knowsAbout: [
      'book reviews',
      'proofreading',
      'author strategy',
      'book recommendations',
      'author spotlights',
      'beta reading',
      'book visibility',
      'literary services',
    ],
  });
}

/** Author spotlight featured author Person schema. */
export function buildSpotlightPersonSchema(input: SpotlightPersonInput): JsonLdObject {
  const url = pageUrl(input.path);
  const personId = `${url}#person`;
  return compact({
    '@context': SCHEMA_CONTEXT,
    '@type': 'Person',
    '@id': personId,
    name: input.name,
    description: input.description,
    image: absImage(input.image),
    url: input.url?.trim() || url,
    jobTitle: 'Author',
    sameAs: input.sameAs?.filter(Boolean),
    knowsAbout: input.genres?.length ? input.genres : undefined,
    subjectOf: input.notableWorks?.length
      ? input.notableWorks.map((work) => ({
          '@type': 'Book',
          name: work,
          author: { '@type': 'Person', name: input.name },
        }))
      : undefined,
  });
}
