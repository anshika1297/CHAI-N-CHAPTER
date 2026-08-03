import type { GenreHubDefinition } from '@/lib/metadata/types';
import { genreToSlug, normGenre } from '@/lib/genres/vocabulary';

/** Turn a URL slug into a display label (e.g. indian-mythology → Indian Mythology). */
export function slugToGenreLabel(slug: string): string {
  return slug
    .trim()
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Build a genre hub for any CMS genre label — auto-pages for new genres. */
export function dynamicGenreHubFromLabel(label: string): GenreHubDefinition {
  const trimmed = label.trim();
  const slug = genreToSlug(trimmed);
  return {
    slug,
    title: trimmed,
    titleSuffix: 'Books',
    description: `Explore book reviews, recommendations, author spotlights, and reading lists for ${trimmed} on Chapters.aur.Chai.`,
    genres: [trimmed],
    bookGenres: [trimmed],
    categories: [trimmed],
    tags: [trimmed.toLowerCase(), ...trimmed.toLowerCase().split(/\s+/)],
  };
}

export function dynamicGenreHubFromSlug(slug: string, label?: string): GenreHubDefinition {
  const resolved = label?.trim() || slugToGenreLabel(slug);
  const hub = dynamicGenreHubFromLabel(resolved);
  return { ...hub, slug: slug.trim().toLowerCase() };
}

export function genreLabelsMatch(a: string, b: string): boolean {
  return normGenre(a) === normGenre(b);
}

export function bookMatchesGenreLabels(
  book: { genre?: string; genres?: string[] },
  labels: string[]
): boolean {
  if (!labels.length) return false;
  const set = new Set(labels.map(normGenre));
  const candidates = [book.genre, ...(book.genres ?? [])].filter(Boolean) as string[];
  return candidates.some((g) => set.has(normGenre(g)));
}
