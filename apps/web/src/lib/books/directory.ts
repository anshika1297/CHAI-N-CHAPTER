import { ssrApiFetch } from '@/lib/ssrApiFetch';
import { unstable_noStore as noStore } from 'next/cache';
import type { BookSourceRef, CatalogBook } from '@/lib/books/catalog';

export type BookDirectorySort = 'az' | 'recent' | 'referenced';

export type BookDirectoryFacets = {
  authors: string[];
  genres: string[];
  contentTypes: BookSourceRef['contentType'][];
};

export type DirectoryBook = CatalogBook & {
  referenceCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type BookDirectoryResult = {
  books: DirectoryBook[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  facets?: BookDirectoryFacets;
};

import type { GenreHubDefinition } from '@/lib/metadata/types';

export async function fetchBooksForGenreHub(hub: GenreHubDefinition): Promise<DirectoryBook[]> {
  const labels = [
    ...(hub.bookGenres ?? []),
    ...(hub.genres ?? []),
    ...(hub.categories ?? []),
  ].filter(Boolean);
  if (!labels.length) return [];

  const { books } = await fetchBookDirectory({
    limit: 500,
    includeFacets: false,
    revalidate: 300,
    genres: labels,
  });
  return books;
}

export const BOOKS_DIRECTORY_PAGE_SIZE = 24;

export async function fetchBookDirectory(options?: {
  limit?: number;
  page?: number;
  sort?: BookDirectorySort;
  includeFacets?: boolean;
  revalidate?: number;
  genre?: string;
  genres?: string[];
  q?: string;
  author?: string;
  contentType?: BookSourceRef['contentType'];
}): Promise<BookDirectoryResult> {
  noStore();
  const limit = options?.limit ?? BOOKS_DIRECTORY_PAGE_SIZE;
  const page = Math.max(1, options?.page ?? 1);
  const sort = options?.sort ?? 'az';
  const params = new URLSearchParams({
    limit: String(limit),
    sort,
    page: String(page),
  });
  if (options?.includeFacets) params.set('facets', 'true');
  if (options?.genre?.trim()) params.set('genre', options.genre.trim());
  if (options?.genres?.length) params.set('genres', options.genres.join(','));
  if (options?.q?.trim()) params.set('q', options.q.trim());
  if (options?.author?.trim()) params.set('author', options.author.trim());
  if (options?.contentType) params.set('contentType', options.contentType);

  try {
    const res = await ssrApiFetch(`/api/books/directory?${params}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: options?.revalidate ?? 300 },
    });
    if (!res.ok) {
      return { books: [], total: 0, page: 1, limit, totalPages: 1 };
    }
    const data = (await res.json()) as BookDirectoryResult;
    return {
      books: Array.isArray(data.books) ? data.books : [],
      total: data.total ?? 0,
      page: data.page ?? 1,
      limit: data.limit ?? limit,
      totalPages: data.totalPages ?? 1,
      facets: data.facets,
    };
  } catch {
    return { books: [], total: 0, page: 1, limit, totalPages: 1 };
  }
}
