/** Tag normalization — mirrors apps/web/src/lib/tags/normalize.ts */

export function normalizeTagLabel(tag: string): string {
  return tag.trim().toLowerCase();
}

export function tagToSlug(tag: string): string {
  return normalizeTagLabel(tag).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function slugToTagLabel(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function readTags(raw: unknown): string[] {
  const o = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null;
  if (!o) return [];
  const fromTags = Array.isArray(o.tags)
    ? (o.tags as unknown[]).map((t) => normalizeTagLabel(String(t))).filter(Boolean)
    : [];
  if (fromTags.length) return [...new Set(fromTags)];
  const legacy = Array.isArray(o.seoKeywords)
    ? (o.seoKeywords as unknown[]).map((t) => normalizeTagLabel(String(t))).filter(Boolean)
    : [];
  return [...new Set(legacy)];
}
