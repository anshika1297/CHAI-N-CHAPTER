'use client';

import { useState, useEffect } from 'react';
import MusingCard from './MusingCard';
import Filters from './Filters';
import Pagination from '../blog/Pagination';
import { getMusings } from '@/lib/api';
import { getImageUrl } from '@/lib/api';

type MusingItem = {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  slug: string;
  readingTime: number;
  publishedAt: string;
};

function toMusingItem(m: Record<string, unknown>): MusingItem | null {
  if (typeof m?.title !== 'string' || typeof m?.slug !== 'string') return null;
  return {
    id: String(m.id ?? m.slug),
    title: String(m.title).trim(),
    excerpt: typeof m.excerpt === 'string' ? m.excerpt : '',
    image: typeof m.image === 'string' ? m.image : '',
    category: typeof m.category === 'string' ? m.category : 'Reflection',
    slug: String(m.slug).trim(),
    readingTime: typeof m.readingTime === 'number' ? m.readingTime : Number(m.readingTime) || 3,
    publishedAt: typeof m.publishedAt === 'string' ? m.publishedAt : new Date().toISOString().slice(0, 10),
  };
}

export default function MusingsListing() {
  const [items, setItems] = useState<MusingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    category: '',
    title: '',
  });
  const [sortBy, setSortBy] = useState('newest');
  const postsPerPage = 6;

  useEffect(() => {
    getMusings()
      .then(({ items: raw }) => {
        const list = Array.isArray(raw) ? raw.map((m) => toMusingItem(m as Record<string, unknown>)).filter((m): m is MusingItem => m != null) : [];
        setItems(list);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load musings'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter((m) => {
    if (filters.category && m.category !== filters.category) return false;
    if (filters.title && !m.title.toLowerCase().includes(filters.title.toLowerCase())) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    if (sortBy === 'oldest') return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
    if (sortBy === 'reading-time') return b.readingTime - a.readingTime;
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const paginated = sorted.slice(startIndex, startIndex + postsPerPage);

  if (loading) {
    return (
      <section className="pt-24 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="max-w-7xl mx-auto text-center py-16">
          <p className="font-body text-chai-brown-light">Loading musings…</p>
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
            Her Musings Verse
          </h1>
          <p className="text-terracotta font-body italic text-lg mb-4">
            Short stories, random thoughts, and reflections
          </p>
          <p className="text-chai-brown-light font-body text-base max-w-2xl mx-auto">
            A space for the stories that don&apos;t fit anywhere else. Random thoughts, midnight musings,
            short stories, and reflections from the heart.
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
                  {paginated.map((musing) => (
                    <MusingCard
                      key={musing.id}
                      title={musing.title}
                      excerpt={musing.excerpt}
                      image={getImageUrl(musing.image)}
                      category={musing.category}
                      slug={musing.slug}
                      readingTime={musing.readingTime}
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
                  No musings found matching your filters.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
