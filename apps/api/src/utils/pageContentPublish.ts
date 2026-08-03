/** Page blob items (blog posts, recommendations, musings) — draft unless isPublished is true. */

export type PageContentItem = Record<string, unknown>;

/** Legacy items without `isPublished` stay visible on the public site. */
export function isPageContentPublished(item: PageContentItem): boolean {
  return item.isPublished !== false;
}

export function filterPublishedPageItems<T extends PageContentItem>(items: T[]): T[] {
  return items.filter(isPageContentPublished);
}
