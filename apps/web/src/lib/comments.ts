import { getFetchBaseUrl } from '@/lib/apiBase';
import { getAdminToken } from '@/lib/api';

export type CommentContentType = 'blog' | 'recommendations' | 'musings' | 'author-spotlight';

export type CommentNode = {
  id: string;
  parentId: string | null;
  name: string;
  body: string;
  createdAt: string;
  replies: CommentNode[];
};

export const DISCUSSION_PROMPTS: Record<CommentContentType, string> = {
  blog: 'Have you read this book?',
  recommendations: 'Which book interests you most?',
  musings: 'What are your thoughts?',
  'author-spotlight': 'What would you ask this author?',
};

export const CONTENT_TYPE_LABELS: Record<CommentContentType, string> = {
  blog: 'Review',
  recommendations: 'Recommendations',
  musings: 'Musings',
  'author-spotlight': 'Author spotlight',
};

export function contentPublicPath(type: CommentContentType, slug: string): string {
  if (type === 'blog') return `/blog/${slug}`;
  if (type === 'recommendations') return `/recommendations/${slug}`;
  if (type === 'musings') return `/musings/${slug}`;
  return `/author-spotlight/${slug}`;
}

export async function fetchComments(
  contentType: CommentContentType,
  contentSlug: string
): Promise<{ comments: CommentNode[]; count: number }> {
  const params = new URLSearchParams({ contentType, contentSlug });
  const res = await fetch(`${getFetchBaseUrl()}/api/comments?${params}`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 30 },
  });
  if (!res.ok) return { comments: [], count: 0 };
  const data = (await res.json()) as { comments?: CommentNode[]; count?: number };
  return {
    comments: Array.isArray(data.comments) ? data.comments : [],
    count: typeof data.count === 'number' ? data.count : 0,
  };
}

export async function submitComment(input: {
  contentType: CommentContentType;
  contentSlug: string;
  body: string;
  parentId?: string;
  website?: string;
  name?: string;
  email?: string;
  subscriberToken?: string;
}): Promise<{ message: string }> {
  const res = await fetch(`${getFetchBaseUrl()}/api/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(input),
  });
  const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
  if (!res.ok) throw new Error(data.error || 'Failed to submit comment');
  return { message: data.message || 'Thanks! Your comment will appear after moderation.' };
}

export type AdminCommentDto = {
  id: string;
  contentType: CommentContentType;
  contentSlug: string;
  parentId: string | null;
  name: string;
  email: string;
  body: string;
  status: 'pending' | 'approved' | 'rejected' | 'spam';
  createdAt: string;
};

export async function getAdminComments(params?: {
  page?: number;
  limit?: number;
  status?: 'pending' | 'approved' | 'rejected' | 'spam' | 'all';
}): Promise<{ list: AdminCommentDto[]; total: number; pendingTotal: number; page: number; limit: number }> {
  const token = getAdminToken();
  if (!token) throw new Error('Not logged in');
  const search = new URLSearchParams();
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.limit != null) search.set('limit', String(params.limit));
  if (params?.status) search.set('status', params.status);
  const qs = search.toString();
  const res = await fetch(`${getFetchBaseUrl()}/api/comments/admin${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || 'Failed to load comments');
  }
  return res.json();
}

export async function updateCommentStatus(
  id: string,
  status: AdminCommentDto['status']
): Promise<void> {
  const token = getAdminToken();
  if (!token) throw new Error('Not logged in');
  const res = await fetch(`${getFetchBaseUrl()}/api/comments/admin/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || 'Failed to update');
  }
}

export async function deleteComment(id: string): Promise<void> {
  const token = getAdminToken();
  if (!token) throw new Error('Not logged in');
  const res = await fetch(`${getFetchBaseUrl()}/api/comments/admin/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || 'Failed to delete');
  }
}
