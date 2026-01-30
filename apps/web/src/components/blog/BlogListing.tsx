'use client';

import { useState, useEffect, useCallback } from 'react';
import BlogCard from './BlogCard';
import Filters from './Filters';
import Pagination from './Pagination';
import { useDebounce } from '@/hooks/useDebounce';
import { getBlogPosts, getCategories, getImageUrl } from '@/lib/api';

type BlogPostItem = {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  slug: string;
  readingTime: number;
  author?: string;
  bookTitle?: string;
  /** Book rating 1–5 (optional). */
  rating?: number;
  publishedAt: string;
};

function toPostItem(p: Record<string, unknown>): BlogPostItem | null {
  if (typeof p?.title !== 'string' || typeof p?.slug !== 'string') return null;
  return {
    id: String(p.id ?? p.slug),
    title: String(p.title).trim(),
    excerpt: typeof p.excerpt === 'string' ? p.excerpt : '',
    image: typeof p.image === 'string' ? p.image : '',
    category: typeof p.category === 'string' ? p.category : 'Book Review',
    slug: String(p.slug).trim(),
    readingTime: typeof p.readingTime === 'number' ? p.readingTime : Number(p.readingTime) || 5,
    author: typeof p.author === 'string' ? p.author : undefined,
    bookTitle: typeof p.bookTitle === 'string' ? p.bookTitle : undefined,
    rating: typeof p.rating === 'number' && p.rating >= 1 && p.rating <= 5 ? p.rating : undefined,
    publishedAt: typeof p.publishedAt === 'string' ? p.publishedAt : new Date().toISOString().slice(0, 10),
  };
}

const POSTS_PER_PAGE = 6;
const KEYWORD_DEBOUNCE_MS = 400;

export default function BlogListing() {
  const [posts, setPosts] = useState<BlogPostItem[]>([]);
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
    getCategories('blog')
      .then(({ categories: list }) => {
        setCategories(list.map((c) => c.name).filter(Boolean).sort());
      })
      .catch(() => {});
  }, []);

  const fetchPosts = useCallback(() => {
    const startedAt = Date.now();
    setLoading(true);
    getBlogPosts({
      page: currentPage,
      limit: POSTS_PER_PAGE,
      category: filters.category || undefined,
      author: debouncedAuthor || undefined,
      book: debouncedBook || undefined,
      title: debouncedTitle || undefined,
      sort: sortBy,
    })
      .then(({ posts: raw, total: t }) => {
        const list = Array.isArray(raw) ? raw.map((p) => toPostItem(p as Record<string, unknown>)).filter((p): p is BlogPostItem => p != null) : [];
        setPosts(list);
        setTotal(t);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load posts'))
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
    fetchPosts();
  }, [fetchPosts]);

  const totalPages = Math.ceil(total / POSTS_PER_PAGE) || 1;
  const paginatedPosts = posts;
  const isInitialLoad = loading && posts.length === 0;

  if (error && posts.length === 0) {
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
            Book Reviews
          </h1>
          <p className="text-terracotta font-body italic text-lg">
            Steeping stories and spilling tea on my latest reads
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6 lg:gap-8">
          <aside className="lg:col-span-1">
            <Filters
              filters={filters}
              setFilters={setFiltersAndResetPage}
              sortBy={sortBy}
              setSortBy={setSortByAndResetPage}
              categories={categories}
            />
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
                    {isInitialLoad ? 'Loading book reviews…' : 'Updating…'}
                  </p>
                </div>
              </div>
            )}

            {error && posts.length > 0 && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-body text-sm">
                {error}
              </div>
            )}

            {!isInitialLoad && paginatedPosts.length > 0 ? (
              <>
                <div className="grid sm:grid-cols-2 gap-6 mb-8">
                  {paginatedPosts.map((post) => (
                    <BlogCard
                      key={post.id}
                      title={post.title}
                      excerpt={post.excerpt}
                      image={getImageUrl(post.image)}
                      category={post.category}
                      slug={post.slug}
                      readingTime={post.readingTime}
                      author={post.author}
                      bookTitle={post.bookTitle}
                      rating={post.rating}
                    />
                  ))}
                </div>
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                )}
              </>
            ) : !isInitialLoad ? (
              <div className="text-center py-12">
                <p className="text-chai-brown-light font-body text-lg">
                  No posts found matching your filters.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
