import { getFetchBaseUrl, normalizeApiOrigin } from '@/lib/apiBase';

/** Thrown when the API returns a definitive HTTP status after all SSR retries/fallbacks. */
export class ApiHttpError extends Error {
  readonly status: number;
  readonly url: string;

  constructor(message: string, status: number, url: string) {
    super(message);
    this.name = 'ApiHttpError';
    this.status = status;
    this.url = url;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchTimeout(ms: number): AbortSignal {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

/** Ordered origins for server-side API fetches — internal loopback first, then public, then Next rewrites. */
export function getSsrApiOrigins(): string[] {
  const seen = new Set<string>();
  const origins: string[] = [];
  const push = (raw?: string) => {
    const o = raw?.trim() ? normalizeApiOrigin(raw) : '';
    if (o && !seen.has(o)) {
      seen.add(o);
      origins.push(o);
    }
  };

  push(process.env.API_INTERNAL_URL);
  if (process.env.NODE_ENV === 'production') push('http://127.0.0.1:5002');
  // Next.js rewrites /api → loopback API (works when direct API port differs from env)
  push(`http://127.0.0.1:${process.env.PORT || '3000'}`);
  push(process.env.NEXT_PUBLIC_API_URL);
  if (process.env.NODE_ENV === 'production') {
    push('https://chaptersaurchai.com');
    push('https://www.chaptersaurchai.com');
  }
  if (process.env.NODE_ENV !== 'production') push('http://127.0.0.1:5001');

  return origins;
}

export type SsrFetchInit = RequestInit & {
  next?: { revalidate?: number | false; tags?: string[] };
};

/**
 * Server-side fetch with retry + multiple origin fallbacks.
 * Defaults to `next.revalidate: 60` so App Router ISR pages stay static/ISR.
 * (Using `cache: 'no-store'` on an ISR page throws "static to dynamic at runtime".)
 * Pass `{ cache: 'no-store' }` only from force-dynamic routes that need it.
 * Browser calls use a single origin via getFetchBaseUrl().
 */
export async function ssrApiFetch(apiPath: string, init?: SsrFetchInit): Promise<Response> {
  if (typeof window !== 'undefined') {
    const path = apiPath.startsWith('/') ? apiPath : `/api/${apiPath.replace(/^\//, '')}`;
    return fetch(`${getFetchBaseUrl()}${path}`, init);
  }

  const path = apiPath.startsWith('/api/') ? apiPath : `/api/${apiPath.replace(/^\//, '')}`;
  const origins = getSsrApiOrigins();
  let lastError: unknown;

  const cacheOpts: RequestInit & { next?: SsrFetchInit['next'] } =
    init?.next != null
      ? { next: init.next }
      : init?.cache != null
        ? { cache: init.cache }
        : { next: { revalidate: 60 } };

  for (const origin of origins) {
    const url = `${origin}${path}`;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(url, {
          headers: { Accept: 'application/json', ...(init?.headers as Record<string, string> | undefined) },
          ...cacheOpts,
          signal: fetchTimeout(8000),
        });
        if (res.ok) return res;
        if (res.status === 404) {
          throw new ApiHttpError('Not found', 404, url);
        }
        lastError = new ApiHttpError(`HTTP ${res.status}`, res.status, url);
      } catch (e) {
        if (e instanceof ApiHttpError && e.status === 404) throw e;
        lastError = e;
      }
      if (attempt === 0) await sleep(250);
    }
  }

  if (lastError instanceof ApiHttpError) throw lastError;
  throw lastError instanceof Error
    ? lastError
    : new ApiHttpError('API unreachable', 503, path);
}
