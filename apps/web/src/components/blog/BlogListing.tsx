'use client';

import { useState } from 'react';
import BlogCard from './BlogCard';
import Filters from './Filters';
import Pagination from './Pagination';

// Dummy data - will be replaced with API data later
const dummyPosts = [
  {
    id: '1',
    title: 'The Art of Slow Living: Finding Peace in Pages',
    excerpt: 'A beautiful meditation on slowing down and finding joy in the simple act of reading. This book changed how I approach my daily routine and taught me the value of mindful reading...',
    image: '',
    category: 'Book Review',
    slug: 'art-of-slow-living',
    readingTime: 5,
    author: 'Anshika Mishra',
    bookTitle: 'The Art of Slow Living',
    publishedAt: '2024-01-15',
  },
  {
    id: '2',
    title: 'Finding Hygge in Hardcover: Winter Reads',
    excerpt: 'As the winter settles in, there\'s nothing quite like curling up with a warm cup of chai and these cozy reads that feel like a warm hug...',
    image: '',
    category: 'Book Review',
    slug: 'finding-hygge-winter-reads',
    readingTime: 7,
    author: 'Anshika Mishra',
    bookTitle: 'The Little Book of Hygge',
    publishedAt: '2024-01-10',
  },
  {
    id: '3',
    title: 'Stories That Stayed: My All-Time Favorites',
    excerpt: 'Some books leave an imprint on your soul. Here are the stories that I carry with me, the ones that shaped my reading journey...',
    image: '',
    category: 'Reflection',
    slug: 'stories-that-stayed',
    readingTime: 6,
    author: 'Anshika Mishra',
    bookTitle: 'Various',
    publishedAt: '2024-01-05',
  },
  {
    id: '4',
    title: 'A Journey Through Indian Literature',
    excerpt: 'Exploring the rich tapestry of Indian storytelling, from ancient epics to contemporary voices that speak to our modern hearts...',
    image: '',
    category: 'Book Review',
    slug: 'journey-indian-literature',
    readingTime: 8,
    author: 'Anshika Mishra',
    bookTitle: 'The God of Small Things',
    publishedAt: '2023-12-28',
  },
  {
    id: '5',
    title: 'Romance Novels That Made Me Believe in Love Again',
    excerpt: 'In a world full of cynicism, these romance novels reminded me that love stories can be both escapist and deeply meaningful...',
    image: '',
    category: 'Book Review',
    slug: 'romance-novels-love',
    readingTime: 4,
    author: 'Anshika Mishra',
    bookTitle: 'The Seven Husbands of Evelyn Hugo',
    publishedAt: '2023-12-20',
  },
  {
    id: '6',
    title: 'Mystery and Thriller: Books That Kept Me Up All Night',
    excerpt: 'From psychological thrillers to cozy mysteries, here are the books that had me turning pages until dawn...',
    image: '',
    category: 'Book Review',
    slug: 'mystery-thriller-all-night',
    readingTime: 6,
    author: 'Anshika Mishra',
    bookTitle: 'Gone Girl',
    publishedAt: '2023-12-15',
  },
];

export default function BlogListing() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    category: '',
    author: '',
    book: '',
    title: '',
  });
  const [sortBy, setSortBy] = useState('newest');
  const postsPerPage = 6;

  // Filter and sort posts (dummy logic - will be replaced with API)
  const filteredPosts = dummyPosts.filter((post) => {
    if (filters.category && post.category !== filters.category) return false;
    if (filters.author && !post.author.toLowerCase().includes(filters.author.toLowerCase())) return false;
    if (filters.book && !post.bookTitle.toLowerCase().includes(filters.book.toLowerCase())) return false;
    if (filters.title && !post.title.toLowerCase().includes(filters.title.toLowerCase())) return false;
    return true;
  });

  // Sort posts
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    } else if (sortBy === 'oldest') {
      return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
    } else if (sortBy === 'reading-time') {
      return b.readingTime - a.readingTime;
    }
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedPosts.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const paginatedPosts = sortedPosts.slice(startIndex, startIndex + postsPerPage);

  return (
    <section className="pt-24 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-chai-brown mb-3">
            Book Reviews
          </h1>
          <p className="text-terracotta font-body italic text-lg">
            Steeping stories and spilling tea on my latest reads
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <Filters
              filters={filters}
              setFilters={setFilters}
              sortBy={sortBy}
              setSortBy={setSortBy}
            />
          </aside>

          {/* Posts Grid */}
          <div className="lg:col-span-3">
            {paginatedPosts.length > 0 ? (
              <>
                <div className="grid sm:grid-cols-2 gap-6 mb-8">
                  {paginatedPosts.map((post) => (
                    <BlogCard key={post.id} {...post} />
                  ))}
                </div>

                {/* Pagination */}
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
