'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getLibraryAnalytics } from '@/lib/library/api';
import {
  DISCOVERY_SOURCE_LABELS,
  DISCOVERY_STATUS_LABELS,
  type DiscoverySource,
  type DiscoveryStatus,
  type LibraryAnalytics,
} from '@/lib/library/types';

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-lg border border-chai-brown/10 p-4">
      <p className="font-serif text-3xl text-chai-brown">{value}</p>
      <p className="font-body text-sm text-chai-brown-light mt-1">{label}</p>
    </div>
  );
}

function BarList({
  title,
  rows,
  valueKey = 'count',
  labelFn,
}: {
  title: string;
  rows: { name: string; count?: number; times?: number; books?: number }[];
  valueKey?: 'count' | 'times';
  labelFn?: (name: string) => string;
}) {
  const max = Math.max(1, ...rows.map((r) => (valueKey === 'times' ? r.times ?? 0 : r.count ?? 0)));
  return (
    <section className="bg-white rounded-lg border border-chai-brown/10 p-5">
      <h2 className="font-serif text-xl text-chai-brown mb-4">{title}</h2>
      {rows.length === 0 ? (
        <p className="font-body text-sm text-chai-brown-light">No data yet.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => {
            const value = valueKey === 'times' ? row.times ?? 0 : row.count ?? 0;
            const pct = Math.round((value / max) * 100);
            return (
              <li key={row.name}>
                <div className="flex justify-between gap-2 mb-1">
                  <span className="font-body text-sm text-chai-brown truncate">
                    {labelFn ? labelFn(row.name) : row.name}
                    {row.books != null ? (
                      <span className="text-chai-brown-light"> · {row.books} books</span>
                    ) : null}
                  </span>
                  <span className="font-body text-sm text-chai-brown-light shrink-0">{value}</span>
                </div>
                <div className="h-1.5 rounded-full bg-cream overflow-hidden">
                  <div className="h-full rounded-full bg-terracotta/80" style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default function LibraryAnalyticsPage() {
  const [data, setData] = useState<LibraryAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    getLibraryAnalytics()
      .then((a) => {
        setData(a);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown mb-2">Library analytics</h1>
        <p className="font-body text-chai-brown-light">
          Finished books, genre mix, and how often you recommend — light stats for your own brain.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-body text-sm">
          {error}
        </div>
      )}

      {loading && !data ? (
        <p className="font-body text-chai-brown-light flex items-center gap-2">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </p>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            <StatCard label="Finished this year" value={data.totals.finishedThisYear} />
            <StatCard label="Recommendations this year" value={data.totals.recommendationsThisYear} />
            <StatCard label="In discovery pipeline" value={data.totals.discoveryPipeline} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <BarList title="Finished by year" rows={data.finishedByYear.map((r) => ({ name: String(r.year), count: r.count }))} />
            <BarList
              title="Finished this year by month"
              rows={data.finishedThisYearByMonth.map((r) => ({ name: r.label, count: r.count }))}
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <BarList title="Genre mix (catalog)" rows={data.genreMix} />
            <BarList title="Recommendations by genre" rows={data.recommendationByGenre} valueKey="times" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <BarList title="Recommendations by channel" rows={data.recommendationByChannel} />
            <BarList
              title="Discovery by status"
              rows={data.discoveryByStatus}
              labelFn={(n) => DISCOVERY_STATUS_LABELS[n as DiscoveryStatus] || n}
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <BarList
              title="Discovery by source"
              rows={data.discoveryBySource}
              labelFn={(n) => DISCOVERY_SOURCE_LABELS[n as DiscoverySource] || n}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
