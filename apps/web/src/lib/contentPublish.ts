/** Draft/publish for blog posts, recommendations, and musings stored in Page content blobs. */

export function isContentPublished(item: { isPublished?: boolean }): boolean {
  return item.isPublished !== false;
}

export function readIsPublished(raw: unknown): boolean {
  if (raw && typeof raw === 'object' && !Array.isArray(raw) && (raw as { isPublished?: boolean }).isPublished === false) {
    return false;
  }
  return true;
}

/** Toggle publish flag; sets publish date when going live if missing. */
export function withToggledPublish<T extends { isPublished?: boolean; publishedAt?: string }>(item: T): T {
  const live = isContentPublished(item);
  if (live) {
    return { ...item, isPublished: false };
  }
  const today = new Date().toISOString().slice(0, 10);
  return {
    ...item,
    isPublished: true,
    publishedAt: item.publishedAt?.trim() ? item.publishedAt : today,
  };
}
