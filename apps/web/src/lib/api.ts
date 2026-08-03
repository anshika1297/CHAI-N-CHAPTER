/**
 * API client for the backend. Used by admin pages and public pages.
 *
 * Base URL comes from `getFetchBaseUrl()` (@/lib/apiBase):
 * - Production: set NEXT_PUBLIC_API_URL to https://chaptersaurchai.com/api (or origin only) so all calls use the public API.
 * - Local dev: omit NEXT_PUBLIC_API_URL to use same-origin /api (Next rewrites) or set http://127.0.0.1:5001.
 */

import { getFetchBaseUrl, getImageApiOrigin } from '@/lib/apiBase';
import { ApiHttpError, ssrApiFetch, type SsrFetchInit } from '@/lib/ssrApiFetch';

export type PageSlug = 'contact' | 'work-with-me' | 'about' | 'terms' | 'privacy' | 'header' | 'footer' | 'home' | 'book-clubs' | 'blog' | 'recommendations' | 'musings' | 'email-settings';

const getBaseUrl = (): string => getFetchBaseUrl();

/**
 * Parse a fetch Response as JSON with safety checks.
 * Throws a descriptive error if the response is HTML or non-JSON.
 */
async function parseJsonResponse<T = unknown>(res: Response, label: string): Promise<T> {
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    const preview = await res.text().then(t => t.slice(0, 200));
    const msg = `[API] ${label} — expected JSON but got ${ct || 'unknown content-type'} (status ${res.status}) from ${res.url}`;
    console.error(msg);
    console.error(`[API] ${label} — response preview:`, preview);
    throw new Error(msg);
  }
  return res.json();
}

function apiPathFromUrl(url: string): string {
  const base = getBaseUrl();
  if (base && url.startsWith(base)) return url.slice(base.length);
  return url.replace(/^https?:\/\/[^/]+/, '');
}

async function safeFetch(url: string, options?: RequestInit, label?: string): Promise<Response> {
  const tag = label || url;
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[API] ${tag} → ${url}`);
  }
  try {
    const res =
      typeof window === 'undefined'
        ? await ssrApiFetch(apiPathFromUrl(url), options as SsrFetchInit)
        : await fetch(url, options);
    if (!res.ok) {
      console.warn(`[API] ${tag} — ${res.status} ${res.statusText}`);
    }
    return res;
  } catch (err) {
    console.error(`[API] ${tag} — network error:`, err);
    throw err;
  }
}

/**
 * Resolve image URL for <img src> and next/image.
 * Stored values should be `/api/img/<token>` (from upload). Never save localhost URLs in the DB.
 * Uses `getImageApiOrigin()` — defaults to https://chaptersaurchai.com (override with NEXT_PUBLIC_IMAGE_API_URL).
 */
export function getImageUrl(url: string | undefined | null): string {
  if (!url || typeof url !== 'string' || !url.trim()) return '';
  let trimmed = url.trim();

  // Strip localhost / API origins stored in DB (legacy) → portable relative path
  const originPattern = /^https?:\/\/[^/]+/;
  if (originPattern.test(trimmed)) {
    trimmed = trimmed.replace(originPattern, '');
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  const assetPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  if (assetPath.startsWith('/api/')) {
    return `${getImageApiOrigin()}${assetPath}`;
  }

  return assetPath;
}

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('adminToken');
}

export function setAdminToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('adminToken', token);
}

export function clearAdminToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('adminToken');
}

// ——— Request deduplication & short TTL cache (avoids double calls from Strict Mode / multiple components)
const CACHE_TTL_MS = 60_000; // 1 minute
const pageCache = new Map<string, { data: { content: unknown }; expires: number }>();
const pageInFlight = new Map<string, Promise<{ content: unknown }>>();
let bookClubsCache: { data: { content: unknown }; expires: number } | null = null;
let bookClubsInFlight: Promise<{ content: unknown }> | null = null;

function getCachedPage(slug: string): { content: unknown } | null {
  const entry = pageCache.get(slug);
  if (!entry || Date.now() > entry.expires) return null;
  return entry.data;
}

function setCachedPage(slug: string, data: { content: unknown }): void {
  pageCache.set(slug, { data, expires: Date.now() + CACHE_TTL_MS });
}

/** GET /api/settings/pages/:slug – returns { content } or { content: null } (deduplicated & cached) */
export function getPageSettings(slug: PageSlug): Promise<{ content: unknown }> {
  const key = slug;
  const cached = getCachedPage(key);
  if (cached !== null) return Promise.resolve(cached);
  const inFlight = pageInFlight.get(key);
  if (inFlight) return inFlight;
  const promise = (async () => {
    try {
      const res = await safeFetch(`${getBaseUrl()}/api/settings/pages/${slug}`, undefined, `GET settings/${slug}`);
      if (!res.ok) throw new Error(`Failed to load ${slug}: ${res.status}`);
      const data = await parseJsonResponse<{ content: unknown }>(res, `settings/${slug}`);
      setCachedPage(key, data);
      return data;
    } finally {
      pageInFlight.delete(key);
    }
  })();
  pageInFlight.set(key, promise);
  return promise;
}

/**
 * Server-only fetch for page settings — bypasses the in-memory browser/server module cache
 * so admin edits show on public pages without waiting for TTL or rebuild.
 */
export async function getPageSettingsServer(slug: PageSlug): Promise<{ content: unknown }> {
  const res = await fetch(`${getBaseUrl()}/api/settings/pages/${slug}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load ${slug}: ${res.status}`);
  return res.json() as Promise<{ content: unknown }>;
}

/** PUT /api/settings/pages/:slug – requires admin token. Invalidates cache for this slug. */
export async function putPageSettings(
  slug: PageSlug,
  content: Record<string, unknown>
): Promise<{ content: unknown }> {
  const token = getAdminToken();
  if (!token) throw new Error('Not logged in');
  const res = await safeFetch(`${getBaseUrl()}/api/settings/pages/${slug}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const err = await parseJsonResponse(res, `save ${slug}`).catch(() => ({}));
    throw new Error((err as { error?: string }).error || `Failed to save ${slug}: ${res.status}`);
  }
  pageCache.delete(slug);
  return parseJsonResponse<{ content: unknown }>(res, `save ${slug}`);
}

