/**
 * @deprecated Import from '@/lib/schema' instead.
 * Thin re-exports for backward compatibility.
 */
import type { ContentFaqItem } from '@/lib/contentFields';
import { buildArticleSchema, buildBlogPostingSchema } from '@/lib/schema/article';
import { buildFaqPageSchema } from '@/lib/schema/faq';

export function buildArticleJsonLd(opts: {
  headline: string;
  description: string;
  path: string;
  image?: string;
  datePublished?: string;
  authorName?: string;
  tags?: string[];
}) {
  return buildArticleSchema(opts);
}

export function buildBlogPostingJsonLd(opts: {
  headline: string;
  description: string;
  path: string;
  image?: string;
  datePublished?: string;
  authorName?: string;
  tags?: string[];
}) {
  return buildBlogPostingSchema(opts);
}

export function buildFaqPageJsonLd(items: ContentFaqItem[]) {
  return buildFaqPageSchema(items);
}
