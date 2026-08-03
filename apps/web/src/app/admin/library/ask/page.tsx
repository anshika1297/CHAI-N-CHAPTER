'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Search, Loader2 } from 'lucide-react';
import { queryLibrary } from '@/lib/library/api';
import { STATUS_LABELS, type LibraryQueryResult, type ReadingStatus } from '@/lib/library/types';

const EXAMPLES = [
  'heartbreaking books under 300 pages',
  'Indian authors I have read',
  '5 star historical fiction',
  'books I own on my kindle',
  'short thrillers I want to read',
  'partition stories',
];

export default function LibraryAskPage() {
  const [q, setQ] = useState('');
  const [result, setResult] = useState<LibraryQueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (text: string) => {
    const query = text.trim();
    if (!query) return;
    setLoading(true);
    setError(null);
    try {
      const res = await queryLibrary(query, { limit: 60 });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Query failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="text-terracotta" size={26} />
          <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown">Ask your library</h1>
        </div>
        <p className="font-body text-chai-brown-light">
          Describe what you&apos;re looking for in plain English — page length, mood, occasion, author
          nationality, rating, what you own. I&apos;ll turn it into a filtered list for your content
          calendar.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(q);
        }}
        className="bg-white rounded-lg border border-chai-brown/10 p-4 mb-4"
      >
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-chai-brown-light"
            />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="e.g. heartbreaking books under 300 pages for Independence Day"
              className="w-full pl-10 pr-3 py-3 border border-chai-brown/20 rounded-lg font-body text-chai-brown focus:outline-none focus:border-terracotta"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !q.trim()}
            className="inline-flex items-center gap-2 bg-terracotta text-white px-5 py-3 rounded-lg hover:bg-terracotta/90 font-body disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            Ask
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => {
                setQ(ex);
                run(ex);
              }}
              className="rounded-full border border-chai-brown/15 bg-cream/60 px-3 py-1.5 font-body text-xs text-chai-brown hover:border-terracotta/40 transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      </form>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-body text-sm">
          {error}
        </div>
      )}

      {result && (
        <div>
          <div className="bg-white rounded-lg border border-chai-brown/10 p-4 mb-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <p className="font-body text-chai-brown">
                <strong>{result.total}</strong> book{result.total === 1 ? '' : 's'} matched
              </p>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-body ${
                  result.engine === 'ai'
                    ? 'bg-terracotta/10 text-terracotta'
                    : 'bg-chai-brown/10 text-chai-brown'
                }`}
              >
                <Sparkles size={12} />
                {result.engine === 'ai'
                  ? `AI interpreted${result.aiProvider ? ` · ${result.aiProvider}` : ''}`
                  : 'Smart match'}
              </span>
            </div>

            {result.summary && (
              <p className="font-body text-sm text-chai-brown-light mb-3 italic">
                &ldquo;{result.summary}&rdquo;
              </p>
            )}

            {result.chips.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {result.chips.map((chip, i) => (
                  <span
                    key={`${chip.field}-${chip.value}-${i}`}
                    className="rounded-full border border-chai-brown/15 bg-cream-light px-3 py-1 font-body text-xs text-chai-brown"
                  >
                    {chip.label}
                  </span>
                ))}
              </div>
            ) : (
              <p className="font-body text-xs text-chai-brown-light">
                No specific filters detected — showing a keyword match.
              </p>
            )}

            {!result.aiAvailable && (
              <p className="mt-3 font-body text-[11px] text-chai-brown-light">
                Tip: add an AI key in the API config to unlock smarter, fuzzier interpretation.
              </p>
            )}
          </div>

          {result.books.length === 0 ? (
            <div className="bg-white rounded-lg border border-chai-brown/10 p-10 text-center">
              <p className="font-body text-chai-brown-light">
                No books matched. Try loosening the wording or check your tags/genres.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {result.books.map((book) => (
                <Link
                  key={book._id}
                  href={`/admin/library/books/${book._id}`}
                  className="group bg-white rounded-lg border border-chai-brown/10 p-4 flex gap-3 hover:border-terracotta/40 transition-colors"
                >
                  <div className="w-16 h-24 flex-shrink-0 rounded bg-cream overflow-hidden">
                    {book.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={book.coverImage}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-chai-brown/30 text-xs font-body">
                        No cover
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-serif text-chai-brown leading-snug line-clamp-2 group-hover:text-terracotta">
                      {book.title}
                    </h3>
                    {book.author && (
                      <p className="font-body text-sm text-chai-brown-light truncate">{book.author}</p>
                    )}
                    <div className="mt-1.5 flex flex-wrap gap-1.5 font-body text-[11px] text-chai-brown-light">
                      {book.status && (
                        <span className="rounded bg-cream px-1.5 py-0.5">
                          {STATUS_LABELS[book.status as ReadingStatus] ?? book.status}
                        </span>
                      )}
                      {typeof book.rating === 'number' && book.rating > 0 && (
                        <span className="rounded bg-cream px-1.5 py-0.5">{book.rating}★</span>
                      )}
                      {typeof book.pages === 'number' && book.pages > 0 && (
                        <span className="rounded bg-cream px-1.5 py-0.5">{book.pages}p</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
