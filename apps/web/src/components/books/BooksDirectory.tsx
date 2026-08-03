'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import type { BookDirectoryFacets, BookDirectorySort, DirectoryBook } from '@/lib/books/directory';
import { BOOKS_DIRECTORY_PAGE_SIZE } from '@/lib/books/directory';
import BookDirectoryCard from '@/components/books/BookDirectoryCard';
import Pagination from '@/components/blog/Pagination';

type ContentTypeFilter = '' | 'blog' | 'recommendations' | 'author-spotlight';

const CONTENT_TYPE_LABELS: Record<Exclude<ContentTypeFilter, ''>, string> = {
  blog: 'Reviewed',
  recommendations: 'Recommended',
  'author-spotlight': 'Author Spotlight',
};

const SORT_OPTIONS: { value: BookDirectorySort; label: string }[] = [
  { value: 'az', label: 'A–Z' },
  { value: 'recent', label: 'Recently Added' },
  { value: 'referenced', label: 'Most Referenced' },
];

type Props = {
  books: DirectoryBook[];
  facets?: BookDirectoryFacets;
  total: number;
  page: number;
  totalPages: number;
  limit?: number;
  initialGenre?: string;
};

type DirectoryResponse = {
  books?: DirectoryBook[];
  facets?: BookDirectoryFacets;
  total?: number;
  page?: number;
  totalPages?: number;
};

