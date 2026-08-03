import { Page } from '../models/Page.js';
import { filterPublishedPageItems } from '../utils/pageContentPublish.js';
import { readTags } from '../utils/tags.js';
import { rewriteImageUrlsInObject } from '../routes/upload.js';

export type ReadNextContentKind = 'blog' | 'recommendations' | 'musings';

export type ReadNextCard = {
  slug: string;
  title: string;
  category: string;
  readingTime: number;
  image: string;
};

const PAGE_SLUG: Record<ReadNextContentKind, string> = {
  blog: 'blog',
  recommendations: 'recommendations',
  musings: 'musings',
};

const ITEMS_KEY: Record<ReadNextContentKind, 'posts' | 'items'> = {
  blog: 'posts',
  recommendations: 'items',
  musings: 'items',
};

const DEFAULT_CATEGORY: Record<ReadNextContentKind, string> = {
  blog: 'Book Review',
  recommendations: 'Book List',
  musings: 'Reflection',
};

type PageItem = Record<string, unknown>;

const CACHE_MS = 5 * 60 * 1000;
const pageCache = new Map<string, { at: number; items: PageItem[] }>();

/** Drop cached published items after CMS save so read-next reflects edits immediately. */
export function invalidateReadNextCache(kind?: ReadNextContentKind): void {
  if (kind) {
    pageCache.delete(PAGE_SLUG[kind]);
    return;
  }
  for (const slug of Object.values(PAGE_SLUG)) {
    pageCache.delete(slug);
  }
}

function getStr(item: PageItem, key: string): string {
  const v = item[key];
  return typeof v === 'string' ? v.trim() : '';
}

function normSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

function publishedAtMs(item: PageItem): number {
  const raw = getStr(item, 'publishedAt');
  if (!raw) return 0;
  const t = new Date(raw).getTime();
  return Number.isFinite(t) ? t : 0;
}

function tagOverlap(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const setB = new Set(b);
  let n = 0;
  for (const t of a) {
    if (setB.has(t)) n += 1;
  }
  return n;
}

function toCard(item: PageItem, kind: ReadNextContentKind): ReadNextCard | null {
  const slug = getStr(item, 'slug');
  const title = getStr(item, 'title');
  if (!slug || !title) return null;
  const rt = item.readingTime;
  return {
    slug,
    title,
    category: getStr(item, 'category') || DEFAULT_CATEGORY[kind],
    readingTime: typeof rt === 'number' ? rt : Number(rt) || (kind === 'musings' ? 3 : 5),
    image: typeof item.image === 'string' ? item.image : '',
  };
}

async function loadPublishedItems(kind: ReadNextContentKind): Promise<PageItem[]> {
  const pageSlug = PAGE_SLUG[kind];
  const hit = pageCache.get(pageSlug);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.items;

  const page = await Page.findOne({ slug: pageSlug }).lean();
  const contentKey = ITEMS_KEY[kind];
  const raw =
    page?.content && typeof page.content === 'object' && Array.isArray((page.content as PageItem)[contentKey])
      ? ((page.content as PageItem)[contentKey] as unknown[])
      : [];

  const items = filterPublishedPageItems(rewriteImageUrlsInObject(raw) as PageItem[]);
  pageCache.set(pageSlug, { at: Date.now(), items });
  return items;
}

function pickTier(
  pool: PageItem[],
  picked: Set<string>,
  selected: PageItem[],
  limit: number
): void {
  for (const item of pool) {
    if (selected.length >= limit) break;
    const key = normSlug(getStr(item, 'slug'));
    if (!key || picked.has(key)) continue;
    picked.add(key);
    selected.push(item);
  }
}

/**
 * Rank related content: shared tags → same author → same category → newest.
 * Single Page query per content type (cached). In-memory ranking only.
 */
export async function resolveReadNext(
  kind: ReadNextContentKind,
  currentSlug: string,
  limit = 4
): Promise<ReadNextCard[]> {
  const safeLimit = Math.min(8, Math.max(1, limit));
  const items = await loadPublishedItems(kind);
  const currentKey = normSlug(currentSlug);
  const current = items.find((i) => normSlug(getStr(i, 'slug')) === currentKey);
  if (!current) return [];

  const currentTags = readTags(current);
  const currentAuthor = getStr(current, 'author').toLowerCase();
  const currentCategory = getStr(current, 'category').toLowerCase();
  const candidates = items.filter((i) => normSlug(getStr(i, 'slug')) !== currentKey);

  const selected: PageItem[] = [];
  const picked = new Set<string>();
  const byNewest = (a: PageItem, b: PageItem) => publishedAtMs(b) - publishedAtMs(a);

  if (currentTags.length > 0) {
    const tier = candidates
      .filter((i) => tagOverlap(readTags(i), currentTags) > 0)
      .sort((a, b) => {
        const diff = tagOverlap(readTags(b), currentTags) - tagOverlap(readTags(a), currentTags);
        return diff !== 0 ? diff : byNewest(a, b);
      });
    pickTier(tier, picked, selected, safeLimit);
  }

  if (selected.length < safeLimit && currentAuthor) {
    const tier = candidates
      .filter((i) => !picked.has(normSlug(getStr(i, 'slug'))) && getStr(i, 'author').toLowerCase() === currentAuthor)
      .sort(byNewest);
    pickTier(tier, picked, selected, safeLimit);
  }

  if (selected.length < safeLimit && currentCategory) {
    const tier = candidates
      .filter(
        (i) => !picked.has(normSlug(getStr(i, 'slug'))) && getStr(i, 'category').toLowerCase() === currentCategory
      )
      .sort(byNewest);
    pickTier(tier, picked, selected, safeLimit);
  }

  if (selected.length < safeLimit) {
    const tier = candidates.filter((i) => !picked.has(normSlug(getStr(i, 'slug')))).sort(byNewest);
    pickTier(tier, picked, selected, safeLimit);
  }

  return selected
    .map((i) => toCard(i, kind))
    .filter((c): c is ReadNextCard => c != null);
}
