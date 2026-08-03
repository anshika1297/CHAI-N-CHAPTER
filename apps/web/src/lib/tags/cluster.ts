import { TOPIC_HUBS } from '@/lib/metadata/topicHubs';
import { tagToSlug, normalizeTagLabel } from './normalize';
import type { TagIndexEntry } from './types';

/**
 * Topic clustering — maps tags to curated topic hubs.
 * Extend TOPIC_HUBS.tags to grow clusters without route changes.
 */
export function topicClustersForTag(tagSlug: string): string[] {
  const slug = tagSlug.trim().toLowerCase();
  return TOPIC_HUBS.filter((hub) =>
    (hub.tags ?? []).some((t) => tagToSlug(t) === slug)
  ).map((hub) => hub.slug);
}

/** Tags that co-occur in the same topic hub definitions (cluster siblings). */
export function siblingTagsInClusters(tagSlug: string): string[] {
  const slug = tagSlug.trim().toLowerCase();
  const siblings = new Set<string>();
  for (const hub of TOPIC_HUBS) {
    if (!(hub.tags ?? []).some((t) => tagToSlug(t) === slug)) continue;
    for (const t of hub.tags ?? []) {
      const s = tagToSlug(t);
      if (s && s !== slug) siblings.add(s);
    }
  }
  return [...siblings];
}

/** Related tags from co-occurrence on published content (ranked by frequency). */
export function relatedTagsFromItems(
  items: { tags: string[] }[],
  tagSlug: string,
  limit = 8
): TagIndexEntry[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const itemSlugs = new Set(item.tags.map((t) => tagToSlug(t)).filter(Boolean));
    if (!itemSlugs.has(tagSlug)) continue;
    for (const s of itemSlugs) {
      if (s === tagSlug) continue;
      counts.set(s, (counts.get(s) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([slug, count]) => ({
      slug,
      label: slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      count,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);
}

export function tagsMatch(tagA: string, tagB: string): boolean {
  return normalizeTagLabel(tagA) === normalizeTagLabel(tagB);
}
