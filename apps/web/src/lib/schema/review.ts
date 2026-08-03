import { siteConfig, canonicalUrl } from '@/lib/seo';
import { SCHEMA_CONTEXT, compact, pageUrl, absImage } from './utils';
import { buildBookSchema } from './book';
import type { BookReviewInput, JsonLdObject } from './types';

/**
 * Book review page — returns Review + standalone Book schemas (Google rich-result friendly).
 * Review.itemReviewed references the book; rating included when available.
 */
export function buildBookReviewSchemas(input: BookReviewInput): JsonLdObject[] {
  const url = pageUrl(input.path);
  const book = buildBookSchema({
    ...input.book,
    url: input.book.url || url,
  });

  const review = compact({
    '@context': SCHEMA_CONTEXT,
    '@type': 'Review',
    '@id': `${url}#review`,
    headline: input.headline,
    name: input.headline,
    reviewBody: input.reviewBody || input.description,
    description: input.description,
    url,
    datePublished: input.datePublished,
    dateModified: input.dateModified || input.datePublished,
    image: absImage(input.image),
    inLanguage: 'en-IN',
    author: {
      '@type': 'Person',
      name: input.authorName || siteConfig.author,
      url: canonicalUrl('/about'),
    },
    publisher: {
      '@type': 'Organization',
      '@id': `${siteConfig.url.replace(/\/$/, '')}/#organization`,
      name: siteConfig.name,
      url: siteConfig.url,
    },
    itemReviewed: {
      '@type': 'Book',
      name: input.book.name,
      author: input.book.author
        ? { '@type': 'Person', name: input.book.author }
        : undefined,
      image: absImage(input.book.image),
      url: input.book.url,
    },
    ...(typeof input.rating === 'number' &&
      input.rating >= 1 &&
      input.rating <= 5 && {
        reviewRating: {
          '@type': 'Rating',
          ratingValue: input.rating,
          bestRating: 5,
          worstRating: 1,
        },
      }),
    keywords: input.tags?.length ? input.tags.join(', ') : undefined,
  });

  // Standalone Book schema for AI-search / entity graphs
  const bookStandalone = compact({
    ...book,
    '@id': `${url}#book`,
  });

  return [review, bookStandalone];
}
