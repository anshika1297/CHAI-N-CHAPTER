/**
 * API client for the backend. Used by admin pages and login.
 * Base URL: NEXT_PUBLIC_API_URL or http://localhost:5000
 */

export type PageSlug = 'contact' | 'work-with-me' | 'about' | 'terms' | 'privacy' | 'header' | 'home' | 'book-clubs' | 'blog' | 'recommendations' | 'musings';

const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
};

/**
 * Resolve image URL for display. Upload paths (e.g. /api/uploads/...) are proxied by Next.js
 * to the API (see next.config.js rewrites), so we return the path only so the browser
 * requests the same origin and the image loads. External URLs (http/https) are returned as-is.
 */
export function getImageUrl(url: string | undefined | null): string {
  if (!url || typeof url !== 'string' || !url.trim()) return '';
  const trimmed = url.trim();
  // External URL: use as-is
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // If it's our API upload path, use path only so Next.js rewrite proxies it (same-origin = reliable)
    try {
      const u = new URL(trimmed);
      if (u.pathname.startsWith('/api/uploads/')) return u.pathname;
    } catch {
      /* ignore */
    }
    return trimmed;
  }
  // Relative path: ensure leading slash so it hits our origin and gets proxied
  return trimmed.startsWith('/') ? trimmed : '/' + trimmed;
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
      const res = await fetch(`${getBaseUrl()}/api/settings/pages/${slug}`);
      if (!res.ok) throw new Error(`Failed to load ${slug}: ${res.status}`);
      const data = await res.json();
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
  const res = await fetch(`${getBaseUrl()}/api/settings/pages/${slug}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `Failed to save ${slug}: ${res.status}`);
  }
  pageCache.delete(slug);
  return res.json();
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
      const res = await fetch(`${getBaseUrl()}/api/book-clubs`);
      if (!res.ok) throw new Error(`Failed to load book clubs: ${res.status}`);
      const data = await res.json();
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
  const res = await fetch(`${getBaseUrl()}/api/book-clubs`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(content),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `Failed to save book clubs: ${res.status}`);
  }
  bookClubsCache = null;
  return res.json();
}

// ——— Blog (Book Reviews) – public list & single post ———

/** GET /api/blog/posts – returns { posts } (public). */
export async function getBlogPosts(): Promise<{ posts: unknown[] }> {
  const res = await fetch(`${getBaseUrl()}/api/blog/posts`);
  if (!res.ok) throw new Error(`Failed to load blog posts: ${res.status}`);
  return res.json();
}

/** GET /api/blog/posts/:slug – returns { post } or 404 (public). */
export async function getBlogPostBySlug(slug: string): Promise<{ post: unknown }> {
  const res = await fetch(`${getBaseUrl()}/api/blog/posts/${encodeURIComponent(slug)}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error('Post not found');
    throw new Error(`Failed to load post: ${res.status}`);
  }
  return res.json();
}

// ——— Recommendations – public list & single ———

/** GET /api/recommendations – returns { items } (public). */
export async function getRecommendations(): Promise<{ items: unknown[] }> {
  const res = await fetch(`${getBaseUrl()}/api/recommendations`);
  if (!res.ok) throw new Error(`Failed to load recommendations: ${res.status}`);
  return res.json();
}

/** GET /api/recommendations/:slug – returns { item } or 404 (public). */
export async function getRecommendationBySlug(slug: string): Promise<{ item: unknown }> {
  const res = await fetch(`${getBaseUrl()}/api/recommendations/${encodeURIComponent(slug)}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error('Recommendation not found');
    throw new Error(`Failed to load recommendation: ${res.status}`);
  }
  return res.json();
}

// ——— Musings (Her Musings Verse) – public list & single ———

/** GET /api/musings – returns { items } (public). */
export async function getMusings(): Promise<{ items: unknown[] }> {
  const res = await fetch(`${getBaseUrl()}/api/musings`);
  if (!res.ok) throw new Error(`Failed to load musings: ${res.status}`);
  return res.json();
}

/** GET /api/musings/:slug – returns { item } or 404 (public). */
export async function getMusingBySlug(slug: string): Promise<{ item: unknown }> {
  const res = await fetch(`${getBaseUrl()}/api/musings/${encodeURIComponent(slug)}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error('Musing not found');
    throw new Error(`Failed to load musing: ${res.status}`);
  }
  return res.json();
}

// ——— Subscriptions (public subscribe; admin list) ———

/** POST /api/subscribe – public. Subscribe with email (optional name, source). */
export async function subscribe(email: string, options?: { name?: string; source?: string }): Promise<{ message: string; subscribed: boolean }> {
  const res = await fetch(`${getBaseUrl()}/api/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), name: options?.name?.trim(), source: options?.source }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to subscribe');
  return data as { message: string; subscribed: boolean };
}

/** POST /api/subscribe/unsubscribe – public. Unsubscribe by email. */
export async function unsubscribe(email: string): Promise<{ message: string; subscribed: boolean }> {
  const res = await fetch(`${getBaseUrl()}/api/subscribe/unsubscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim() }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to unsubscribe');
  return data as { message: string; subscribed: boolean };
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
  const res = await fetch(`${getBaseUrl()}/api/subscribers${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `Failed to load subscribers: ${res.status}`);
  }
  return res.json();
}

// ——— Image upload (admin only) ———

export type UploadModule = 'home' | 'about' | 'book-clubs' | 'blog' | 'recommendations' | 'musings' | 'contact' | 'work-with-me';

/** POST /api/upload – multipart "file" + optional "module". Returns { url } (absolute path to use as imageUrl). */
export async function uploadImage(file: File, module: UploadModule = 'home'): Promise<{ url: string }> {
  const token = getAdminToken();
  if (!token) throw new Error('Not logged in');
  const form = new FormData();
  form.append('file', file);
  form.append('module', module);
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Upload failed: ${res.status}`);
  }
  const url = (data as { url?: string }).url;
  if (!url) throw new Error('No url in upload response');
  return { url: url.startsWith('http') ? url : `${base}${url}` };
}

/** POST /api/auth/login – returns { token } */
export async function login(email: string, password: string): Promise<{ token: string }> {
  const res = await fetch(`${getBaseUrl()}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
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
  const res = await fetch(`${getBaseUrl()}/api/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `Failed to load users: ${res.status}`);
  }
  return res.json();
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
  const res = await fetch(`${getBaseUrl()}/api/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
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
  const res = await fetch(`${getBaseUrl()}/api/users/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to update user');
  return data as { user: AdminUserDto };
}

/** DELETE /api/users/:id – delete user (protected). */
export async function deleteUser(id: string): Promise<void> {
  const token = getAdminToken();
  if (!token) throw new Error('Not logged in');
  const res = await fetch(`${getBaseUrl()}/api/users/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error || 'Failed to delete user');
  }
}

// ——— Dashboard (admin only) ———

export interface DashboardStats {
  totalVisitors: number;
  monthlyVisitors: number;
  totalPosts: number;
  totalSubscribers: number;
  totalAdminUsers?: number;
}

/** GET /api/dashboard/stats – returns stats (protected). Use dummy when not available. */
export async function getDashboardStats(): Promise<DashboardStats> {
  const token = getAdminToken();
  if (!token) throw new Error('Not logged in');
  const res = await fetch(`${getBaseUrl()}/api/dashboard/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load stats');
  return res.json();
}
