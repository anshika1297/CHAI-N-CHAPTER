/**
 * Resilient SSR fetch for editorial detail pages — real 404 vs transient API failure.
 * Uses short ISR revalidate (not no-store) so App Router static/ISR routes don't throw
 * "Page changed from static to dynamic at runtime".
 */

import { ApiHttpError, ssrApiFetch } from '@/lib/ssrApiFetch';

async function parseItem<T>(res: Response, key: string): Promise<T | null> {
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    throw new Error(`Expected JSON from ${res.url}, got ${ct || 'unknown'}`);
  }
  const data = (await res.json()) as Record<string, unknown>;
  const item = data[key];
  return item && typeof item === 'object' ? (item as T) : null;
}

async function fetchEditorialItem<T>(
  path: string,
  key: string
): Promise<T | null> {
  try {
    const res = await ssrApiFetch(path, { cache: 'no-store' });
    return parseItem<T>(res, key);
  } catch (e) {
    if (e instanceof ApiHttpError && e.status === 404) return null;
    throw e;
  }
}

export function fetchBlogPostForPage(slug: string): Promise<Record<string, unknown> | null> {
  return fetchEditorialItem(`/api/blog/posts/${encodeURIComponent(slug)}`, 'post');
}

export function fetchRecommendationForPage(slug: string): Promise<Record<string, unknown> | null> {
  return fetchEditorialItem(`/api/recommendations/${encodeURIComponent(slug)}`, 'item');
}

export function fetchMusingForPage(slug: string): Promise<Record<string, unknown> | null> {
  return fetchEditorialItem(`/api/musings/${encodeURIComponent(slug)}`, 'item');
}
