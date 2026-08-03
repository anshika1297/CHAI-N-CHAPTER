import { AuthorSpotlight } from '../models/AuthorSpotlight.js';
import { Page } from '../models/Page.js';
import type { CommentContentType } from '../models/Comment.js';
import { isPageContentPublished } from '../utils/pageContentPublish.js';

const PAGE_SLUG: Record<Exclude<CommentContentType, 'author-spotlight'>, string> = {
  blog: 'blog',
  recommendations: 'recommendations',
  musings: 'musings',
};

const ITEM_KEY: Record<Exclude<CommentContentType, 'author-spotlight'>, 'posts' | 'items'> = {
  blog: 'posts',
  recommendations: 'items',
  musings: 'items',
};

function normSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

function isSpotlightVisible(doc: { isPublished?: boolean; publishDate?: Date | string }): boolean {
  if (!doc.isPublished) return false;
  if (!doc.publishDate) return true;
  return new Date(doc.publishDate) <= new Date();
}

/** Verify published content exists before accepting a comment. */
export async function commentTargetExists(
  contentType: CommentContentType,
  contentSlug: string
): Promise<boolean> {
  const key = normSlug(contentSlug);
  if (!key) return false;

  if (contentType === 'author-spotlight') {
    const doc = await AuthorSpotlight.findOne({ slug: key }).lean();
    return Boolean(doc && isSpotlightVisible(doc));
  }

  const pageSlug = PAGE_SLUG[contentType];
  const page = await Page.findOne({ slug: pageSlug }).lean();
  const content = page?.content as Record<string, unknown> | undefined;
  const arrKey = ITEM_KEY[contentType];
  const items = content && Array.isArray(content[arrKey]) ? (content[arrKey] as Record<string, unknown>[]) : [];
  const item = items.find((i) => normSlug(String(i.slug ?? '')) === key);
  return Boolean(item && isPageContentPublished(item));
}