export type TestEmailSmtpPayload = {
  fromEmail?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
};

/** POST /api/test-email – requires admin token. Optional smtp uses current form (password can be new or saved). */
export async function sendTestEmail(
  to: string,
  smtp?: TestEmailSmtpPayload
): Promise<{ message: string }> {
  const token = getAdminToken();
  if (!token) throw new Error('Not logged in');
  const res = await safeFetch(`${getBaseUrl()}/api/test-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ to: to.trim(), smtp: smtp ?? undefined }),
  });
  const data = await parseJsonResponse(res, 'test-email').catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Failed to send test email: ${res.status}`);
  return data as { message: string };
}

// ——— Book Clubs (dedicated API for admin and display) ———

/** GET /api/book-clubs – returns { content } (public, deduplicated & cached) */
export function getBookClubs(): Promise<{ content: unknown }> {
  if (bookClubsCache !== null && Date.now() <= bookClubsCache.expires) {
    return Promise.resolve(bookClubsCache.data);
  }
  if (bookClubsInFlight) return bookClubsInFlight;
  const promise = (async () => {
    try {
      const res = await safeFetch(`${getBaseUrl()}/api/book-clubs`);
      if (!res.ok) throw new Error(`Failed to load book clubs: ${res.status}`);
      const data = await parseJsonResponse<{ content: unknown }>(res, 'book-clubs');
      bookClubsCache = { data, expires: Date.now() + CACHE_TTL_MS };
      return data;
    } finally {
      bookClubsInFlight = null;
    }
  })();
  bookClubsInFlight = promise;
  return promise;
}

/** PUT /api/book-clubs – requires admin token, body = full payload to store. Invalidates book-clubs cache. */
export async function putBookClubs(content: Record<string, unknown>): Promise<{ content: unknown }> {
  const token = getAdminToken();
  if (!token) throw new Error('Not logged in');
  const res = await safeFetch(`${getBaseUrl()}/api/book-clubs`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(content),
  });
  if (!res.ok) {
    const err = await parseJsonResponse(res, 'save book-clubs').catch(() => ({}));
    throw new Error((err as { error?: string }).error || `Failed to save book clubs: ${res.status}`);
  }
  bookClubsCache = null;
  return parseJsonResponse<{ content: unknown }>(res, 'save book-clubs');
}

async function postAnnounce(
  path: string,
  body: Record<string, unknown> = {}
): Promise<{ sent: number; total: number; message?: string }> {
  const token = getAdminToken();
  if (!token) throw new Error('Not logged in');
  const res = await safeFetch(`${getBaseUrl()}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await parseJsonResponse(res, path).catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Failed to send announcement: ${res.status}`);
  return data as { sent: number; total: number; message?: string };
}

/** POST /api/blog/announce – live post by slug */
export function announceBlogPost(slug: string) {
  return postAnnounce('/api/blog/announce', { slug: slug.trim() });
}

/** POST /api/recommendations/announce – live list by slug */
export function announceRecommendation(slug: string) {
  return postAnnounce('/api/recommendations/announce', { slug: slug.trim() });
}

/** POST /api/musings/announce – live musing by slug */
export function announceMusing(slug: string) {
  return postAnnounce('/api/musings/announce', { slug: slug.trim() });
}

/** POST /api/author-spotlight/admin/:id/announce – live spotlight */
export function announceAuthorSpotlight(id: string) {
  return postAnnounce(`/api/author-spotlight/admin/${encodeURIComponent(id)}/announce`, {});
}

/** POST /api/book-clubs/announce – book club announcement to all subscribers. */
export function announceBookClub(bookClubId: string) {
  return postAnnounce('/api/book-clubs/announce', { bookClubId: bookClubId.trim() });
}

