'use client';

import { useState, useEffect } from 'react';
import BlogCard from './BlogCard';
import Filters from './Filters';
import Pagination from './Pagination';
import { getBlogPosts } from '@/lib/api';
import { getImageUrl } from '@/lib/api';

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
    publishedAt: typeof p.publishedAt === 'string' ? p.publishedAt : new Date().toISOString().slice(0, 10),
  };
}

export default function BlogListing() {
  const [posts, setPosts] = useState<BlogPostItem[]>([]);
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
    getBlogPosts()
      .then(({ posts: raw }) => {
        const list = Array.isArray(raw) ? raw.map((p) => toPostItem(p as Record<string, unknown>)).filter((p): p is BlogPostItem => p != null) : [];
        setPosts(list);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load posts'))
      .finally(() => setLoading(false));
  }, []);

  const filteredPosts = posts.filter((post) => {
    if (filters.category && post.category !== filters.category) return false;
    if (filters.author && !(post.author ?? '').toLowerCase().includes(filters.author.toLowerCase())) return false;
    if (filters.book && !(post.bookTitle ?? '').toLowerCase().includes(filters.book.toLowerCase())) return false;
    if (filters.title && !post.title.toLowerCase().includes(filters.title.toLowerCase())) return false;
    return true;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    if (sortBy === 'oldest') return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
    if (sortBy === 'reading-time') return b.readingTime - a.readingTime;
    return 0;
  });

  const totalPages = Math.ceil(sortedPosts.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const paginatedPosts = sortedPosts.slice(startIndex, startIndex + postsPerPage);

  if (loading) {
    return (
      <section className="pt-24 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="max-w-7xl mx-auto text-center py-16">
          <p className="font-body text-chai-brown-light">Loading book reviews…</p>
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
              setFilters={setFilters}
              sortBy={sortBy}
              setSortBy={setSortBy}
            />
          </aside>

          <div className="lg:col-span-3">
            {paginatedPosts.length > 0 ? (
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
            ) : (
              <div className="text-center py-12">
                <p className="text-chai-brown-light font-body text-lg">
                  No posts found matching your filters.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
