import type { ContentUpdateEntry, ContentUpdateReason } from '../types/contentFreshness.js';
import { UPDATE_HISTORY_MAX } from '../types/contentFreshness.js';

const META_KEYS = new Set(['updatedAt', 'updateHistory', 'subscribersEmailedAt']);

function nowIso(): string {
  return new Date().toISOString();
}

function stripMeta(item: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(item)) {
    if (!META_KEYS.has(key)) out[key] = value;
  }
  return out;
}

function itemsEqual(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  return JSON.stringify(stripMeta(a)) === JSON.stringify(stripMeta(b));
}

function readHistory(raw: Record<string, unknown> | undefined): ContentUpdateEntry[] {
  if (!Array.isArray(raw?.updateHistory)) return [];
  return raw.updateHistory
    .filter((e): e is ContentUpdateEntry => {
      if (!e || typeof e !== 'object') return false;
      const entry = e as ContentUpdateEntry;
      return typeof entry.at === 'string' && Boolean(entry.at.trim());
    })
    .map((e) => ({
      at: e.at.trim(),
      reason: e.reason === 'publish' ? 'publish' : 'content',
    }));
}

function appendHistory(
  history: ContentUpdateEntry[],
  reason: ContentUpdateReason
): ContentUpdateEntry[] {
  return [...history, { at: nowIso(), reason }].slice(-UPDATE_HISTORY_MAX);
}

function stampItem(
  incoming: Record<string, unknown>,
  existing: Record<string, unknown> | undefined
): Record<string, unknown> {
  const out = { ...incoming };
  delete out.updateHistory;

  if (!existing) {
    const at = nowIso();
    out.updatedAt = at;
    out.updateHistory = [{ at, reason: 'publish' }];
    return out;
  }

  const history = readHistory(existing);
  const existingUpdated =
    typeof existing.updatedAt === 'string' && existing.updatedAt.trim()
      ? existing.updatedAt.trim()
      : undefined;

  if (itemsEqual(incoming, existing)) {
    if (existingUpdated) out.updatedAt = existingUpdated;
    if (history.length) out.updateHistory = history;
    return out;
  }

  const at = nowIso();
  out.updatedAt = at;
  out.updateHistory = appendHistory(history, 'content');
  return out;
}

type EditorialPageSlug = 'blog' | 'recommendations' | 'musings';

/** Stamp per-item updatedAt + updateHistory when Page blob editorial content is saved. */
export function stampPageContentFreshness(
  slug: EditorialPageSlug,
  incomingContent: Record<string, unknown>,
  existingContent: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  const arrayKey = slug === 'blog' ? 'posts' : 'items';
  const incomingItems = Array.isArray(incomingContent[arrayKey])
    ? (incomingContent[arrayKey] as Record<string, unknown>[])
    : [];
  const existingItems = Array.isArray(existingContent?.[arrayKey])
    ? (existingContent![arrayKey] as Record<string, unknown>[])
    : [];

  const existingBySlug = new Map<string, Record<string, unknown>>();
  for (const item of existingItems) {
    const s = String(item.slug ?? '').trim().toLowerCase();
    if (s) existingBySlug.set(s, item);
  }

  const stamped = incomingItems.map((item) => {
    const s = String(item.slug ?? '').trim().toLowerCase();
    const existing = s ? existingBySlug.get(s) : undefined;
    return stampItem(item, existing);
  });

  return { ...incomingContent, [arrayKey]: stamped };
}

const SPOTLIGHT_CONTENT_KEYS = [
  'slug',
  'name',
  'tagline',
  'coverImage',
  'profileImage',
  'introduction',
  'whoIsHtml',
  'bio',
  'genres',
  'connectLinks',
  'socialLinks',
  'featuredBooks',
  'blogLinks',
  'readingPairings',
  'faq',
  'interviewSectionTitle',
  'interview',
  'seoTitle',
  'seoDescription',
  'socialShareImage',
  'ogImage',
  'tags',
  'canonicalUrl',
  'startHere',
  'notableWorks',
  'similarAuthors',
] as const;

/** Stable hash of spotlight editorial fields (excludes publish/meta). */
export function hashSpotlightContent(source: Record<string, unknown>): string {
  const picked: Record<string, unknown> = {};
  for (const key of SPOTLIGHT_CONTENT_KEYS) {
    if (key in source) picked[key] = source[key];
  }
  return JSON.stringify(picked);
}

export function appendSpotlightUpdateHistory(
  history: ContentUpdateEntry[] | undefined,
  reason: ContentUpdateReason = 'content'
): ContentUpdateEntry[] {
  return appendHistory(readHistory({ updateHistory: history }), reason);
}