// ——— Categories (public by type; admin CRUD) ———

export type CategoryType = 'blog' | 'recommendations' | 'musings';

export interface CategoryDto {
  _id: string;
  name: string;
  slug: string;
  description: string;
  type: CategoryType;
  order?: number;
}

const categoriesCache = new Map<string, { data: { categories: CategoryDto[] }; expires: number }>();
const categoriesInFlight = new Map<string, Promise<{ categories: CategoryDto[] }>>();

/** Call after admin create/update/delete category so listing pages refetch. */
export function invalidateCategoriesCache(): void {
  categoriesCache.clear();
}

/** GET /api/categories?type=… – returns { categories } (public). Deduplicated & short TTL cache. */
export function getCategories(type: CategoryType): Promise<{ categories: CategoryDto[] }> {
  const key = `categories-${type}`;
  const entry = categoriesCache.get(key);
  if (entry && Date.now() <= entry.expires) return Promise.resolve(entry.data);
  const inFlight = categoriesInFlight.get(key);
  if (inFlight) return inFlight;
  const promise = (async () => {
    try {
      const res = await safeFetch(`${getBaseUrl()}/api/categories?type=${encodeURIComponent(type)}`);
      if (!res.ok) throw new Error(`Failed to load categories: ${res.status}`);
      const data = await parseJsonResponse<{ categories: CategoryDto[] }>(res, 'categories');
      categoriesCache.set(key, { data, expires: Date.now() + CACHE_TTL_MS });
      return data;
    } finally {
      categoriesInFlight.delete(key);
    }
  })();
  categoriesInFlight.set(key, promise);
  return promise;
}

/** GET /api/categories – returns all categories (no type filter). Public so list always loads; no auth required. */
export async function getAdminCategories(): Promise<{ categories: CategoryDto[] }> {
  const res = await safeFetch(`${getBaseUrl()}/api/categories`);
  if (!res.ok) throw new Error(`Failed to load categories: ${res.status}`);
  return parseJsonResponse<{ categories: CategoryDto[] }>(res, 'admin categories');
}

/** POST /api/categories – admin: create category. Always sends request; server returns 401 if not logged in. */
export async function createCategory(data: { name: string; slug?: string; description?: string; type: CategoryType }): Promise<{ category: CategoryDto }> {
  const token = getAdminToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await safeFetch(`${getBaseUrl()}/api/categories`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  const body = await parseJsonResponse(res, 'create category').catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error || `Failed to create category: ${res.status}`);
  invalidateCategoriesCache();
  return body as { category: CategoryDto };
}

/** PUT /api/categories/:id – admin: update category. Always sends request; server returns 401 if not logged in. */
export async function updateCategory(id: string, data: Partial<{ name: string; slug: string; description: string; type: CategoryType; order: number }>): Promise<{ category: CategoryDto }> {
  const token = getAdminToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await safeFetch(`${getBaseUrl()}/api/categories/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  });
  const body = await parseJsonResponse(res, 'update category').catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error || `Failed to update category: ${res.status}`);
  invalidateCategoriesCache();
  return body as { category: CategoryDto };
}

/** DELETE /api/categories/:id – admin: delete category. Always sends request; server returns 401 if not logged in. */
export async function deleteCategory(id: string): Promise<void> {
  const token = getAdminToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await safeFetch(`${getBaseUrl()}/api/categories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) {
    const body = await parseJsonResponse(res, 'delete category').catch(() => ({}));
    throw new Error((body as { error?: string }).error || `Failed to delete category: ${res.status}`);
  }
  invalidateCategoriesCache();
}

// ——— List APIs in-flight dedup (same params = same promise, avoids double calls) ———

const blogListInFlight = new Map<string, Promise<{ posts: unknown[]; total: number; page: number; limit: number }>>();
const recListInFlight = new Map<string, Promise<{ items: unknown[]; total: number; page: number; limit: number }>>();
const musingsListInFlight = new Map<string, Promise<{ items: unknown[]; total: number; page: number; limit: number }>>();

// ——— Blog (Book Reviews) – public list & single post ———

export interface BlogListParams {
  page?: number;
  limit?: number;
  category?: string;
  author?: string;
  book?: string;
  title?: string;
  sort?: string;
}

/** GET /api/blog/posts – returns { posts, total, page, limit } (public). Filter & pagination on backend. */
export function getBlogPosts(params?: BlogListParams): Promise<{ posts: unknown[]; total: number; page: number; limit: number }> {
  const search = new URLSearchParams();
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.limit != null) search.set('limit', String(params.limit));
  if (params?.category) search.set('category', params.category);
  if (params?.author) search.set('author', params.author);
  if (params?.book) search.set('book', params.book);
  if (params?.title) search.set('title', params.title);
  search.set('sort', params?.sort || 'newest');
  const qs = search.toString();
  const key = `blog-${qs}`;
  const inFlight = blogListInFlight.get(key);
  if (inFlight) return inFlight;
  const promise = (async () => {
    try {
      const res = await safeFetch(`${getBaseUrl()}/api/blog/posts${qs ? `?${qs}` : ''}`);
      if (!res.ok) throw new Error(`Failed to load blog posts: ${res.status}`);
      return parseJsonResponse<{ posts: unknown[]; total: number; page: number; limit: number }>(res, 'blog/posts');
    } finally {
      blogListInFlight.delete(key);
    }
  })();
  blogListInFlight.set(key, promise);
  return promise;
}

