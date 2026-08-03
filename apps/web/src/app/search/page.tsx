'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { fetchSearch } from '@/lib/search';
import type { SearchResponse } from '@/lib/search';
import SearchResultsView from '@/components/search/SearchResultsView';

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const syncUrl = useCallback(
    (q: string) => {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      const path = params.toString() ? `/search?${params}` : '/search';
      router.replace(path, { scroll: false });
    },
    [router]
  );

  const runSearch = useCallback((q: string) => {
    abortRef.current?.abort();
    if (q.trim().length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    fetchSearch(q, { limit: 24, mode: 'full', signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) {
          setResults(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') setLoading(false);
      });
  }, []);

  useEffect(() => {
    setQuery(initialQ);
  }, [initialQ]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      syncUrl(query);
      runSearch(query);
    }, 280);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, syncUrl, runSearch]);

  return (
    <div className="site-container max-w-5xl">
      <header className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown mb-2">Search</h1>
        <p className="font-body text-chai-brown-light text-sm sm:text-base">
          Find book reviews, recommendations, musings, author spotlights, and shop links.
        </p>
      </header>

      <div className="flex items-center gap-3 rounded-xl border border-chai-brown/15 bg-cream-light px-4 py-3 mb-8">
        <Search size={20} className="text-chai-brown-light shrink-0" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Book title, author, tag, genre…"
          className="flex-1 bg-transparent font-body text-base text-chai-brown placeholder:text-chai-brown-light outline-none"
          autoFocus
          autoComplete="off"
        />
      </div>

      {results && !loading && results.total > 0 ? (
        <p className="font-body text-sm text-chai-brown-light mb-4">
          {results.total} result{results.total === 1 ? '' : 's'} for &ldquo;{results.query}&rdquo;
        </p>
      ) : null}

      <SearchResultsView results={results} loading={loading} query={query} />
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="pt-28 pb-16 min-h-screen">
      <Suspense
        fallback={
          <div className="site-container max-w-5xl text-center py-16 font-body text-chai-brown-light">Loading search…</div>
        }
      >
        <SearchPageContent />
      </Suspense>
    </div>
  );
}
