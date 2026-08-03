import { getFetchBaseUrl } from '@/lib/apiBase';
import type { SearchResponse } from './types';

export async function fetchSearch(
  query: string,
  opts: { limit?: number; mode?: 'modal' | 'full'; signal?: AbortSignal } = {}
): Promise<SearchResponse> {
  const q = query.trim();
  if (q.length < 2) {
    return {
      query: q,
      total: 0,
      tags: [],
      groups: {
        reviews: [],
        recommendations: [],
        musings: [],
        'author-spotlight': [],
        shop: [],
      },
    };
  }

  const params = new URLSearchParams({ q, limit: String(opts.limit ?? 8), mode: opts.mode ?? 'modal' });
  const res = await fetch(`${getFetchBaseUrl()}/api/search?${params}`, {
    signal: opts.signal,
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  return res.json() as Promise<SearchResponse>;
}
