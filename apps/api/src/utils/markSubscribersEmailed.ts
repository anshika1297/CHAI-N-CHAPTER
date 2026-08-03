import { Page, type PageSlug } from '../models/Page.js';
import { AuthorSpotlight } from '../models/AuthorSpotlight.js';
import type { PageContentItem } from './pageContentPublish.js';

const BOOK_CLUBS_SLUG: PageSlug = 'book-clubs';

function itemSlug(item: PageContentItem): string {
  const slug = item.slug;
  const title = item.title;
  if (typeof slug === 'string' && slug.trim()) return slug.trim().toLowerCase();
  if (typeof title === 'string' && title.trim()) {
    return title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  return '';
}

export function assertNotYetEmailed(item: { subscribersEmailedAt?: unknown }): void {
  const at = item.subscribersEmailedAt;
  if (at instanceof Date || (typeof at === 'string' && at.trim())) {
    throw new Error('Subscribers were already emailed about this content.');
  }
}

export async function markPageItemSubscribersEmailed(
  pageSlug: 'blog' | 'recommendations' | 'musings',
  slugParam: string
): Promise<void> {
  const slug = slugParam.trim().toLowerCase();
  const itemsKey = pageSlug === 'blog' ? 'posts' : 'items';
  const page = await Page.findOne({ slug: pageSlug });
  if (!page?.content || typeof page.content !== 'object' || Array.isArray(page.content)) return;

  const content = { ...(page.content as Record<string, unknown>) };
  const arr = content[itemsKey];
  if (!Array.isArray(arr)) return;

  const now = new Date().toISOString();
  let changed = false;
  const next = arr.map((x) => {
    if (x == null || typeof x !== 'object') return x;
    const item = x as PageContentItem;
    if (itemSlug(item) !== slug) return x;
    changed = true;
    return { ...item, subscribersEmailedAt: now };
  });
  if (!changed) return;

  content[itemsKey] = next;
  page.content = content;
  page.updatedAt = new Date();
  await page.save();
}

export async function markBookClubSubscribersEmailed(bookClubId: string): Promise<void> {
  const page = await Page.findOne({ slug: BOOK_CLUBS_SLUG });
  if (!page?.content || typeof page.content !== 'object' || Array.isArray(page.content)) return;

  const content = { ...(page.content as Record<string, unknown>) };
  const key = Array.isArray(content.pageClubs) ? 'pageClubs' : Array.isArray(content.clubs) ? 'clubs' : null;
  if (!key) return;

  const arr = content[key];
  if (!Array.isArray(arr)) return;

  const now = new Date().toISOString();
  let changed = false;
  const next = arr.map((c) => {
    if (c == null || typeof c !== 'object') return c;
    const club = c as Record<string, unknown>;
    if (String(club.id) !== bookClubId) return c;
    changed = true;
    return { ...club, subscribersEmailedAt: now };
  });
  if (!changed) return;

  content[key] = next;
  page.content = content;
  page.updatedAt = new Date();
  await page.save();
}

export async function markAuthorSpotlightSubscribersEmailed(id: string): Promise<void> {
  await AuthorSpotlight.findByIdAndUpdate(id, { subscribersEmailedAt: new Date() });
}