/** GET /api/blog/posts/:slug – returns { post } or 404 (public). */
export async function getBlogPostBySlug(slug: string): Promise<{ post: unknown }> {
  const res = await safeFetch(`${getBaseUrl()}/api/blog/posts/${encodeURIComponent(slug)}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error('Post not found');
    throw new Error(`Failed to load post: ${res.status}`);
  }
  return parseJsonResponse<{ post: unknown }>(res, `blog/posts/${slug}`);
}

// ——— Recommendations – public list & single ———

export interface RecListParams {
  page?: number;
  limit?: number;
  category?: string;
  author?: string;
  book?: string;
  title?: string;
  sort?: string;
}

/** GET /api/recommendations – returns { items, total, page, limit } (public). Filter & pagination on backend. */
export function getRecommendations(params?: RecListParams): Promise<{ items: unknown[]; total: number; page: number; limit: number }> {
  const search = new URLSearchParams();
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.limit != null) search.set('limit', String(params.limit));
  if (params?.category) search.set('category', params.category);
  if (params?.author) search.set('author', params.author);
  if (params?.book) search.set('book', params.book);
  if (params?.title) search.set('title', params.title);
  search.set('sort', params?.sort || 'newest');
  const qs = search.toString();
  const key = `rec-${qs}`;
  const inFlight = recListInFlight.get(key);
  if (inFlight) return inFlight;
  const promise = (async () => {
    try {
      const res = await safeFetch(`${getBaseUrl()}/api/recommendations${qs ? `?${qs}` : ''}`);
      if (!res.ok) throw new Error(`Failed to load recommendations: ${res.status}`);
      return parseJsonResponse<{ items: unknown[]; total: number; page: number; limit: number }>(res, 'recommendations');
    } finally {
      recListInFlight.delete(key);
    }
  })();
  recListInFlight.set(key, promise);
  return promise;
}

/** GET /api/recommendations/:slug – returns { item } or 404 (public). */
export async function getRecommendationBySlug(slug: string): Promise<{ item: unknown }> {
  const res = await safeFetch(`${getBaseUrl()}/api/recommendations/${encodeURIComponent(slug)}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error('Recommendation not found');
    throw new Error(`Failed to load recommendation: ${res.status}`);
  }
  return parseJsonResponse<{ item: unknown }>(res, `recommendations/${slug}`);
}

// ——— Musings (Her Musings Verse) – public list & single ———

export interface MusingsListParams {
  page?: number;
  limit?: number;
  category?: string;
  title?: string;
  sort?: string;
}

/** GET /api/musings – returns { items, total, page, limit } (public). Filter & pagination on backend. */
export function getMusings(params?: MusingsListParams): Promise<{ items: unknown[]; total: number; page: number; limit: number }> {
  const search = new URLSearchParams();
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.limit != null) search.set('limit', String(params.limit));
  if (params?.category) search.set('category', params.category);
  if (params?.title) search.set('title', params.title);
  search.set('sort', params?.sort || 'newest');
  const qs = search.toString();
  const key = `musings-${qs}`;
  const inFlight = musingsListInFlight.get(key);
  if (inFlight) return inFlight;
  const promise = (async () => {
    try {
      const res = await safeFetch(`${getBaseUrl()}/api/musings${qs ? `?${qs}` : ''}`);
      if (!res.ok) throw new Error(`Failed to load musings: ${res.status}`);
      return parseJsonResponse<{ items: unknown[]; total: number; page: number; limit: number }>(res, 'musings');
    } finally {
      musingsListInFlight.delete(key);
    }
  })();
  musingsListInFlight.set(key, promise);
  return promise;
}

/** GET /api/musings/:slug – returns { item } or 404 (public). */
export async function getMusingBySlug(slug: string): Promise<{ item: unknown }> {
  const res = await safeFetch(`${getBaseUrl()}/api/musings/${encodeURIComponent(slug)}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error('Musing not found');
    throw new Error(`Failed to load musing: ${res.status}`);
  }
  return parseJsonResponse<{ item: unknown }>(res, `musings/${slug}`);
}

// ——— Subscriptions (public subscribe; admin list) ———

/** POST /api/subscribe – public. Subscribe with email (optional name, source). */
export type SubscribeResult = {
  message: string;
  subscribed: boolean;
  commentToken?: string;
  subscriberName?: string;
};

export async function subscribe(
  email: string,
  options?: { name?: string; source?: string }
): Promise<SubscribeResult> {
  const res = await safeFetch(`${getBaseUrl()}/api/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), name: options?.name?.trim(), source: options?.source }),
  });
  const data = await parseJsonResponse(res, 'subscribe').catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to subscribe');
  return data as SubscribeResult;
}

