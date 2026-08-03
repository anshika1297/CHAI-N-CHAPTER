import type { TaggedContentKind } from './types';

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

/** Best cover/profile image path for a tagged content item. */
export function pickThumbnail(kind: TaggedContentKind, raw: Record<string, unknown>): string | undefined {
  if (kind === 'author-spotlight' || kind === 'shop-spotlight') {
    return str(raw.coverImage) || str(raw.profileImage) || str(raw.ogImage) || undefined;
  }
  if (kind === 'musing') {
    return str(raw.image) || str(raw.coverImage) || undefined;
  }
  return str(raw.image) || undefined;
}
