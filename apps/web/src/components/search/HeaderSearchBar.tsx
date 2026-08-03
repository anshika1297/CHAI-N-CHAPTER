'use client';

import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Search, X } from 'lucide-react';
import { fetchSearch } from '@/lib/search';
import type { SearchResponse } from '@/lib/search';
import { useGlobalSearch } from './GlobalSearchProvider';
import SearchResultsView from './SearchResultsView';

const DEBOUNCE_MS = 220;

type Props = {
  variant?: 'nav' | 'mobile';
  onActivate?: () => void;
};

export default function HeaderSearchBar({ variant = 'nav', onActivate }: Props) {
  const router = useRouter();
  const { registerSearchInput } = useGlobalSearch();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isMobile = variant === 'mobile';

  const bindInputRef = useCallback(
    (el: HTMLInputElement | null) => {
      (inputRef as MutableRefObject<HTMLInputElement | null>).current = el;
      registerSearchInput(el);
    },
    [registerSearchInput]
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
    fetchSearch(q, { limit: 4, mode: 'modal', signal: controller.signal })
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
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query), DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const showPanel = isOpen && query.trim().length >= 2;

  const goToFullSearch = () => {
    const q = query.trim();
    if (!q) return;
    setIsOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const clearSearch = () => {
    setQuery('');
    setResults(null);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleNavigate = () => {
    setIsOpen(false);
    setQuery('');
    setResults(null);
  };

  const openSearch = () => {
    onActivate?.();
    setIsOpen(true);
  };

  const resultsPanel = showPanel ? (
    <div
      id="header-search-results"
      role="listbox"
      className={
        isMobile
          ? 'absolute left-0 right-0 top-full z-[70] mt-2 rounded-xl border border-chai-brown/15 bg-cream shadow-xl overflow-hidden'
          : 'absolute right-0 top-full z-[60] mt-2 w-[min(28rem,calc(100vw-2rem))] rounded-xl border border-chai-brown/15 bg-cream shadow-xl overflow-hidden'
      }
    >
      <div className="overflow-y-auto px-2 py-3 sm:px-3 sm:py-4 max-h-[min(50vh,20rem)]">
        <SearchResultsView
          results={results}
          loading={loading}
          query={query}
          compact
          onNavigate={handleNavigate}
          showEmptyHint={false}
        />
      </div>

      {results && results.total > 0 && !loading ? (
        <div className="border-t border-chai-brown/10 bg-cream-light/90 px-4 py-3">
          <button
            type="button"
            onClick={goToFullSearch}
            className="w-full flex items-center justify-center gap-2 font-sans text-sm font-medium text-terracotta hover:underline"
          >
            See all results for &ldquo;{query}&rdquo;
            <ArrowRight size={16} />
          </button>
        </div>
      ) : null}

      {!loading && query.trim().length >= 2 && results?.total === 0 ? (
        <div className="border-t border-chai-brown/10 px-4 py-2 text-center">
          <Link
            href={`/search?q=${encodeURIComponent(query.trim())}`}
            className="text-xs font-body text-chai-brown-light hover:text-terracotta"
            onClick={() => setIsOpen(false)}
          >
            Open full search page
          </Link>
        </div>
      ) : null}
    </div>
  ) : null;

  return (
    <div ref={rootRef} className={isMobile ? 'relative w-full' : 'relative shrink-0 w-full max-w-[9.5rem] xl:max-w-[10.5rem]'}>
      <div
        className={`flex items-center gap-1.5 rounded-lg border bg-cream-light/95 transition-colors ${
          isOpen
            ? 'border-terracotta/40 ring-2 ring-terracotta/10'
            : 'border-chai-brown/15 hover:border-chai-brown/25'
        }`}
      >
        <Search
          size={isMobile ? 18 : 15}
          className={`${isMobile ? 'ml-3' : 'ml-2'} text-terracotta shrink-0`}
          aria-hidden
        />
        <input
          ref={bindInputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            openSearch();
          }}
          onFocus={openSearch}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              goToFullSearch();
            }
          }}
          placeholder={isMobile ? 'Search books, authors, tags…' : 'Search…'}
          className={`flex-1 min-w-0 bg-transparent font-body text-chai-brown placeholder:text-chai-brown-light/80 outline-none ${
            isMobile ? 'py-2.5 pr-2 text-sm' : 'py-1.5 pr-1 text-xs xl:text-sm'
          }`}
          autoComplete="off"
          spellCheck={false}
          aria-label="Search site"
          aria-expanded={showPanel}
          aria-controls="header-search-results"
        />
        {query ? (
          <button
            type="button"
            onClick={clearSearch}
            className="p-1.5 mr-1 text-chai-brown-light hover:text-chai-brown rounded-md"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>

      {resultsPanel}
    </div>
  );
}
