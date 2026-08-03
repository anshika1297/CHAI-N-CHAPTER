import { Page, type PageSlug } from '../models/Page.js';
import { isPageContentPublished, type PageContentItem } from './pageContentPublish.js';

function getItemSlug(item: PageContentItem): string {
  const slug = item.slug;
  const title = item.title;
  if (typeof slug === 'string' && slug.trim()) return slug.trim().toLowerCase();
  if (typeof title === 'string' && title.trim()) {
    return title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  return '';
}

export async function findPublishedPageItemBySlug(
  pageSlug: 'blog' | 'recommendations' | 'musings',
  slugParam: string
): Promise<PageContentItem> {
  const slug = slugParam.trim().toLowerCase();
  if (!slug) throw new Error('Slug is required.');

  const itemsKey = pageSlug === 'blog' ? 'posts' : 'items';
  const page = await Page.findOne({ slug: pageSlug as PageSlug });
  const content = page?.content;
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    throw new Error('Content not found.');
  }
  const arr = (content as Record<string, unknown>)[itemsKey];
  if (!Array.isArray(arr)) throw new Error('Content not found.');

  const item = arr.find((x): x is PageContentItem => {
    if (x == null || typeof x !== 'object') return false;
    return getItemSlug(x as PageContentItem) === slug;
  });

  if (!item) throw new Error(`No ${pageSlug} item found for slug "${slug}".`);
  if (!isPageContentPublished(item)) {
    throw new Error('This item is still a draft. Set it to Live before emailing subscribers.');
  }
  return item;
}

export function getPageItemsKey(pageSlug: 'blog' | 'recommendations' | 'musings'): 'posts' | 'items' {
  return pageSlug === 'blog' ? 'posts' : 'items';
}
