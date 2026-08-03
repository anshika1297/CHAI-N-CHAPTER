/** Normalize tag labels ↔ URL slugs (single source of truth). */

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

/** Public tag hub path */
export function tagPath(slug: string): string {
  return `/tags/${encodeURIComponent(slug.trim().toLowerCase())}`;
}

export function tagPathFromLabel(tag: string): string {
  return tagPath(tagToSlug(tag));
}
