'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { getSubscribers, type SubscriberDto } from '@/lib/api';
import PageLoading from '@/components/PageLoading';

const PAGE_SIZE = 20;
const EXPORT_PAGE_SIZE = 100;

function escapeCsvCell(value: string): string {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export default function AdminSubscribersPage() {
  const [subscribers, setSubscribers] = useState<SubscriberDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [totalSubscribed, setTotalSubscribed] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'all' | 'subscribed' | 'unsubscribed'>('subscribed');
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await getSubscribers({
        page,
        limit: PAGE_SIZE,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setSubscribers(res.subscribers);
      setTotalPages(res.pagination.totalPages);
      setTotal(res.pagination.total);
      setTotalSubscribed(res.totalSubscribed);
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to load subscribers' });
      setSubscribers([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleExportCsv = useCallback(async () => {
    setExporting(true);
    setMessage(null);
    try {
      const all: SubscriberDto[] = [];
      let p = 1;
      let hasMore = true;
      while (hasMore) {
        const res = await getSubscribers({
          page: p,
          limit: EXPORT_PAGE_SIZE,
          status: statusFilter === 'all' ? undefined : statusFilter,
        });
        all.push(...res.subscribers);
        hasMore = res.pagination.totalPages > p;
        p += 1;
      }
      const headers = ['email', 'name', 'status', 'subscribedAt', 'unsubscribedAt', 'source'];
      const rows = all.map((s) =>
        headers.map((h) => escapeCsvCell(String((s as Record<string, unknown>)[h] ?? ''))).join(',')
      );
      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subscribers-${statusFilter}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: `Exported ${all.length} subscriber(s) to CSV.` });
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Export failed' });
    } finally {
      setExporting(false);
    }
  }, [statusFilter]);

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return d;
    }
  };

  if (loading && subscribers.length === 0) {
    return <PageLoading message="Loading subscribers…" />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown mb-2">
            Subscribers
          </h1>
          <p className="font-body text-chai-brown-light">
            Newsletter subscribers. Total subscribed: <strong>{totalSubscribed}</strong>
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={exporting || total === 0}
          className="flex items-center gap-2 px-4 py-2 border border-chai-brown/20 rounded-lg font-body text-sm text-chai-brown hover:bg-cream transition-colors disabled:opacity-50 disabled:pointer-events-none"
        >
          <Download size={18} />
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
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

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="font-body text-sm text-chai-brown">Filter:</span>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as 'all' | 'subscribed' | 'unsubscribed');
            setPage(1);
          }}
          className="px-3 py-2 border border-chai-brown/20 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-terracotta"
        >
          <option value="subscribed">Subscribed</option>
          <option value="unsubscribed">Unsubscribed</option>
          <option value="all">All</option>
        </select>
      </div>

      <div className="bg-white rounded-lg border border-chai-brown/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cream">
              <tr>
                <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">
                  Email
                </th>
                <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">
                  Subscribed
                </th>
                <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">
                  Source
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-chai-brown/10">
              {subscribers.map((s) => (
                <tr key={s.id} className="hover:bg-cream/50">
                  <td className="px-4 py-3 font-body text-sm text-chai-brown">
                    {s.email}
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-chai-brown-light">
                    {s.name || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-1 rounded text-xs font-body ${
                        s.status === 'subscribed'
                          ? 'bg-sage/20 text-sage-dark'
                          : 'bg-chai-brown/10 text-chai-brown-light'
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-chai-brown-light">
                    {formatDate(s.subscribedAt)}
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-chai-brown-light">
                    {s.source || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {subscribers.length === 0 && !loading && (
          <div className="px-4 py-12 text-center font-body text-chai-brown-light">
            No subscribers found.
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="font-body text-sm text-chai-brown-light">
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-2 border border-chai-brown/20 rounded-lg font-body text-sm hover:bg-cream disabled:opacity-50 disabled:pointer-events-none"
            >
              <ChevronLeft size={18} />
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 px-3 py-2 border border-chai-brown/20 rounded-lg font-body text-sm hover:bg-cream disabled:opacity-50 disabled:pointer-events-none"
            >
              Next
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
