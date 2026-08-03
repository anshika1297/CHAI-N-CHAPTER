'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Library, Loader2, Sparkles, ListChecks, CalendarDays } from 'lucide-react';
import {
  getCollectionsCalendar,
  listLibraryCollections,
  seedLibraryCollections,
  type LibraryCollectionItem,
} from '@/lib/library/api';

const PILLAR_ORDER = [
  'Signature',
  'India Bookshelf',
  'World Bookshelf',
  'Roots of Bharat',
  'Mood Reads',
  'Other',
];

export default function LibraryCollectionsPage() {
  const [byPillar, setByPillar] = useState<Record<string, LibraryCollectionItem[]>>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [calendar, setCalendar] = useState<
    { series: string; angle: string; books: { _id: string; title: string; author: string; country?: string }[] }[]
  >([]);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([listLibraryCollections(), getCollectionsCalendar(6)])
      .then(([cols, cal]) => {
        setByPillar(cols.byPillar || {});
        setTotal(cols.totalCollections);
        setCalendar(cal.weeks || []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const seed = () => {
    setSeeding(true);
    setNote(null);
    seedLibraryCollections()
      .then((res) => {
        setNote(`Seeded ${res.created} new collection names into Master Data (${res.total} total vocabulary).`);
        load();
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Seed failed'))
      .finally(() => setSeeding(false));
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Library className="text-terracotta" size={26} />
            <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown">Signature Collections</h1>
          </div>
          <p className="font-body text-chai-brown-light max-w-2xl">
            Phase 3–4 editorial engine: every collection knows its books. Build recommendation lists,
            hooks, and a weekly content calendar from Signature series without repeating recent picks.
          </p>
        </div>
        <button
          type="button"
          onClick={seed}
          disabled={seeding}
          className="inline-flex items-center gap-2 border border-terracotta/40 text-terracotta px-4 py-2 rounded-lg hover:bg-terracotta/10 font-body text-sm disabled:opacity-50"
        >
          {seeding ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          Seed Master Data vocabulary
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-body text-sm">
          {error}
        </div>
      )}
      {note && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 font-body text-sm">
          {note}
        </div>
      )}

      {loading ? (
        <p className="font-body text-chai-brown-light inline-flex items-center gap-2">
          <Loader2 size={16} className="animate-spin" /> Loading collections…
        </p>
      ) : (
        <>
          <p className="font-body text-sm text-chai-brown-light mb-6">{total} collections with books</p>

          <section className="mb-10">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays className="text-terracotta" size={20} />
              <h2 className="font-serif text-2xl text-chai-brown">Content calendar (never recommended)</h2>
            </div>
            <p className="font-body text-sm text-chai-brown-light mb-4">
              Ready picks for Signature series — status read, never recommended. Use Recommend or Hook
              Studio from here.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {calendar.map((week) => (
                <div
                  key={week.series}
                  className="bg-white rounded-lg border border-chai-brown/10 p-4 space-y-2"
                >
                  <p className="font-body text-xs uppercase tracking-wide text-chai-brown-light">
                    {week.series}
                  </p>
                  <p className="font-serif text-lg text-chai-brown">{week.angle}</p>
                  {week.books.length === 0 ? (
                    <p className="font-body text-sm text-chai-brown-light">
                      No never-recommended reads in this series yet — enrich collections or mark fewer
                      as recommended.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {week.books.slice(0, 5).map((b) => (
                        <li key={b._id} className="font-body text-sm text-chai-brown">
                          <span className="font-medium">{b.title}</span>
                          {b.author ? ` — ${b.author}` : ''}
                          {b.country ? (
                            <span className="text-chai-brown-light"> · {b.country}</span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex flex-wrap gap-3 pt-2">
                    <Link
                      href={`/admin/library/recommend?collection=${encodeURIComponent(week.series)}&status=read&neverRecommended=true`}
                      className="inline-flex items-center gap-1 text-sm text-terracotta hover:underline font-body"
                    >
                      <ListChecks size={14} /> Recommend
                    </Link>
                    <Link
                      href={`/admin/library/content?mode=list&q=${encodeURIComponent(week.series)}`}
                      className="inline-flex items-center gap-1 text-sm text-terracotta hover:underline font-body"
                    >
                      <Sparkles size={14} /> Hooks
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {PILLAR_ORDER.filter((p) => (byPillar[p] || []).length > 0).map((pillar) => (
            <section key={pillar} className="mb-8">
              <h2 className="font-serif text-xl text-chai-brown mb-3">{pillar}</h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {(byPillar[pillar] || []).map((c) => (
                  <div
                    key={c.name}
                    className="bg-white rounded-lg border border-chai-brown/10 p-3 flex flex-col gap-2"
                  >
                    <p className="font-body text-sm font-medium text-chai-brown">{c.name}</p>
                    <p className="font-body text-xs text-chai-brown-light">
                      {c.count} books · {c.readCount} read · {c.neverRecommended} never rec’d
                    </p>
                    <div className="flex flex-wrap gap-2 mt-auto">
                      <Link
                        href={c.recommendHref}
                        className="text-xs font-body text-terracotta hover:underline"
                      >
                        Recommend →
                      </Link>
                      <Link
                        href={c.hooksHref}
                        className="text-xs font-body text-terracotta hover:underline"
                      >
                        Hooks →
                      </Link>
                      <Link
                        href={c.booksHref}
                        className="text-xs font-body text-chai-brown-light hover:underline"
                      >
                        Books →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