/** POST /api/subscribe/comment-token – verify active subscriber for commenting */
export async function fetchSubscriberCommentToken(email: string): Promise<{
  commentToken: string;
  subscriberName: string;
  email: string;
}> {
  const res = await safeFetch(`${getBaseUrl()}/api/subscribe/comment-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim() }),
  });
  const data = await parseJsonResponse(res, 'subscriber comment token').catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || 'Subscription not found');
  }
  return data as { commentToken: string; subscriberName: string; email: string };
}

/** POST /api/subscribe/unsubscribe – public. Unsubscribe by email. */
export async function unsubscribe(email: string): Promise<{ message: string; subscribed: boolean }> {
  const res = await safeFetch(`${getBaseUrl()}/api/subscribe/unsubscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim() }),
  });
  const data = await parseJsonResponse(res, 'unsubscribe').catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to unsubscribe');
  return data as { message: string; subscribed: boolean };
}

// ——— Contact / Work With Me messages ———

/** POST /api/messages – submit contact form (public). */
export async function submitContactMessage(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<{ message: string }> {
  const res = await safeFetch(`${getBaseUrl()}/api/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, source: 'contact' }),
  });
  const body = await parseJsonResponse(res, 'contact message').catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error || 'Failed to send message');
  return body as { message: string };
}

/** POST /api/messages – submit work-with-me form (public). */
export async function submitWorkWithMeMessage(data: {
  name: string;
  email: string;
  service: string;
  message: string;
  bookTitle?: string;
  genre?: string;
  timeline?: string;
  website?: string;
}): Promise<{ message: string }> {
  const res = await safeFetch(`${getBaseUrl()}/api/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, source: 'work-with-me' }),
  });
  const body = await parseJsonResponse(res, 'work-with-me message').catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error || 'Failed to send message');
  return body as { message: string };
}

export interface MessageDto {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  service?: string;
  bookTitle?: string;
  genre?: string;
  timeline?: string;
  source: 'contact' | 'work-with-me';
  read: boolean;
  createdAt: string;
}

/** GET /api/messages – admin only. List contact/work-with-me submissions. */
export async function getMessages(params?: { page?: number; limit?: number; source?: 'contact' | 'work-with-me' }): Promise<{
  list: MessageDto[];
  total: number;
  page: number;
  limit: number;
}> {
  const token = getAdminToken();
  if (!token) throw new Error('Not logged in');
  const search = new URLSearchParams();
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.limit != null) search.set('limit', String(params.limit));
  if (params?.source) search.set('source', params.source);
  const qs = search.toString();
  const res = await safeFetch(`${getBaseUrl()}/api/messages${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await parseJsonResponse(res, 'messages').catch(() => ({}));
    throw new Error((err as { error?: string }).error || `Failed to load messages: ${res.status}`);
  }
  return parseJsonResponse(res, 'messages');
}

/** PATCH /api/messages/:id/read – admin only. Mark message as read. */
export async function markMessageRead(id: string): Promise<void> {
  const token = getAdminToken();
  if (!token) throw new Error('Not logged in');
  const res = await safeFetch(`${getBaseUrl()}/api/messages/${id}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await parseJsonResponse(res, 'mark-read').catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Failed to update');
  }
}

export interface SubscriberDto {
  id: string;
  email: string;
  name?: string;
  status: string;
  subscribedAt: string;
  unsubscribedAt?: string;
  source?: string;
}

/** GET /api/subscribers – admin only. List subscribers with pagination. */
export async function getSubscribers(params?: { page?: number; limit?: number; status?: 'subscribed' | 'unsubscribed' }): Promise<{
  subscribers: SubscriberDto[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  totalSubscribed: number;
}> {
  const token = getAdminToken();
  if (!token) throw new Error('Not logged in');
  const search = new URLSearchParams();
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.limit != null) search.set('limit', String(params.limit));
  if (params?.status) search.set('status', params.status);
  const qs = search.toString();
  const res = await safeFetch(`${getBaseUrl()}/api/subscribers${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await parseJsonResponse(res, 'subscribers').catch(() => ({}));
    throw new Error((err as { error?: string }).error || `Failed to load subscribers: ${res.status}`);
  }
  return parseJsonResponse(res, 'subscribers');
}

// ——— Image upload (admin only) ———

export type UploadModule = 'home' | 'about' | 'book-clubs' | 'blog' | 'recommendations' | 'musings' | 'contact' | 'work-with-me' | 'footer' | 'header' | 'author-spotlight';

/** POST /api/upload – multipart "file" + optional "module". Returns { url } (absolute path to use as imageUrl). */
export async function uploadImage(file: File, module: UploadModule = 'home'): Promise<{ url: string }> {
  const token = getAdminToken();
  if (!token) throw new Error('Not logged in');
  const form = new FormData();
  form.append('file', file);
  form.append('module', module);
  const base = getBaseUrl();
  const res = await safeFetch(`${base}/api/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = await parseJsonResponse(res, 'upload').catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Upload failed: ${res.status}`);
  }
  const url = (data as { url?: string }).url;
  if (!url) throw new Error('No url in upload response');
  // Store relative `/api/img/...` only — display uses getImageUrl() → production host.
  const path = url.replace(/^https?:\/\/[^/]+/, '');
  return { url: path.startsWith('/') ? path : `/${path}` };
}

/** POST /api/auth/login – returns { token } */
export async function login(email: string, password: string): Promise<{ token: string }> {
  const res = await safeFetch(`${getBaseUrl()}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await parseJsonResponse(res, 'login').catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || 'Login failed');
  }
  return data as { token: string };
}

