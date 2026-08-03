/**
 * Resilient server-side fetch for Author Spotlight pages only.
 * Retries across internal loopback, Next rewrites, and public API — without caching failures as 404/empty ISR.
 */

import type { AuthorSpotlightDto, AuthorSpotlightListItem } from '@/lib/api';
import { ApiHttpError, ssrApiFetch } from '@/lib/ssrApiFetch';

async function parseJson<T>(res: Response): Promise<T> {
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    throw new Error(`Expected JSON from ${res.url}, got ${ct || 'unknown'}`);
  }
  return res.json() as Promise<T>;
}

/** Listing page — never silently returns empty on transient API errors. */
export async function fetchAuthorSpotlightsForPage(): Promise<AuthorSpotlightListItem[]> {
  const res = await ssrApiFetch('/api/author-spotlight');
  const data = await parseJson<{ spotlights?: AuthorSpotlightListItem[] }>(res);
  return data.spotlights ?? [];
}

/** Detail page — only returns null on a real 404; throws on transient failures. */
export async function fetchAuthorSpotlightBySlugForPage(slug: string): Promise<AuthorSpotlightDto | null> {
  const enc = encodeURIComponent(slug);
  try {
    const res = await ssrApiFetch(`/api/author-spotlight/${enc}`);
    const data = await parseJson<{ spotlight?: AuthorSpotlightDto }>(res);
    return data.spotlight ?? null;
  } catch (e) {
    if (e instanceof ApiHttpError && e.status === 404) return null;
    throw e;
  }
}
