/**
 * Public API lives at https://<site>/api/... — env may be set as origin or with a trailing /api.
 * All request URLs are built as `${getFetchBaseUrl()}/api/...`.
 */

/** Strip trailing slashes and a trailing /api so we always join with `/api/...` once. */
export function normalizeApiOrigin(raw: string | undefined): string {
  if (raw == null || !String(raw).trim()) return '';
  let u = String(raw).trim().replace(/\/+$/, '');
  if (u.endsWith('/api')) {
    u = u.slice(0, -4);
  }
  return u;
}

/**
 * Base URL for API fetches (no path).
 * - Browser: uses NEXT_PUBLIC_API_URL when set (explicit production API host), else same-origin '' for dev rewrites.
 * - Server: prefers API_INTERNAL_URL (direct loopback on shared hosting), then production loopback default,
 *   then NEXT_PUBLIC_API_URL, then local dev port.
 */
export function getFetchBaseUrl(): string {
  const publicOrigin = normalizeApiOrigin(process.env.NEXT_PUBLIC_API_URL);

  if (typeof window !== 'undefined') {
    return publicOrigin || '';
  }

  const internalOrigin = normalizeApiOrigin(process.env.API_INTERNAL_URL);
  if (internalOrigin) return internalOrigin;

  // Bluehost production: SSR must hit loopback, not public /api (rate limits + Apache hop)
  if (process.env.NODE_ENV === 'production') {
    return 'http://127.0.0.1:5002';
  }

  if (publicOrigin) return publicOrigin;

  return 'http://127.0.0.1:5001';
}

/** Default host for `/api/img/...` when env is unset (local dev + production). */
export const DEFAULT_IMAGE_ORIGIN = 'https://chaptersaurchai.com';

/**
 * Origin for `/api/img/...` assets (no trailing slash, no `/api` suffix).
 * Always https://chaptersaurchai.com unless NEXT_PUBLIC_IMAGE_API_URL is set.
 * Ignores NEXT_PUBLIC_SITE_URL (often http://localhost:3000 in .env.local).
 */
export function getImageApiOrigin(): string {
  const imageOrigin = normalizeApiOrigin(process.env.NEXT_PUBLIC_IMAGE_API_URL);
  return imageOrigin || DEFAULT_IMAGE_ORIGIN;
}
