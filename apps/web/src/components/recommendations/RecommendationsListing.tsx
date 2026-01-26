'use client';

import { useState } from 'react';
import RecommendationCard from './RecommendationCard';
import Filters from './Filters';
import Pagination from '../blog/Pagination';

// Dummy data - will be replaced with API data later
const dummyRecommendations = [
  {
    id: '1',
    title: 'Cozy Winter Reads: Books to Curl Up With',
    excerpt: 'As the temperature drops, there\'s nothing better than a warm blanket, hot chai, and these cozy reads that feel like a warm hug. From heartwarming romances to atmospheric mysteries...',
    image: '',
    category: 'Book List',
    slug: 'cozy-winter-reads',
    readingTime: 6,
    bookCount: 12,
    publishedAt: '2024-01-20',
  },
  {
    id: '2',
    title: 'January 2024 Wrap-Up: My Reading Journey',
    excerpt: 'January was a month of discovery! I read 8 incredible books across genres, from contemporary fiction to historical dramas. Here\'s what kept me turning pages...',
    image: '',
    category: 'Monthly Wrap-Up',
    slug: 'january-2024-wrapup',
    readingTime: 8,
    bookCount: 8,
    publishedAt: '2024-02-01',
  },
  {
    id: '3',
    title: 'Week 3 Reading Recap: Thrillers & Mysteries',
    excerpt: 'This week was all about edge-of-your-seat suspense! I dove into three gripping thrillers that had me up way past my bedtime. Here\'s the tea on what I read...',
    image: '',
    category: 'Weekly Wrap-Up',
    slug: 'week-3-thrillers-mysteries',
    readingTime: 5,
    bookCount: 3,
    publishedAt: '2024-01-18',
  },
  {
    id: '4',
    title: '2023 Year in Books: My Top 20 Favorites',
    excerpt: 'What a year of reading! From emotional contemporary novels to epic fantasies, 2023 brought me some unforgettable stories. Here are my top 20 books that left a lasting impression...',
    image: '',
    category: 'Yearly Wrap-Up',
    slug: '2023-year-in-books',
    readingTime: 12,
    bookCount: 20,
    publishedAt: '2024-01-01',
  },
  {
    id: '5',
    title: 'Indian Authors You Need to Read Right Now',
    excerpt: 'Celebrating the incredible voices from India that are reshaping contemporary literature. These authors bring fresh perspectives, rich storytelling, and authentic narratives...',
    image: '',
    category: 'Book List',
    slug: 'indian-authors-must-read',
    readingTime: 7,
    bookCount: 15,
    publishedAt: '2024-01-12',
  },
  {
    id: '6',
    title: 'Week 2 Reading Recap: Romance & Feel-Good Reads',
    excerpt: 'This week was all about love stories and feel-good books that made my heart happy. From enemies-to-lovers to second-chance romances, here\'s what I devoured...',
    image: '',
    category: 'Weekly Wrap-Up',
    slug: 'week-2-romance-feelgood',
    readingTime: 4,
    bookCount: 4,
    publishedAt: '2024-01-11',
  },
  {
    id: '7',
    title: 'December 2023 Wrap-Up: Holiday Reading',
    excerpt: 'December brought cozy holiday reads and year-end reflections. I explored festive romances, heartwarming family dramas, and books that made the season extra special...',
    image: '',
    category: 'Monthly Wrap-Up',
    slug: 'december-2023-wrapup',
    readingTime: 7,
    bookCount: 6,
    publishedAt: '2023-12-31',
  },
  {
    id: '8',
    title: 'Fantasy Series That Will Transport You',
    excerpt: 'Escape into magical worlds with these epic fantasy series. From intricate world-building to unforgettable characters, these books will keep you reading for weeks...',
    image: '',
    category: 'Book List',
    slug: 'fantasy-series-transport',
    readingTime: 9,
    bookCount: 10,
    publishedAt: '2024-01-08',
  },
  {
    id: '9',
    title: 'Week 1 Reading Recap: New Year, New Books',
    excerpt: 'Starting 2024 with a bang! This week I explored diverse genres, from literary fiction to contemporary romance. Here\'s what kicked off my reading year...',
    image: '',
    category: 'Weekly Wrap-Up',
    slug: 'week-1-new-year-books',
    readingTime: 5,
    bookCount: 3,
    publishedAt: '2024-01-04',
  },
];

export default function RecommendationsListing() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    category: '',
    author: '',
    book: '',
    title: '',
  });
  const [sortBy, setSortBy] = useState('newest');
  const postsPerPage = 6;

  // Filter and sort recommendations (dummy logic - will be replaced with API)
  const filteredRecommendations = dummyRecommendations.filter((rec) => {
    if (filters.category && rec.category !== filters.category) return false;
    if (filters.author && !rec.title.toLowerCase().includes(filters.author.toLowerCase())) return false;
    if (filters.book && !rec.title.toLowerCase().includes(filters.book.toLowerCase())) return false;
    if (filters.title && !rec.title.toLowerCase().includes(filters.title.toLowerCase())) return false;
    return true;
  });

  // Sort recommendations
  const sortedRecommendations = [...filteredRecommendations].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    } else if (sortBy === 'oldest') {
      return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
    } else if (sortBy === 'reading-time') {
      return b.readingTime - a.readingTime;
    } else if (sortBy === 'book-count') {
      return b.bookCount - a.bookCount;
    }
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedRecommendations.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const paginatedRecommendations = sortedRecommendations.slice(startIndex, startIndex + postsPerPage);

  return (
    <section className="pt-24 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-chai-brown mb-3">
            Book Recommendations
          </h1>
          <p className="text-terracotta font-body italic text-lg">
            Curated lists, wrap-ups, and bookish discoveries
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

          {/* Recommendations Grid */}
          <div className="lg:col-span-3">
            {paginatedRecommendations.length > 0 ? (
              <>
                <div className="grid sm:grid-cols-2 gap-6 mb-8">
                  {paginatedRecommendations.map((rec) => (
                    <RecommendationCard key={rec.id} {...rec} />
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
