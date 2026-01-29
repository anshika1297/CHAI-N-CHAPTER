'use client';

import { useState, useEffect, useCallback } from 'react';
import RecommendationCard from './RecommendationCard';
import Filters from './Filters';
import Pagination from '../blog/Pagination';
import { useDebounce } from '@/hooks/useDebounce';
import { getRecommendations, getCategories, getImageUrl } from '@/lib/api';

type RecItem = {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  slug: string;
  readingTime: number;
  bookCount: number;
  publishedAt: string;
};

function toRecItem(r: Record<string, unknown>): RecItem | null {
  if (typeof r?.title !== 'string' || typeof r?.slug !== 'string') return null;
  const books = Array.isArray(r.books) ? r.books : [];
  return {
    id: String(r.id ?? r.slug),
    title: String(r.title).trim(),
    excerpt: typeof r.excerpt === 'string' ? r.excerpt : '',
    image: typeof r.image === 'string' ? r.image : '',
    category: typeof r.category === 'string' ? r.category : 'Book List',
    slug: String(r.slug).trim(),
    readingTime: typeof r.readingTime === 'number' ? r.readingTime : Number(r.readingTime) || 5,
    bookCount: typeof r.bookCount === 'number' ? r.bookCount : books.length,
    publishedAt: typeof r.publishedAt === 'string' ? r.publishedAt : new Date().toISOString().slice(0, 10),
  };
}

const POSTS_PER_PAGE = 6;
const KEYWORD_DEBOUNCE_MS = 400;

export default function RecommendationsListing() {
  const [items, setItems] = useState<RecItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    category: '',
    author: '',
    book: '',
    title: '',
  });
  const [sortBy, setSortBy] = useState('newest');
  const [categories, setCategories] = useState<string[]>([]);

  const debouncedAuthor = useDebounce(filters.author, KEYWORD_DEBOUNCE_MS);
  const debouncedBook = useDebounce(filters.book, KEYWORD_DEBOUNCE_MS);
  const debouncedTitle = useDebounce(filters.title, KEYWORD_DEBOUNCE_MS);

  const fetchCategories = useCallback(() => {
    getCategories('recommendations')
      .then(({ categories: list }) => {
        setCategories(list.map((c) => c.name).filter(Boolean).sort());
      })
      .catch(() => {});
  }, []);

  const fetchItems = useCallback(() => {
    const startedAt = Date.now();
    setLoading(true);
    getRecommendations({
      page: currentPage,
      limit: POSTS_PER_PAGE,
      category: filters.category || undefined,
      author: debouncedAuthor || undefined,
      book: debouncedBook || undefined,
      title: debouncedTitle || undefined,
      sort: sortBy,
    })
      .then(({ items: raw, total: t }) => {
        const list = Array.isArray(raw) ? raw.map((r) => toRecItem(r as Record<string, unknown>)).filter((r): r is RecItem => r != null) : [];
        setItems(list);
        setTotal(t);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load recommendations'))
      .finally(() => {
        const elapsed = Date.now() - startedAt;
        const minLoadingMs = 300;
        const remaining = Math.max(0, minLoadingMs - elapsed);
        if (remaining > 0) {
          setTimeout(() => setLoading(false), remaining);
        } else {
          setLoading(false);
        }
      });
  }, [currentPage, filters.category, debouncedAuthor, debouncedBook, debouncedTitle, sortBy]);

  const setFiltersAndResetPage = useCallback((arg: React.SetStateAction<typeof filters>) => {
    setFilters(arg);
    setCurrentPage(1);
  }, []);

  const setSortByAndResetPage = useCallback((value: string) => {
    setSortBy(value);
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const totalPages = Math.ceil(total / POSTS_PER_PAGE) || 1;
  const paginated = items;
  const isInitialLoad = loading && items.length === 0;

  if (error && items.length === 0) {
    return (
      <section className="pt-24 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="max-w-7xl mx-auto text-center py-16">
          <p className="font-body text-red-600">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-24 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-chai-brown mb-3">
            Book Recommendations
          </h1>
          <p className="text-terracotta font-body italic text-lg">
            Curated lists, wrap-ups, and bookish discoveries
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6 lg:gap-8">
          <aside className="lg:col-span-1">
            <Filters filters={filters} setFilters={setFiltersAndResetPage} sortBy={sortBy} setSortBy={setSortByAndResetPage} categories={categories} />
          </aside>

          <div className="lg:col-span-3 relative min-h-[200px]">
            {loading && (
              <div
                className="absolute inset-0 z-10 flex items-center justify-center bg-cream/80 rounded-xl"
                aria-hidden="true"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-2 border-terracotta/30 border-t-terracotta rounded-full animate-spin" />
                  <p className="font-body text-sm text-chai-brown-light">
                    {isInitialLoad ? 'Loading recommendations…' : 'Updating…'}
                  </p>
                </div>
              </div>
            )}

            {error && items.length > 0 && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-body text-sm">
                {error}
              </div>
            )}

            {!isInitialLoad && paginated.length > 0 ? (
              <>
                <div className="grid sm:grid-cols-2 gap-6 mb-8">
                  {paginated.map((rec) => (
                    <RecommendationCard
                      key={rec.id}
                      title={rec.title}
                      excerpt={rec.excerpt}
                      image={getImageUrl(rec.image)}
                      category={rec.category}
                      slug={rec.slug}
                      readingTime={rec.readingTime}
                      bookCount={rec.bookCount}
                    />
                  ))}
                </div>
                {totalPages > 1 && (
                  <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                )}
              </>
            ) : !isInitialLoad ? (
              <div className="text-center py-12">
                <p className="text-chai-brown-light font-body text-lg">
                  No recommendations found matching your filters.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
