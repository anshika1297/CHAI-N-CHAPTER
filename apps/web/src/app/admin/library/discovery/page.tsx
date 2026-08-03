'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Edit, Loader2, Search } from 'lucide-react';
import { listLibraryBooks, updateLibraryBook } from '@/lib/library/api';
import {
  DISCOVERY_SOURCES,
  DISCOVERY_SOURCE_LABELS,
  DISCOVERY_STATUSES,
  DISCOVERY_STATUS_LABELS,
  type DiscoverySource,
  type DiscoveryStatus,
  type LibraryBookDto,
} from '@/lib/library/types';

const PAGE_SIZE = 30;
const PIPELINE = DISCOVERY_STATUSES.join(',');

const selectClass =
  'px-3 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body text-sm bg-white';

export default function LibraryDiscoveryPage() {
  const [books, setBooks] = useState<LibraryBookDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [status, setStatus] = useState<'' | DiscoveryStatus>('');
  const [source, setSource] = useState<'' | DiscoverySource>('');
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(t);
  }, [query]);

  const load = useCallback(
    (nextPage: number) => {
      setLoading(true);
      listLibraryBooks({
        page: nextPage,
        limit: PAGE_SIZE,
        q: debouncedQuery || undefined,
        discoveryStatus: status || PIPELINE,
        discoverySource: source || undefined,
        sort: 'recent',
      })
        .then((res) => {
          setBooks(res.books);
          setTotal(res.total);
          setPage(res.page);
          setTotalPages(res.totalPages);
          setError(null);
        })
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load discovery'))
        .finally(() => setLoading(false));
    },
    [debouncedQuery, status, source]
  );

  useEffect(() => {
    load(1);
  }, [load]);

  const setDiscoveryStatus = async (book: LibraryBookDto, next: DiscoveryStatus | '') => {
    setSavingId(book._id);
    try {
      const { book: updated } = await updateLibraryBook(book._id, {
        discoveryStatus: next || undefined,
      });
      setBooks((prev) => {
        if (!next) return prev.filter((b) => b._id !== book._id);
        if (status && next !== status) return prev.filter((b) => b._id !== book._id);
        return prev.map((b) => (b._id === book._id ? updated : b));
      });
      if (!next || (status && next !== status)) setTotal((t) => Math.max(0, t - 1));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update status');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown mb-2">Discovery inbox</h1>
        <p className="font-body text-chai-brown-light">
          Books you&apos;ve seen, want to buy, or might read someday — before they hit the main shelf.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-body text-sm">
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setStatus('')}
          className={`px-3 py-1.5 rounded-lg font-body text-sm border transition-colors ${
            !status
              ? 'bg-terracotta text-white border-terracotta'
              : 'bg-white text-chai-brown border-chai-brown/20 hover:border-terracotta/40'
          }`}
        >
          All pipeline
        </button>
        {DISCOVERY_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-lg font-body text-sm border transition-colors ${
              status === s
                ? 'bg-terracotta text-white border-terracotta'
                : 'bg-white text-chai-brown border-chai-brown/20 hover:border-terracotta/40'
            }`}
          >
            {DISCOVERY_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-chai-brown-light" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title or author…"
            className="w-full pl-9 pr-3 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body text-sm"
          />
        </div>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value as '' | DiscoverySource)}
          className={selectClass}
          aria-label="Discovery source"
        >
          <option value="">All sources</option>
          {DISCOVERY_SOURCES.map((s) => (
            <option key={s} value={s}>
              {DISCOVERY_SOURCE_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {loading && books.length === 0 ? (
        <p className="font-body text-chai-brown-light flex items-center gap-2">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </p>
      ) : books.length === 0 ? (
        <div className="rounded-lg border border-chai-brown/10 bg-white p-8 text-center">
          <p className="font-body text-chai-brown-light mb-3">Nothing in this part of the pipeline.</p>
          <Link href="/admin/library/books/new" className="font-body text-sm text-terracotta hover:underline">
            Add a book with a discovery status
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-chai-brown/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream/60 border-b border-chai-brown/10">
                <tr>
                  <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">Book</th>
                  <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">Status</th>
                  <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">Source</th>
                  <th className="px-4 py-3 text-right font-body text-sm font-medium text-chai-brown">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-chai-brown/10">
                {books.map((b) => (
                  <tr key={b._id} className="hover:bg-cream/40">
                    <td className="px-4 py-3">
                      <p className="font-body text-chai-brown font-medium">{b.title}</p>
                      <p className="font-body text-sm text-chai-brown-light">{b.author}</p>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={b.discoveryStatus || ''}
                        disabled={savingId === b._id}
                        onChange={(e) =>
                          setDiscoveryStatus(b, e.target.value as DiscoveryStatus | '')
                        }
                        className={selectClass}
                      >
                        <option value="">Clear</option>
                        {DISCOVERY_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {DISCOVERY_STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-chai-brown-light">
                      {b.discoverySource
                        ? DISCOVERY_SOURCE_LABELS[b.discoverySource as DiscoverySource] ||
                          b.discoverySource
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/library/books/${b._id}`}
                        className="inline-flex p-2 text-terracotta hover:bg-terracotta/10 rounded"
                        title="Edit book"
                      >
                        <Edit size={18} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {total > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => load(page - 1)}
            className="px-3 py-2 rounded-lg border border-chai-brown/20 font-body text-sm text-chai-brown disabled:opacity-40 hover:bg-cream"
          >
            Previous
          </button>
          <span className="font-body text-sm text-chai-brown-light">
            Page {page} of {totalPages} · {total} books
          </span>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => load(page + 1)}
            className="px-3 py-2 rounded-lg border border-chai-brown/20 font-body text-sm text-chai-brown disabled:opacity-40 hover:bg-cream"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