export default function BooksDirectory({
  books: initialBooks,
  facets: initialFacets,
  total: initialTotal,
  page: initialPage,
  totalPages: initialTotalPages,
  limit = BOOKS_DIRECTORY_PAGE_SIZE,
  initialGenre = '',
}: Props) {
  const [books, setBooks] = useState(initialBooks);
  const [facets, setFacets] = useState(initialFacets);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loading, setLoading] = useState(initialBooks.length === 0 && initialTotal === 0);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [genre, setGenre] = useState(initialGenre.trim());
  const [author, setAuthor] = useState('');
  const [contentType, setContentType] = useState<ContentTypeFilter>('');
  const [sort, setSort] = useState<BookDirectorySort>('az');
  const [showFilters, setShowFilters] = useState(Boolean(initialGenre.trim()));
  const [error, setError] = useState<string | null>(null);

  const skipNextFetch = useRef(true);
  const facetsLoaded = useRef(Boolean(initialFacets));
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setGenre(initialGenre.trim());
    if (initialGenre.trim()) setShowFilters(true);
  }, [initialGenre]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [query]);

  const fetchDirectory = useCallback(
    async (nextPage: number) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          limit: String(limit),
          sort,
          page: String(nextPage),
        });
        if (!facetsLoaded.current) params.set('facets', 'true');
        if (debouncedQuery) params.set('q', debouncedQuery);
        if (author.trim()) params.set('author', author.trim());
        if (genre.trim()) params.set('genre', genre.trim());
        if (contentType) params.set('contentType', contentType);

        const res = await fetch(`/api/books/directory?${params}`, {
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) {
          setError(`Could not load books (${res.status}). Try again.`);
          return;
        }
        const data = (await res.json()) as DirectoryResponse;
        setBooks(Array.isArray(data.books) ? data.books : []);
        setTotal(data.total ?? 0);
        setPage(data.page ?? nextPage);
        setTotalPages(data.totalPages ?? 1);
        if (data.facets) {
          facetsLoaded.current = true;
          setFacets(data.facets);
        }
      } catch {
        setError('Could not load books. Check your connection and try again.');
      } finally {
        setLoading(false);
      }
    },
    [author, contentType, debouncedQuery, genre, limit, sort]
  );

  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      if (initialBooks.length > 0 || initialTotal > 0) return;
    }
    setPage(1);
    void fetchDirectory(1);
  }, [debouncedQuery, author, genre, contentType, sort, fetchDirectory, initialBooks.length, initialTotal]);

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    void fetchDirectory(nextPage);
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const hasActiveFilters = Boolean(query || author || genre || contentType);

  return (
    <div ref={listRef}>
      <div className="mb-6 sm:mb-8 space-y-4">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-chai-brown/40 pointer-events-none"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, author, or genre…"
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-chai-brown/15 bg-cream-light font-body text-sm text-chai-brown placeholder:text-chai-brown/40 focus:outline-none focus:border-terracotta/50 focus:ring-2 focus:ring-terracotta/15"
            aria-label="Search books"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-chai-brown/15 bg-cream-light font-sans text-sm text-chai-brown hover:border-terracotta/35 transition-colors"
            aria-expanded={showFilters}
          >
            <SlidersHorizontal size={16} aria-hidden />
            Filters
            {hasActiveFilters ? (
              <span className="w-2 h-2 rounded-full bg-terracotta" aria-label="Filters active" />
            ) : null}
          </button>

          <label className="inline-flex items-center gap-2 font-sans text-sm text-chai-brown-light">
            Sort
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as BookDirectorySort)}
              className="rounded-lg border border-chai-brown/15 bg-cream-light px-2 py-1.5 text-chai-brown text-sm focus:outline-none focus:border-terracotta/50"
              aria-label="Sort books"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <p className="ml-auto font-sans text-sm text-chai-brown-light">
            {total} {total === 1 ? 'book' : 'books'}
            {totalPages > 1 ? (
              <span className="text-chai-brown/50">
                {' '}
                · page {page} of {totalPages}
              </span>
            ) : null}
          </p>
        </div>

        {error ? (
          <p className="font-body text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        ) : null}

        {showFilters ? (
          <div className="grid sm:grid-cols-3 gap-3 p-4 rounded-xl border border-chai-brown/10 bg-cream-dark/30">
            <label className="block font-sans text-xs text-chai-brown-light">
              Genre
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="mt-1 w-full rounded-lg border border-chai-brown/15 bg-cream-light px-2 py-2 text-sm text-chai-brown"
              >
                <option value="">All genres</option>
                {(facets?.genres ?? []).map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>

            <label className="block font-sans text-xs text-chai-brown-light">
              Author
              <select
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="mt-1 w-full rounded-lg border border-chai-brown/15 bg-cream-light px-2 py-2 text-sm text-chai-brown"
              >
                <option value="">All authors</option>
                {(facets?.authors ?? []).map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>

            <label className="block font-sans text-xs text-chai-brown-light">
              Content type
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value as ContentTypeFilter)}
                className="mt-1 w-full rounded-lg border border-chai-brown/15 bg-cream-light px-2 py-2 text-sm text-chai-brown"
              >
                <option value="">All types</option>
                {(facets?.contentTypes ?? ['blog', 'recommendations', 'author-spotlight']).map((ct) => (
                  <option key={ct} value={ct}>
                    {CONTENT_TYPE_LABELS[ct as Exclude<ContentTypeFilter, ''>] ?? ct}
                  </option>
                ))}
              </select>
            </label>

            {hasActiveFilters ? (
              <div className="sm:col-span-3">
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setGenre('');
                    setAuthor('');
                    setContentType('');
                  }}
                  className="font-sans text-sm text-terracotta hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="text-center py-16 px-4">
          <p className="font-body text-sm text-chai-brown-light">Loading books…</p>
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-chai-brown/15 bg-cream-dark/20">
          {total === 0 && !hasActiveFilters ? (
            <>
              <p className="font-serif text-xl text-chai-brown mb-2">No books in the directory yet</p>
              <p className="font-body text-sm text-chai-brown-light max-w-md mx-auto">
                The catalog may still be syncing. Refresh in a minute or check back soon.
              </p>
            </>
          ) : (
            <>
              <p className="font-serif text-xl text-chai-brown mb-2">No books match your search</p>
              <p className="font-body text-sm text-chai-brown-light max-w-md mx-auto">
                Try clearing filters above to see all books.
              </p>
            </>
          )}
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {books.map((book) => (
              <BookDirectoryCard key={book.bookSlug} book={book} />
            ))}
          </ul>
          {totalPages > 1 ? (
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
          ) : null}
        </>
      )}
    </div>
  );
}
