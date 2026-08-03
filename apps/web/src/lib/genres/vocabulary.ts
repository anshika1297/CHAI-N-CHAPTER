/** Canonical book genres for CMS, catalog, and genre hub matching. */
export const BOOK_GENRE_OPTIONS = [
  'Indian Mythology',
  'Mythology',
  'Historical Fiction',
  'Literary Fiction',
  'Contemporary Fiction',
  'Classics',
  'Fiction',
  'Romance',
  'Mystery',
  'Thriller',
  'Non-Fiction',
  'Self-Help',
  'Indian Literature',
  'Poetry',
  'Memoir',
] as const;

export type BookGenreOption = (typeof BOOK_GENRE_OPTIONS)[number];

const GENRE_SLUG_SET = new Set(
  BOOK_GENRE_OPTIONS.map((g) => g.toLowerCase().replace(/\s+/g, '-'))
);

/** Category values that map to book genres (not content format). */
export const CATEGORY_AS_GENRE = new Set(
  BOOK_GENRE_OPTIONS.map((g) => g.toLowerCase())
);

export function normGenre(s: string): string {
  return s.trim().toLowerCase();
}

export function genreToSlug(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export function isBookGenreCategory(category: string): boolean {
  return CATEGORY_AS_GENRE.has(normGenre(category));
}
