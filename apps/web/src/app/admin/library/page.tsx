'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Plus,
  Upload,
  Tags,
  CircleUserRound,
  ListChecks,
  Sparkles,
  ArrowRight,
  Lightbulb,
  Compass,
  BarChart3,
  GitMerge,
  Search,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getLibraryStats } from '@/lib/library/api';
import { STATUS_LABELS, type LibraryInsightCard, type LibraryStats } from '@/lib/library/types';

const QUICK_ACTIONS = [
  { name: 'Recommendation Builder', href: '/admin/library/recommend', icon: ListChecks },
  { name: 'Hook Studio', href: '/admin/library/content', icon: Sparkles },
  { name: 'Discovery inbox', href: '/admin/library/discovery', icon: Compass },
  { name: 'Analytics', href: '/admin/library/analytics', icon: BarChart3 },
  { name: 'Add a book', href: '/admin/library/books/new', icon: Plus },
  { name: 'Browse my books', href: '/admin/library/books', icon: BookOpen },
  { name: 'Find duplicates', href: '/admin/library/books/duplicates', icon: GitMerge },
  { name: 'Import from Goodreads', href: '/admin/library/import', icon: Upload },
  { name: 'Authors', href: '/admin/library/authors', icon: CircleUserRound },
  { name: 'Master data', href: '/admin/library/taxonomy', icon: Tags },
];

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-lg border border-chai-brown/10 p-4">
      <p className="font-serif text-3xl text-chai-brown">{value}</p>
      <p className="font-body text-sm text-chai-brown-light mt-1">{label}</p>
    </div>
  );
}

function toneClasses(tone: LibraryInsightCard['tone']): string {
  if (tone === 'terracotta') return 'border-terracotta/30 bg-terracotta/5';
  if (tone === 'sage') return 'border-chai-brown/20 bg-cream-light';
  return 'border-chai-brown/10 bg-white';
}

