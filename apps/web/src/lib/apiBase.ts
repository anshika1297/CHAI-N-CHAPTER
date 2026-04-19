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
 * - Server: prefers NEXT_PUBLIC_API_URL, then API_INTERNAL_URL, then local API port.
 */
export function getFetchBaseUrl(): string {
  const publicOrigin = normalizeApiOrigin(process.env.NEXT_PUBLIC_API_URL);

  if (typeof window !== 'undefined') {
    return publicOrigin || '';
  }

  if (publicOrigin) return publicOrigin;

  const internalOrigin = normalizeApiOrigin(process.env.API_INTERNAL_URL);
  if (internalOrigin) return internalOrigin;

  return 'http://127.0.0.1:5001';
}
