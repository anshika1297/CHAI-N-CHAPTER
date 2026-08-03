import { siteConfig, canonicalUrl } from '@/lib/seo';
import { SCHEMA_CONTEXT, compact, pageUrl, absImage } from './utils';
import type { ArticleInput, BlogPostingInput, JsonLdObject } from './types';

function publisherOrg() {
  return {
    '@type': 'Organization' as const,
    '@id': `${siteConfig.url.replace(/\/$/, '')}/#organization`,
    name: siteConfig.name,
    url: siteConfig.url,
    logo: {
      '@type': 'ImageObject' as const,
      url: `${siteConfig.url.replace(/\/$/, '')}/logo.png`,
    },
  };
}

/** Recommendation list pages — Article schema. */
export function buildArticleSchema(input: ArticleInput): JsonLdObject {
  const url = pageUrl(input.path);
  return compact({
    '@context': SCHEMA_CONTEXT,
    '@type': 'Article',
    headline: input.headline,
    description: input.description,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    image: absImage(input.image),
    datePublished: input.datePublished,
    dateModified: input.dateModified || input.datePublished,
    author: {
      '@type': 'Person',
      name: input.authorName || siteConfig.author,
      url: canonicalUrl('/about'),
    },
    publisher: publisherOrg(),
    keywords: input.tags?.length ? input.tags.join(', ') : undefined,
    inLanguage: 'en-IN',
  });
}

/** Musing pages — BlogPosting schema. */
export function buildBlogPostingSchema(input: BlogPostingInput): JsonLdObject {
  const url = pageUrl(input.path);
  return compact({
    '@context': SCHEMA_CONTEXT,
    '@type': 'BlogPosting',
    headline: input.headline,
    description: input.description,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    image: absImage(input.image),
    datePublished: input.datePublished,
    dateModified: input.dateModified || input.datePublished,
    author: {
      '@type': 'Person',
      name: input.authorName || siteConfig.author,
      url: canonicalUrl('/about'),
    },
    publisher: publisherOrg(),
    isPartOf: {
      '@type': 'Blog',
      name: 'Her Musings Verse',
      url: canonicalUrl('/musings'),
    },
    keywords: input.tags?.length ? input.tags.join(', ') : undefined,
    inLanguage: 'en-IN',
  });
}
