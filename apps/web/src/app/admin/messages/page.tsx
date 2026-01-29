'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Mail, Briefcase, Check } from 'lucide-react';
import { getMessages, markMessageRead, type MessageDto } from '@/lib/api';
import PageLoading from '@/components/PageLoading';

const PAGE_SIZE = 20;

export default function AdminMessagesPage() {
  const [list, setList] = useState<MessageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(PAGE_SIZE);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'contact' | 'work-with-me'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await getMessages({
        page,
        limit,
        source: sourceFilter === 'all' ? undefined : sourceFilter,
      });
      setList(res.list);
      setTotal(res.total);
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to load messages' });
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, sourceFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleMarkRead = async (id: string) => {
    try {
      await markMessageRead(id);
      setList((prev) => prev.map((m) => (m.id === id ? { ...m, read: true } : m)));
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to mark as read' });
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
    return <PageLoading message="Loading messages…" />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown mb-2">
            Enquiries
          </h1>
          <p className="font-body text-chai-brown-light">
            Contact form and Work With Me submissions. Total: <strong>{total}</strong>
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`mb-6 px-4 py-3 rounded-lg font-body text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm font-sans text-chai-brown-light">Filter:</span>
        {(['all', 'contact', 'work-with-me'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => { setSourceFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-sans ${
              sourceFilter === s
                ? 'bg-terracotta text-white'
                : 'bg-cream-light text-chai-brown border border-chai-brown/20 hover:border-terracotta'
            }`}
          >
            {s === 'all' ? 'All' : s === 'contact' ? 'Contact' : 'Work With Me'}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="bg-cream-light rounded-xl p-8 text-center text-chai-brown-light font-body">
          No messages yet.
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((m) => (
            <div
              key={m.id}
              className={`rounded-xl border p-4 sm:p-5 ${
                m.read ? 'bg-cream-light border-chai-brown/10' : 'bg-white border-terracotta/30'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {m.source === 'contact' ? (
                    <Mail size={18} className="text-chai-brown-light shrink-0" />
                  ) : (
                    <Briefcase size={18} className="text-terracotta shrink-0" />
                  )}
                  <span className="font-sans font-medium text-chai-brown">{m.name}</span>
                  <span className="text-chai-brown-light text-sm">{m.email}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-chai-brown/10 text-chai-brown">
                    {m.source === 'contact' ? 'Contact' : 'Work With Me'}
                  </span>
                  {!m.read && (
                    <span className="text-xs px-2 py-0.5 rounded bg-terracotta/20 text-terracotta">
                      New
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-chai-brown-light">{formatDate(m.createdAt)}</span>
                  {!m.read && (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(m.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-sage/20 text-chai-brown hover:bg-sage/30"
                    >
                      <Check size={14} /> Mark read
                    </button>
                  )}
                </div>
              </div>
              {m.source === 'contact' && m.subject && (
                <p className="mt-2 font-sans text-sm text-chai-brown font-medium">
                  Subject: {m.subject}
                </p>
              )}
              {m.source === 'work-with-me' && m.service && (
                <p className="mt-2 font-sans text-sm text-terracotta">
                  Service: {m.service}
                </p>
              )}
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
                  className="text-sm text-terracotta hover:underline font-sans"
                >
                  {expandedId === m.id ? 'Hide message' : 'Show message'}
                </button>
                {expandedId === m.id && (
                  <p className="mt-2 text-chai-brown-light font-body text-sm whitespace-pre-wrap border-t border-chai-brown/10 pt-2">
                    {m.message}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1 px-4 py-2 rounded-lg border border-chai-brown/20 text-chai-brown disabled:opacity-50 disabled:cursor-not-allowed hover:border-terracotta"
          >
            <ChevronLeft size={18} /> Previous
          </button>
          <span className="font-sans text-sm text-chai-brown-light">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="flex items-center gap-1 px-4 py-2 rounded-lg border border-chai-brown/20 text-chai-brown disabled:opacity-50 disabled:cursor-not-allowed hover:border-terracotta"
          >
            Next <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