// ——— Users (admin only) ———

export interface AdminUserDto {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

/** GET /api/users – list users (protected). Returns { users } or throws. */
export async function getUsers(): Promise<{ users: AdminUserDto[] }> {
  const token = getAdminToken();
  if (!token) throw new Error('Not logged in');
  const res = await safeFetch(`${getBaseUrl()}/api/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await parseJsonResponse(res, 'users').catch(() => ({}));
    throw new Error((err as { error?: string }).error || `Failed to load users: ${res.status}`);
  }
  return parseJsonResponse<{ users: AdminUserDto[] }>(res, 'users');
}

/** POST /api/users – create user (protected). */
export async function createUser(body: {
  email: string;
  password: string;
  name?: string;
  role?: string;
}): Promise<{ user: AdminUserDto }> {
  const token = getAdminToken();
  if (!token) throw new Error('Not logged in');
  const res = await safeFetch(`${getBaseUrl()}/api/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await parseJsonResponse(res, 'create user').catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to create user');
  return data as { user: AdminUserDto };
}

/** PUT /api/users/:id – update user (protected). */
export async function updateUser(
  id: string,
  body: { name?: string; role?: string; password?: string }
): Promise<{ user: AdminUserDto }> {
  const token = getAdminToken();
  if (!token) throw new Error('Not logged in');
  const res = await safeFetch(`${getBaseUrl()}/api/users/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await parseJsonResponse(res, 'update user').catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to update user');
  return data as { user: AdminUserDto };
}

/** DELETE /api/users/:id – delete user (protected). */
export async function deleteUser(id: string): Promise<void> {
  const token = getAdminToken();
  if (!token) throw new Error('Not logged in');
  const res = await safeFetch(`${getBaseUrl()}/api/users/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = await parseJsonResponse(res, 'delete user').catch(() => ({}));
    throw new Error((data as { error?: string }).error || 'Failed to delete user');
  }
}

// ——— Dashboard (admin only) ———

export interface DashboardStats {
  totalVisitors: number;
  monthlyVisitors: number;
  totalPosts: number;
  totalRecommendations: number;
  totalMusings: number;
  totalBookClubs: number;
  totalSubscribers: number;
  totalMessages: number;
  unreadMessages: number;
  totalAdminUsers: number;
}

/** GET /api/dashboard/stats – returns real-time counts from DB (protected). */
export async function getDashboardStats(): Promise<DashboardStats> {
  const token = getAdminToken();
  if (!token) throw new Error('Not logged in');
  const res = await safeFetch(`${getBaseUrl()}/api/dashboard/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load stats');
  return parseJsonResponse<DashboardStats>(res, 'dashboard/stats');
}

// ——— Author spotlight (public + admin) ———

export interface AuthorSpotlightSocialLink {
  label: string;
  url: string;
}

export interface AuthorConnectLinksDto {
  website?: string;
  goodreads?: string;
  amazonAuthor?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  newsletter?: string;
  publisher?: string;
}

export interface ShopLinkDto {
  label: string;
  url: string;
  channel?: string;
}

export interface ShopBookMetaDto {
  title?: string;
  author?: string;
  genre?: string;
  coverImage?: string;
  isbn?: string;
  bookSlug?: string;
}

export interface AuthorSpotlightFeaturedBook {
  title: string;
  coverImage?: string;
  description?: string;
  buyLink?: string;
  shopLinks?: ShopLinkDto[];
  shopBook?: ShopBookMetaDto;
  goodreadsLink?: string;
  blogReviewLink?: string;
}

export interface AuthorSpotlightBlogLink {
  title: string;
  url: string;
}

export interface AuthorSpotlightReadingPairing {
  ifYouLiked: string;
  recommendedTitle: string;
  reason: string;
  internalUrl?: string;
}

export interface AuthorSpotlightQaItem {
  question: string;
  answer: string;
}

/** Public listing item */
export interface AuthorSpotlightListItem {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  coverImage?: string;
  profileImage: string;
  genres: string[];
  displayOrder: number;
  publishDate?: string;
}

/** Full document (public detail or admin) */
export interface AuthorSpotlightDto {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  coverImage?: string;
  profileImage: string;
  introduction?: string;
  whoIsHtml?: string;
  bio: string;
  genres: string[];
  connectLinks?: AuthorConnectLinksDto;
  socialLinks: AuthorSpotlightSocialLink[];
  featuredBooks: AuthorSpotlightFeaturedBook[];
  blogLinks: AuthorSpotlightBlogLink[];
  readingPairings: AuthorSpotlightReadingPairing[];
  faq: AuthorSpotlightQaItem[];
  interviewSectionTitle?: string;
  interview: AuthorSpotlightQaItem[];
  isPublished: boolean;
  publishDate?: string;
  subscribersEmailedAt?: string;
  displayOrder: number;
  seoTitle?: string;
  seoDescription?: string;
  socialShareImage?: string;
  ogImage?: string;
  tags?: string[];
  canonicalUrl?: string;
  startHere?: string;
  notableWorks?: string[];
  similarAuthors?: { name: string; reason?: string; url?: string }[];
  createdAt?: string;
  updatedAt?: string;
  updateHistory?: { at: string; reason: 'content' | 'publish' }[];
}

export type AuthorSpotlightCreateBody = Omit<
  AuthorSpotlightDto,
  'id' | 'createdAt' | 'updatedAt'
>;

/** GET /api/author-spotlight – published spotlights (works on server with Next fetch cache via `next`). */
export async function getAuthorSpotlightsPublic(
  init?: RequestInit & { next?: { revalidate?: number; tags?: string[] } }
): Promise<{ spotlights: AuthorSpotlightListItem[] }> {
  const res = await safeFetch(`${getBaseUrl()}/api/author-spotlight`, {
    ...init,
    headers: { Accept: 'application/json', ...init?.headers },
  }, 'author-spotlight list');
  if (!res.ok) throw new Error(`Failed to load author spotlights: ${res.status}`);
  return parseJsonResponse<{ spotlights: AuthorSpotlightListItem[] }>(res, 'author-spotlight list');
}

// ——— Tags (public taxonomy) ———

export type TagIndexEntryDto = { slug: string; label: string; count: number };

export type TaggedContentRefDto = {
  kind:
    | 'review'
    | 'recommendation'
    | 'musing'
    | 'author-spotlight'
    | 'shop-review'
    | 'shop-recommendation'
    | 'shop-spotlight';
  slug: string;
  title: string;
  excerpt?: string;
  href: string;
  tags: string[];
  image?: string;
};

export type TagDetailDto = {
  slug: string;
  label: string;
  count: number;
  items: TaggedContentRefDto[];
  topicClusters: string[];
  relatedTags: TagIndexEntryDto[];
};

/** GET /api/tags – public tag index */
export async function getTagsIndexPublic(
  init?: RequestInit & { next?: { revalidate?: number } }
): Promise<{ tags: TagIndexEntryDto[]; total: number }> {
  const res = await safeFetch(`${getBaseUrl()}/api/tags`, {
    ...init,
    headers: { Accept: 'application/json', ...init?.headers },
  }, 'tags index');
  if (!res.ok) throw new Error(`Failed to load tags: ${res.status}`);
  return parseJsonResponse<{ tags: TagIndexEntryDto[]; total: number }>(res, 'tags');
}

/** GET /api/tags/:slug – tagged content aggregation */
export async function getTagDetailPublic(
  slug: string,
  init?: RequestInit & { next?: { revalidate?: number } }
): Promise<TagDetailDto | null> {
  const res = await safeFetch(`${getBaseUrl()}/api/tags/${encodeURIComponent(slug)}`, {
    ...init,
    headers: { Accept: 'application/json', ...init?.headers },
  }, `tags/${slug}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to load tag: ${res.status}`);
  const data = await parseJsonResponse<{ tag: TagDetailDto }>(res, `tags/${slug}`);
  return data.tag ?? null;
}

/** GET /api/author-spotlight/:slug */
export async function getAuthorSpotlightBySlugPublic(
  slug: string,
  init?: RequestInit & { next?: { revalidate?: number; tags?: string[] } }
): Promise<AuthorSpotlightDto | null> {
  const enc = encodeURIComponent(slug);
  const res = await safeFetch(`${getBaseUrl()}/api/author-spotlight/${enc}`, {
    ...init,
    headers: { Accept: 'application/json', ...init?.headers },
  }, `author-spotlight/${slug}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to load spotlight: ${res.status}`);
  const data = await parseJsonResponse<{ spotlight: AuthorSpotlightDto }>(res, `author-spotlight/${slug}`);
  return data.spotlight ?? null;
}

/** Parse author-spotlight admin JSON (or plain-text error body) so 4xx messages aren’t replaced by a generic “Failed to create”. */
async function parseAuthorSpotlightAdminResult<T extends Record<string, unknown>>(
  res: Response,
  fallback: string
): Promise<T> {
  if (res.status === 204) {
    return {} as T;
  }
  const raw = await res.text();
  if (res.ok && !raw.trim()) return {} as T;

  let data: Record<string, unknown> = {};
  if (raw.trim()) {
    try {
      data = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      if (!res.ok) {
        throw new Error(raw.trim().slice(0, 220) || `${fallback} (HTTP ${res.status})`);
      }
      throw new Error(`${fallback}: server returned non-JSON`);
    }
  }

  if (!res.ok) {
    const msg =
      typeof data.error === 'string' && data.error.trim()
        ? data.error.trim()
        : `${fallback} (HTTP ${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

/** GET /api/author-spotlight/admin – all (protected). */
export async function getAuthorSpotlightsAdmin(): Promise<{ spotlights: AuthorSpotlightDto[] }> {
  const token = getAdminToken();
  if (!token) throw new Error('Not logged in');
  const res = await safeFetch(`${getBaseUrl()}/api/author-spotlight/admin`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseJsonResponse<{ spotlights: AuthorSpotlightDto[] }>(res, 'author-spotlight/admin').catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to load author spotlights');
  return data as { spotlights: AuthorSpotlightDto[] };
}

/** GET /api/author-spotlight/admin/:id */
export async function getAuthorSpotlightAdmin(id: string): Promise<{ spotlight: AuthorSpotlightDto }> {
  const token = getAdminToken();
  if (!token) throw new Error('Not logged in');
  const res = await safeFetch(`${getBaseUrl()}/api/author-spotlight/admin/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseJsonResponse<{ spotlight: AuthorSpotlightDto }>(res, 'author-spotlight/admin id').catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to load spotlight');
  return data as { spotlight: AuthorSpotlightDto };
}

/** POST /api/author-spotlight/admin */
export async function createAuthorSpotlightAdmin(
  body: Partial<AuthorSpotlightCreateBody> & { name: string; profileImage: string; slug?: string }
): Promise<{ spotlight: AuthorSpotlightDto; announceMessage?: string }> {
  const token = getAdminToken();
  if (!token) throw new Error('Not logged in');
  const res = await safeFetch(`${getBaseUrl()}/api/author-spotlight/admin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await parseAuthorSpotlightAdminResult<{
    spotlight?: AuthorSpotlightDto;
    announceMessage?: string;
  }>(res, 'Could not create spotlight');
  if (!data.spotlight) throw new Error('Invalid response: missing spotlight');
  return { spotlight: data.spotlight, announceMessage: data.announceMessage };
}

/** PUT /api/author-spotlight/admin/:id */
export async function updateAuthorSpotlightAdmin(
  id: string,
  body: Partial<AuthorSpotlightCreateBody>
): Promise<{ spotlight: AuthorSpotlightDto; announceMessage?: string }> {
  const token = getAdminToken();
  if (!token) throw new Error('Not logged in');
  const res = await safeFetch(`${getBaseUrl()}/api/author-spotlight/admin/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await parseAuthorSpotlightAdminResult<{
    spotlight?: AuthorSpotlightDto;
    announceMessage?: string;
  }>(res, 'Could not update spotlight');
  if (!data.spotlight) throw new Error('Invalid response: missing spotlight');
  return { spotlight: data.spotlight, announceMessage: data.announceMessage };
}

/** PATCH /api/author-spotlight/admin/:id/publish */
export async function publishAuthorSpotlightAdmin(
  id: string,
  isPublished: boolean
): Promise<{ spotlight: AuthorSpotlightDto; announceMessage?: string }> {
  const token = getAdminToken();
  if (!token) throw new Error('Not logged in');
  const res = await safeFetch(`${getBaseUrl()}/api/author-spotlight/admin/${id}/publish`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ isPublished }),
  });
  const data = await parseAuthorSpotlightAdminResult<{
    spotlight?: AuthorSpotlightDto;
    announceMessage?: string;
  }>(res, 'Could not update publish state');
  if (!data.spotlight) throw new Error('Invalid response: missing spotlight');
  return { spotlight: data.spotlight, announceMessage: data.announceMessage };
}

/** DELETE /api/author-spotlight/admin/:id */
export async function deleteAuthorSpotlightAdmin(id: string): Promise<void> {
  const token = getAdminToken();
  if (!token) throw new Error('Not logged in');
  const res = await safeFetch(`${getBaseUrl()}/api/author-spotlight/admin/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    await parseAuthorSpotlightAdminResult<Record<string, unknown>>(res, 'Could not delete spotlight');
  }
}

/** POST /api/author-spotlight/admin/reorder */
export async function reorderAuthorSpotlightsAdmin(ids: string[]): Promise<{ spotlights: AuthorSpotlightDto[] }> {
  const token = getAdminToken();
  if (!token) throw new Error('Not logged in');
  const res = await safeFetch(`${getBaseUrl()}/api/author-spotlight/admin/reorder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ids }),
  });
  const data = await parseAuthorSpotlightAdminResult<{ spotlights?: AuthorSpotlightDto[] }>(
    res,
    'Could not reorder spotlights'
  );
  if (!data.spotlights) throw new Error('Invalid response: missing spotlights');
  return { spotlights: data.spotlights };
}
