/**
 * API client for the backend. Used by admin pages and login.
 * Base URL: NEXT_PUBLIC_API_URL or http://localhost:5000
 */

export type PageSlug = 'contact' | 'work-with-me' | 'about' | 'terms' | 'privacy' | 'header' | 'home' | 'book-clubs';

const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
};

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

/** GET /api/settings/pages/:slug – returns { content } or { content: null } */
export async function getPageSettings(slug: PageSlug): Promise<{ content: unknown }> {
  const res = await fetch(`${getBaseUrl()}/api/settings/pages/${slug}`);
  if (!res.ok) throw new Error(`Failed to load ${slug}: ${res.status}`);
  return res.json();
}

/** PUT /api/settings/pages/:slug – requires admin token */
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
  return res.json();
}

// ——— Book Clubs (dedicated API for admin and display) ———

/** GET /api/book-clubs – returns { content } (public) */
export async function getBookClubs(): Promise<{ content: unknown }> {
  const res = await fetch(`${getBaseUrl()}/api/book-clubs`);
  if (!res.ok) throw new Error(`Failed to load book clubs: ${res.status}`);
  return res.json();
}

/** PUT /api/book-clubs – requires admin token, body = full payload to store */
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
  return res.json();
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
