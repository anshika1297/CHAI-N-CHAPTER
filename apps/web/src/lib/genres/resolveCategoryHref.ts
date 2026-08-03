import { GENRE_HUBS, getGenreHubBySlug } from '@/lib/metadata/genreHubs';
import { genreToSlug } from '@/lib/genres/vocabulary';
import { tagPathFromLabel } from '@/lib/tags';

function norm(s: string): string {
  return s.trim().toLowerCase();
}

function matchesList(value: string, list: string[] | undefined): boolean {
  if (!value.trim() || !list?.length) return false;
  const v = norm(value);
  return list.some((item) => norm(item) === v);
}

export type GenreHubLink = { slug: string; href: string; title: string };

/** Map a post category to a genre pillar page when possible. */
export function resolveGenreHubForCategory(category: string): GenreHubLink | null {
  const trimmed = category.trim();
  if (!trimmed) return null;

  const slugFromLabel = genreToSlug(trimmed);
  const direct = getGenreHubBySlug(slugFromLabel);
  if (direct) {
    return { slug: direct.slug, href: `/genres/${direct.slug}`, title: direct.title };
  }

  for (const hub of GENRE_HUBS) {
    if (
      matchesList(trimmed, hub.categories) ||
      matchesList(trimmed, hub.genres) ||
      matchesList(trimmed, hub.bookGenres)
    ) {
      return { slug: hub.slug, href: `/genres/${hub.slug}`, title: hub.title };
    }
  }

  return null;
}

export type EditorialContentType = 'blog' | 'recommendations' | 'musings';

/** Prefer genre hub; otherwise link to the matching tag hub (never query-param duplicates). */
export function resolveCategoryListingHref(
  category: string,
  _contentType: EditorialContentType
): string | null {
  const trimmed = category.trim();
  if (!trimmed) return null;

  const hub = resolveGenreHubForCategory(trimmed);
  if (hub) return hub.href;

  return tagPathFromLabel(trimmed);
}
