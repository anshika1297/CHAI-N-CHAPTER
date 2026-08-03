'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Check,
  X,
  Ban,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import PageLoading from '@/components/PageLoading';
import {
  getAdminComments,
  updateCommentStatus,
  deleteComment,
  contentPublicPath,
  CONTENT_TYPE_LABELS,
  type AdminCommentDto,
} from '@/lib/comments';

const PAGE_SIZE = 20;

const STATUS_FILTERS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'spam', label: 'Spam' },
  { value: 'all', label: 'All' },
] as const;

export default function AdminCommentsPage() {
  const [list, setList] = useState<AdminCommentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]['value']>('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await getAdminComments({ page, limit: PAGE_SIZE, status: statusFilter });
      setList(res.list);
      setTotal(res.total);
      setPendingTotal(res.pendingTotal);
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to load comments' });
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatus = async (id: string, status: AdminCommentDto['status']) => {
    setActingId(id);
    try {
      await updateCommentStatus(id, status);
      setMessage({ type: 'success', text: `Comment marked as ${status}` });
      await load();
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to update' });
    } finally {
      setActingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this comment and all its replies?')) return;
    setActingId(id);
    try {
      await deleteComment(id);
      setMessage({ type: 'success', text: 'Comment deleted' });
      await load();
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to delete' });
    } finally {
      setActingId(null);
    }
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return d;
    }
  };

  if (loading && list.length === 0) {
    return <PageLoading message="Loading comments…" />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown mb-2 flex items-center gap-2">
            <MessageCircle size={32} className="text-terracotta" aria-hidden />
            Comments
          </h1>
          <p className="font-body text-chai-brown-light">
            Moderate reader discussions.{' '}
            {pendingTotal > 0 ? (
              <strong className="text-terracotta">{pendingTotal} pending</strong>
            ) : (
              <span>No pending comments</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => {
                setPage(1);
                setStatusFilter(f.value);
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-sans border transition-colors ${
                statusFilter === f.value
                  ? 'bg-terracotta text-cream border-terracotta'
                  : 'bg-white text-chai-brown border-chai-brown/20 hover:border-terracotta/40'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {message ? (
        <p
          className={`mb-6 px-4 py-3 rounded-lg text-sm font-body ${
            message.type === 'success'
              ? 'bg-sage/10 text-sage border border-sage/20'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </p>
      ) : null}

      {list.length === 0 ? (
        <p className="font-body text-chai-brown-light py-12 text-center">No comments in this filter.</p>
      ) : (
        <ul className="space-y-4">
          {list.map((item) => {
            const expanded = expandedId === item.id;
            const busy = actingId === item.id;
            const publicPath = contentPublicPath(item.contentType, item.contentSlug);
            return (
              <li
                key={item.id}
                className="rounded-xl border border-chai-brown/12 bg-white shadow-sm overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : item.id)}
                  className="w-full text-left px-4 sm:px-6 py-4 hover:bg-cream/50 transition-colors"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <span className="font-sans font-medium text-chai-brown">{item.name}</span>
                      <span className="mx-2 text-chai-brown-light">·</span>
                      <span className="text-xs font-sans text-chai-brown-light">{item.email}</span>
                    </div>
                    <span
                      className={`text-xs font-sans px-2 py-0.5 rounded-full ${
                        item.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : item.status === 'approved'
                            ? 'bg-sage/15 text-sage'
                            : item.status === 'spam'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-chai-brown/10 text-chai-brown-light'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-2 font-body text-sm text-chai-brown/90 line-clamp-2">{item.body}</p>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-sans text-chai-brown-light">
                    <span>{CONTENT_TYPE_LABELS[item.contentType]}</span>
                    <span>{formatDate(item.createdAt)}</span>
                    {item.parentId ? <span>Reply</span> : null}
                  </div>
                </button>

                {expanded ? (
                  <div className="px-4 sm:px-6 pb-4 border-t border-chai-brown/8 bg-cream/30">
                    <p className="mt-4 font-body text-sm text-chai-brown whitespace-pre-wrap leading-relaxed">
                      {item.body}
                    </p>
                    <Link
                      href={publicPath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-xs font-sans text-terracotta hover:underline"
                    >
                      View on site <ExternalLink size={12} />
                    </Link>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {item.status !== 'approved' ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleStatus(item.id, 'approved')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sage text-white text-xs font-sans hover:bg-sage/90 disabled:opacity-60"
                        >
                          <Check size={14} /> Approve
                        </button>
                      ) : null}
                      {item.status !== 'rejected' ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleStatus(item.id, 'rejected')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-chai-brown/20 text-chai-brown text-xs font-sans hover:bg-chai-brown/5 disabled:opacity-60"
                        >
                          <X size={14} /> Reject
                        </button>
                      ) : null}
                      {item.status !== 'spam' ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleStatus(item.id, 'spam')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-red-700 text-xs font-sans hover:bg-red-50 disabled:opacity-60"
                        >
                          <Ban size={14} /> Spam
                        </button>
                      ) : null}
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleDelete(item.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-300 text-red-800 text-xs font-sans hover:bg-red-50 disabled:opacity-60 ml-auto"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {totalPages > 1 ? (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-chai-brown/20 text-sm font-sans disabled:opacity-40"
          >
            <ChevronLeft size={16} /> Prev
          </button>
          <span className="text-sm font-sans text-chai-brown-light">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-chai-brown/20 text-sm font-sans disabled:opacity-40"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
