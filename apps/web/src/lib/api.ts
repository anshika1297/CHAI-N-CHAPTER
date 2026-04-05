/**
 * API client for the backend. Used by admin pages and login.
 *
 * Client-side (browser): uses relative URLs so requests go through the same
 * origin → Apache proxies /api to port 3000, OR if the request reaches
 * the Next.js server, its rewrites proxy to port 3000. Either way the
 * request reaches the Express API.
 *
 * Server-side (SSR): calls the API directly via internal URL.
 */

export type PageSlug = 'contact' | 'work-with-me' | 'about' | 'terms' | 'privacy' | 'header' | 'footer' | 'home' | 'book-clubs' | 'blog' | 'recommendations' | 'musings' | 'email-settings';

const getBaseUrl = (): string => {
  // Browser: use relative URLs (empty string) so /api/... goes through the
  // current origin. The server (Apache or Next.js rewrite) proxies to the API.
  if (typeof window !== 'undefined') {
    return '';
  }
  // Server-side (SSR / getServerSideProps): call the API directly.
  return process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5001';
};

/**
 * Resolve image URL for display.
 * In static export there are no Next.js rewrites, so API assets must be absolute URLs
 * (based on NEXT_PUBLIC_API_URL).
 */
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

async function safeFetch(url: string, options?: RequestInit, label?: string): Promise<Response> {
  const tag = label || url;
  console.log(`[API] ${tag} → ${url}`);
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      console.warn(`[API] ${tag} — ${res.status} ${res.statusText}`);
    }
    return res;
  } catch (err) {
    console.error(`[API] ${tag} — network error:`, err);
    throw err;
  }
}

export function getImageUrl(url: string | undefined | null): string {
  if (!url || typeof url !== 'string' || !url.trim()) return '';
  let trimmed = url.trim();

  // Strip localhost origins stored in DB (e.g. http://localhost:5000/api/img/...)
  // so they become relative URLs that go through the Next.js rewrite.
  const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/;
  if (localhostPattern.test(trimmed)) {
    trimmed = trimmed.replace(localhostPattern, '');
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const path = trimmed.startsWith('/') ? trimmed : '/' + trimmed;
  return path;
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

/** POST /api/test-email – requires admin token. Sends one test email to the given address (for SMTP testing). */
export async function sendTestEmail(to: string): Promise<{ message: string }> {
  const token = getAdminToken();
  if (!token) throw new Error('Not logged in');
  const res = await safeFetch(`${getBaseUrl()}/api/test-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ to: to.trim() }),
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

/** POST /api/book-clubs/announce – requires admin token. Sends book club announcement to all subscribers. */
export async function announceBookClub(bookClubId: string): Promise<{ sent: number; total: number }> {
  const token = getAdminToken();
  if (!token) throw new Error('Not logged in');
  const res = await safeFetch(`${getBaseUrl()}/api/book-clubs/announce`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ bookClubId: bookClubId.trim() }),
  });
  const data = await parseJsonResponse(res, 'book-clubs/announce').catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Failed to send announcement: ${res.status}`);
  return data as { sent: number; total: number };
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
export async function subscribe(email: string, options?: { name?: string; source?: string }): Promise<{ message: string; subscribed: boolean }> {
  const res = await safeFetch(`${getBaseUrl()}/api/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), name: options?.name?.trim(), source: options?.source }),
  });
  const data = await parseJsonResponse(res, 'subscribe').catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to subscribe');
  return data as { message: string; subscribed: boolean };
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

export type UploadModule = 'home' | 'about' | 'book-clubs' | 'blog' | 'recommendations' | 'musings' | 'contact' | 'work-with-me' | 'footer' | 'header';

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
  return { url: url.startsWith('http') ? url : `${base}${url}` };
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
