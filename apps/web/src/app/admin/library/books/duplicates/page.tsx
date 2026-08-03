'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { GitMerge, Loader2, RefreshCw } from 'lucide-react';
import { listDuplicateBooks, mergeLibraryBooks } from '@/lib/library/api';
import { STATUS_LABELS, type DuplicateGroup, type ReadingStatus } from '@/lib/library/types';

export default function LibraryDuplicatesPage() {
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [totalGroups, setTotalGroups] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [merging, setMerging] = useState<string | null>(null);
  const [keepByGroup, setKeepByGroup] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    setLoading(true);
    listDuplicateBooks()
      .then((res) => {
        setGroups(res.groups);
        setTotalGroups(res.totalGroups);
        const initial: Record<string, string> = {};
        for (const g of res.groups) {
          const best = [...g.books].sort((a, b) => b.fieldCount - a.fieldCount)[0];
          if (best) initial[g.key] = best._id;
        }
        setKeepByGroup(initial);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to find duplicates'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const mergeGroup = async (group: DuplicateGroup) => {
    const keepId = keepByGroup[group.key];
    if (!keepId) return;
    const dropIds = group.books.map((b) => b._id).filter((id) => id !== keepId);
    if (dropIds.length === 0) return;
    if (
      !window.confirm(
        `Merge ${dropIds.length} duplicate(s) into the selected keep book? This cannot be undone.`
      )
    ) {
      return;
    }
    setMerging(group.key);
    try {
      for (const dropId of dropIds) {
        await mergeLibraryBooks(keepId, dropId);
      }
      setGroups((prev) => prev.filter((g) => g.key !== group.key));
      setTotalGroups((n) => Math.max(0, n - 1));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Merge failed');
      load();
    } finally {
      setMerging(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown mb-2">Duplicate books</h1>
          <p className="font-body text-chai-brown-light">
            Matches by ISBN or the same title + author. Pick which record to keep, then merge.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-chai-brown/20 font-body text-sm text-chai-brown hover:bg-cream disabled:opacity-40"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Rescan
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-body text-sm">
          {error}
        </div>
      )}

      {loading && groups.length === 0 ? (
        <p className="font-body text-chai-brown-light flex items-center gap-2">
          <Loader2 size={16} className="animate-spin" /> Scanning library…
        </p>
      ) : groups.length === 0 ? (
        <div className="rounded-lg border border-chai-brown/10 bg-white p-8 text-center">
          <p className="font-body text-chai-brown-light mb-2">No duplicate groups found.</p>
          <Link href="/admin/library/books" className="font-body text-sm text-terracotta hover:underline">
            Back to My Books
          </Link>
        </div>
      ) : (
        <>
          <p className="font-body text-sm text-chai-brown-light mb-4">
            {totalGroups} group{totalGroups === 1 ? '' : 's'} found
          </p>
          <div className="space-y-6">
            {groups.map((group) => (
              <section
                key={group.key}
                className="bg-white rounded-lg border border-chai-brown/10 p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <p className="font-body text-sm text-chai-brown-light">
                    Matched by{' '}
                    <span className="text-chai-brown">
                      {group.reason === 'isbn' ? 'ISBN' : 'title + author'}
                    </span>
                  </p>
                  <button
                    type="button"
                    disabled={merging === group.key}
                    onClick={() => mergeGroup(group)}
                    className="inline-flex items-center gap-2 bg-terracotta text-white px-3 py-2 rounded-lg hover:bg-terracotta/90 font-body text-sm disabled:opacity-50"
                  >
                    {merging === group.key ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <GitMerge size={16} />
                    )}
                    Merge into keep
                  </button>
                </div>
                <ul className="space-y-3">
                  {group.books.map((b) => {
                    const checked = keepByGroup[group.key] === b._id;
                    return (
                      <li
                        key={b._id}
                        className={`flex flex-wrap items-start gap-3 rounded-lg border p-3 ${
                          checked ? 'border-terracotta/40 bg-terracotta/5' : 'border-chai-brown/10'
                        }`}
                      >
                        <label className="flex items-start gap-3 flex-1 cursor-pointer min-w-0">
                          <input
                            type="radio"
                            name={`keep-${group.key}`}
                            checked={checked}
                            onChange={() =>
                              setKeepByGroup((prev) => ({ ...prev, [group.key]: b._id }))
                            }
                            className="mt-1"
                          />
                          <span className="min-w-0">
                            <span className="font-body text-chai-brown font-medium block truncate">
                              {b.title}
                            </span>
                            <span className="font-body text-sm text-chai-brown-light block">
                              {b.author}
                              {b.isbn ? ` · ISBN ${b.isbn}` : ''}
                            </span>
                            <span className="font-body text-xs text-chai-brown-light block mt-1">
                              {STATUS_LABELS[b.status as ReadingStatus] || b.status}
                              {b.rating ? ` · ${b.rating}★` : ''}
                              {` · ${b.timesRecommended} recs`}
                              {` · ${b.fieldCount} fields filled`}
                            </span>
                          </span>
                        </label>
                        <Link
                          href={`/admin/library/books/${b._id}`}
                          className="font-body text-xs text-terracotta hover:underline shrink-0"
                        >
                          Open
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
