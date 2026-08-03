import { ssrApiFetch } from '@/lib/ssrApiFetch';
import { unstable_noStore as noStore } from 'next/cache';

export type GenreIndexEntry = {
  slug: string;
  label: string;
  count: number;
};

export async function fetchGenreIndex(options?: {
  revalidate?: number;
}): Promise<GenreIndexEntry[]> {
  noStore();
  try {
    const res = await ssrApiFetch('/api/genres', {
      headers: { Accept: 'application/json' },
      next: { revalidate: options?.revalidate ?? 300 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { genres?: GenreIndexEntry[] };
    return Array.isArray(data.genres) ? data.genres : [];
  } catch {
    return [];
  }
}
