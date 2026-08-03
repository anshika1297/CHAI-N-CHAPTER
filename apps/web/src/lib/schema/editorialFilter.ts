import type { TaggedContentRef } from '@/lib/tags';

const EDITORIAL_KINDS = new Set<TaggedContentRef['kind']>([
  'review',
  'recommendation',
  'musing',
  'author-spotlight',
]);

/** Indexable editorial items only — excludes noindex shop mirrors from JSON-LD. */
export function editorialTaggedItems(items: TaggedContentRef[]): TaggedContentRef[] {
  return items.filter((item) => EDITORIAL_KINDS.has(item.kind));
}
