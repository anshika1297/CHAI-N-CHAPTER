const BOOK_GENRES = new Set([
  'indian mythology',
  'mythology',
  'historical fiction',
  'literary fiction',
  'contemporary fiction',
  'classics',
  'fiction',
  'romance',
  'mystery',
  'thriller',
  'non-fiction',
  'self-help',
  'indian literature',
  'poetry',
  'memoir',
]);

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function record(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function norm(s: string): string {
  return s.trim().toLowerCase();
}

/** Read book genre(s) from CMS content — prefers `genres[]`, falls back to genre-like `category`. */
export function readGenresFromContent(raw: unknown): string[] {
  const o = record(raw);
  if (!o) return [];

  const fromGenres = Array.isArray(o.genres)
    ? (o.genres as unknown[]).map((g) => str(g)).filter(Boolean)
    : [];
  if (fromGenres.length) return [...new Set(fromGenres)];

  const category = str(o.category);
  if (category && BOOK_GENRES.has(norm(category))) return [category];

  if (Array.isArray(o.themes)) {
    const themes = (o.themes as unknown[]).map((t) => str(t)).filter(Boolean);
    if (themes.length) return themes;
  }

  return [];
}

export function primaryGenre(genres: string[]): string | undefined {
  return genres[0]?.trim() || undefined;
}