function formatRelative(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function weekdayBrief(): string {
  const day = new Date().toLocaleDateString(undefined, { weekday: 'long' });
  if (day === 'Monday') return 'Monday brief';
  return `${day} brief`;
}

export default function LibraryDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [universalQ, setUniversalQ] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    getLibraryStats()
      .then((s) => {
        setStats(s);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const insights = stats?.insights;

  const goSearch = (e?: FormEvent) => {
    e?.preventDefault();
    const q = universalQ.trim();
    if (!q) {
      router.push('/admin/library/books');
      return;
    }
    router.push(`/admin/library/books?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown mb-2">Library OS</h1>
        <p className="font-body text-chai-brown-light">
          Your personal literary brain — every book, author, theme, and recommendation in one place.
        </p>
      </div>

      <form onSubmit={goSearch} className="mb-8">
        <label htmlFor="library-dash-search" className="block font-body text-sm font-medium text-chai-brown mb-1.5">
          Search my books
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-chai-brown/40 pointer-events-none"
            />
            <input
              id="library-dash-search"
              type="search"
              value={universalQ}
              onChange={(e) => setUniversalQ(e.target.value)}
              placeholder='Any keyword — partition, romantasy, "women writers", ISBN…'
              className="w-full pl-10 pr-4 py-2.5 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body text-sm bg-white"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 bg-terracotta text-white px-5 py-2.5 rounded-lg hover:bg-terracotta/90 transition-colors font-body text-sm shrink-0"
          >
            <Search size={16} />
            Search all fields
          </button>
        </div>
        <p className="mt-1.5 font-body text-xs text-chai-brown-light">
          Searches every column (title, tags, themes, collections, notes…). Multiple words must all match.
        </p>
      </form>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-body text-sm">
          {error}
        </div>
      )}

      <div className="mb-8 flex flex-wrap gap-3">
        {QUICK_ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.name}
              href={a.href}
              className="inline-flex items-center gap-2 bg-terracotta text-white px-4 py-2 rounded-lg hover:bg-terracotta/90 transition-colors font-body text-sm"
            >
              <Icon size={18} />
              {a.name}
            </Link>
          );
        })}
      </div>

      {loading && !stats ? (
        <p className="font-body text-chai-brown-light">Loading library…</p>
      ) : stats ? (
        <>
          {insights && insights.cards.length > 0 ? (
            <section className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb size={20} className="text-terracotta" />
                <h2 className="font-serif text-2xl text-chai-brown">{weekdayBrief()}</h2>
              </div>
              <p className="font-body text-sm text-chai-brown-light mb-4">
                What to post, what’s sitting unread, and where your catalog has gaps.
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {insights.cards.map((card) => (
                  <Link
                    key={card.id}
                    href={card.href}
                    className={`rounded-lg border p-4 transition-colors hover:border-terracotta/40 ${toneClasses(card.tone)}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-serif text-lg text-chai-brown leading-snug">{card.title}</h3>
                      <span className="font-serif text-2xl text-terracotta shrink-0">{card.count}</span>
                    </div>
                    <p className="font-body text-sm text-chai-brown-light mb-3">{card.body}</p>
                    <span className="inline-flex items-center gap-1 font-body text-xs text-terracotta">
                      Open <ArrowRight size={12} />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total books" value={stats.totals.totalBooks} />
            <StatCard label="Read" value={stats.totals.booksRead} />
            <StatCard label="Currently reading" value={stats.totals.currentlyReading} />
            <StatCard label="Want to read" value={stats.totals.wantToRead} />
            <StatCard label="Owned" value={stats.totals.booksOwned} />
            <StatCard label="Authors" value={stats.totals.totalAuthors} />
            <StatCard label="Read, never reviewed" value={stats.totals.readNeverReviewed} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {insights && insights.occasions.length > 0 ? (
              <div className="bg-white rounded-lg border border-chai-brown/10 p-5">
                <h2 className="font-serif text-xl text-chai-brown mb-1">Occasion fits</h2>
                <p className="font-body text-xs text-chai-brown-light mb-4">
                  From seasonal tags on your books — jump to Hook Studio.
                </p>
                <ul className="space-y-2">
                  {insights.occasions.map((o) => (
                    <li key={o.name}>
                      <Link
                        href={`/admin/library/content?q=${encodeURIComponent(o.name)}`}
                        className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-cream transition-colors"
                      >
                        <span className="font-body text-sm text-chai-brown truncate">{o.name}</span>
                        <span className="font-sans text-xs text-chai-brown/60 shrink-0">
                          {o.count} books
                          {o.neverRecommended > 0 ? ` · ${o.neverRecommended} never rec’d` : ''}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {insights && insights.unreadOwnedSample.length > 0 ? (
              <div className="bg-white rounded-lg border border-chai-brown/10 p-5">
                <h2 className="font-serif text-xl text-chai-brown mb-1">Unread & owned</h2>
                <p className="font-body text-xs text-chai-brown-light mb-4">
                  On the shelf but not finished yet.
                </p>
                <ul className="space-y-2">
                  {insights.unreadOwnedSample.map((b) => (
                    <li key={b._id}>
                      <Link
                        href={`/admin/library/books/${b._id}`}
                        className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-cream transition-colors"
                      >
                        <span className="font-body text-sm text-chai-brown truncate">
                          {b.title}
                          {b.author ? <span className="text-chai-brown-light"> · {b.author}</span> : null}
                        </span>
                        <span className="font-sans text-xs text-chai-brown/50 shrink-0">
                          {STATUS_LABELS[b.status as keyof typeof STATUS_LABELS] ?? b.status}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/admin/library/recommend?owned=1&status=want-to-read"
                  className="mt-3 inline-flex items-center gap-1 font-body text-sm text-terracotta hover:underline"
                >
                  Build a shortlist <ArrowRight size={14} />
                </Link>
              </div>
            ) : null}

            {insights && insights.recentlyRecommended.length > 0 ? (
              <div className="bg-white rounded-lg border border-chai-brown/10 p-5">
                <h2 className="font-serif text-xl text-chai-brown mb-4">Recently recommended</h2>
                <ul className="space-y-2">
                  {insights.recentlyRecommended.map((b) => (
                    <li key={b._id}>
                      <Link
                        href={`/admin/library/books/${b._id}`}
                        className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-cream transition-colors"
                      >
                        <span className="font-body text-sm text-chai-brown truncate">
                          {b.title}
                          {b.author ? <span className="text-chai-brown-light"> · {b.author}</span> : null}
                        </span>
                        <span className="font-sans text-xs text-chai-brown/50 shrink-0">
                          {formatRelative(b.lastRecommendedAt)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="bg-white rounded-lg border border-chai-brown/10 p-5">
              <h2 className="font-serif text-xl text-chai-brown mb-4">Recently added</h2>
              {stats.recentlyAdded.length === 0 ? (
                <p className="font-body text-sm text-chai-brown-light">
                  No books yet. Add one or import your Goodreads export.
                </p>
              ) : (
                <ul className="space-y-2">
                  {stats.recentlyAdded.map((b) => (
                    <li key={b._id}>
                      <Link
                        href={`/admin/library/books/${b._id}`}
                        className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-cream transition-colors"
                      >
                        <span className="font-body text-sm text-chai-brown truncate">
                          {b.title}
                          {b.author ? <span className="text-chai-brown-light"> · {b.author}</span> : null}
                        </span>
                        <span className="font-sans text-xs text-chai-brown/50 shrink-0">
                          {STATUS_LABELS[b.status] ?? b.status}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-lg border border-chai-brown/10 p-5">
              <h2 className="font-serif text-xl text-chai-brown mb-4">Where my books live</h2>
              {stats.byLocation.length === 0 ? (
                <p className="font-body text-sm text-chai-brown-light">
                  Add copies to your books (paperback in India, Kindle, etc.) to see this.
                </p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {stats.byLocation.map((l) => (
                    <li key={l.name}>
                      <Link
                        href={`/admin/library/books?location=${encodeURIComponent(l.name)}`}
                        className="inline-flex items-center gap-2 rounded-full border border-chai-brown/15 bg-cream-light px-3 py-1.5 font-body text-sm text-chai-brown hover:border-terracotta/40 transition-colors"
                      >
                        {l.name}
                        <span className="text-chai-brown-light">({l.count})</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-lg border border-chai-brown/10 p-5">
              <h2 className="font-serif text-xl text-chai-brown mb-4">Top genres</h2>
              {stats.topGenres.length === 0 ? (
                <p className="font-body text-sm text-chai-brown-light">
                  Add genres to your books to see trends here.
                </p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {stats.topGenres.map((g) => (
                    <li key={g.name}>
                      <Link
                        href={`/admin/library/books?genre=${encodeURIComponent(g.name)}`}
                        className="inline-flex items-center gap-2 rounded-full border border-chai-brown/15 bg-cream-light px-3 py-1.5 font-body text-sm text-chai-brown hover:border-terracotta/40 transition-colors"
                      >
                        {g.name}
                        <span className="text-chai-brown-light">({g.count})</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {insights ? (
              <div className="bg-white rounded-lg border border-chai-brown/10 p-5">
                <h2 className="font-serif text-xl text-chai-brown mb-1">Catalog health</h2>
                <p className="font-body text-xs text-chai-brown-light mb-4">
                  Gaps that make Ask / filters weaker.
                </p>
                <ul className="space-y-3 font-body text-sm text-chai-brown">
                  <li className="flex justify-between gap-3">
                    <span>Authors missing country</span>
                    <Link href="/admin/library/authors" className="text-terracotta hover:underline">
                      {insights.enrichment.authorsMissingCountry}
                    </Link>
                  </li>
                  <li className="flex justify-between gap-3">
                    <span>Books without tags</span>
                    <span className="text-chai-brown-light">{insights.enrichment.booksMissingTags}</span>
                  </li>
                  <li className="flex justify-between gap-3">
                    <span>Books without themes</span>
                    <span className="text-chai-brown-light">{insights.enrichment.booksMissingThemes}</span>
                  </li>
                </ul>
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
