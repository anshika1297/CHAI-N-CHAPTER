import { getFetchBaseUrl } from '@/lib/apiBase';
import type { CatalogBook } from './catalog';

export type RelatedBook = CatalogBook & {
  matchScore?: number;
  matchReasons?: string[];
};

export type RelatedBooksSeed = {
  bookSlug?: string;
  excludeSlugs?: string[];
  author?: string;
  genre?: string;
  tags?: string[];
  recommendationSlug?: string;
  limit?: number;
};

export async function fetchRelatedBooks(seed: RelatedBooksSeed): Promise<RelatedBook[]> {
  const params = new URLSearchParams();
  if (seed.bookSlug?.trim()) params.set('bookSlug', seed.bookSlug.trim());
  if (seed.author?.trim()) params.set('author', seed.author.trim());
  if (seed.genre?.trim()) params.set('genre', seed.genre.trim());
  if (seed.recommendationSlug?.trim()) params.set('recommendationSlug', seed.recommendationSlug.trim());
  if (seed.tags?.length) params.set('tags', seed.tags.join(','));
  if (seed.excludeSlugs?.length) params.set('exclude', seed.excludeSlugs.join(','));
  params.set('limit', String(seed.limit ?? 6));

  try {
    const res = await fetch(`${getFetchBaseUrl()}/api/books/related?${params}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 120 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { books?: RelatedBook[] };
    return Array.isArray(data.books) ? data.books : [];
  } catch {
    return [];
  }
}
