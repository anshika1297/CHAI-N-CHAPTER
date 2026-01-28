'use client';

import { useState, useEffect } from 'react';
import RecommendationCard from './RecommendationCard';
import Filters from './Filters';
import Pagination from '../blog/Pagination';
import { getRecommendations } from '@/lib/api';
import { getImageUrl } from '@/lib/api';

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

export default function RecommendationsListing() {
  const [items, setItems] = useState<RecItem[]>([]);
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
  const postsPerPage = 6;

  useEffect(() => {
    getRecommendations()
      .then(({ items: raw }) => {
        const list = Array.isArray(raw) ? raw.map((r) => toRecItem(r as Record<string, unknown>)).filter((r): r is RecItem => r != null) : [];
        setItems(list);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load recommendations'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter((rec) => {
    if (filters.category && rec.category !== filters.category) return false;
    if (filters.author && !rec.title.toLowerCase().includes(filters.author.toLowerCase())) return false;
    if (filters.book && !rec.title.toLowerCase().includes(filters.book.toLowerCase())) return false;
    if (filters.title && !rec.title.toLowerCase().includes(filters.title.toLowerCase())) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    if (sortBy === 'oldest') return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
    if (sortBy === 'reading-time') return b.readingTime - a.readingTime;
    if (sortBy === 'book-count') return b.bookCount - a.bookCount;
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const paginated = sorted.slice(startIndex, startIndex + postsPerPage);

  if (loading) {
    return (
      <section className="pt-24 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="max-w-7xl mx-auto text-center py-16">
          <p className="font-body text-chai-brown-light">Loading recommendations…</p>
        </div>
      </section>
    );
  }

  if (error) {
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
            <Filters filters={filters} setFilters={setFilters} sortBy={sortBy} setSortBy={setSortBy} />
          </aside>

          <div className="lg:col-span-3">
            {paginated.length > 0 ? (
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
            ) : (
              <div className="text-center py-12">
                <p className="text-chai-brown-light font-body text-lg">
                  No recommendations found matching your filters.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
