'use client';

import { useState } from 'react';
import MusingCard from './MusingCard';
import Filters from './Filters';
import Pagination from '../blog/Pagination';

// Dummy data - will be replaced with API data later
const dummyMusings = [
  {
    id: '1',
    title: 'The Art of Reading in Silence',
    excerpt: 'In a world full of noise, there\'s something sacred about the quiet moments spent with a book. The way pages turn, the soft rustle, the complete immersion into another world...',
    image: '',
    category: 'Reflection',
    slug: 'art-of-reading-in-silence',
    readingTime: 3,
    publishedAt: '2024-01-22',
  },
  {
    id: '2',
    title: 'A Letter to My Younger Reading Self',
    excerpt: 'Dear 15-year-old me, I wish I could tell you that the books you\'re reading now will shape who you become. That every story is a lesson, every character a friend...',
    image: '',
    category: 'Personal',
    slug: 'letter-to-younger-reading-self',
    readingTime: 4,
    publishedAt: '2024-01-18',
  },
  {
    id: '3',
    title: 'The Coffee Shop Chronicles: Chapter One',
    excerpt: 'She sat in the corner, a worn copy of "The Seven Husbands of Evelyn Hugo" in her hands. The steam from her chai rose like morning mist, and for a moment, the world outside didn\'t exist...',
    image: '',
    category: 'Short Story',
    slug: 'coffee-shop-chronicles-chapter-one',
    readingTime: 5,
    publishedAt: '2024-01-15',
  },
  {
    id: '4',
    title: 'Why I Read the Last Page First',
    excerpt: 'I know, I know. It\'s a cardinal sin in the bookish community. But hear me out - sometimes, knowing how it ends makes the journey even more beautiful...',
    image: '',
    category: 'Thoughts',
    slug: 'why-i-read-last-page-first',
    readingTime: 3,
    publishedAt: '2024-01-12',
  },
  {
    id: '5',
    title: 'The Book That Changed Everything',
    excerpt: 'There are books you read, and then there are books that read you. This one found me at exactly the right moment, when I needed it most...',
    image: '',
    category: 'Reflection',
    slug: 'book-that-changed-everything',
    readingTime: 4,
    publishedAt: '2024-01-10',
  },
  {
    id: '6',
    title: 'Midnight Thoughts: On Book Hangovers',
    excerpt: 'It\'s 2 AM, and I just finished the most beautiful book. Now I\'m left with that familiar ache - the book hangover. That feeling when you\'re not ready to leave the world you\'ve been living in...',
    image: '',
    category: 'Thoughts',
    slug: 'midnight-thoughts-book-hangovers',
    readingTime: 2,
    publishedAt: '2024-01-08',
  },
  {
    id: '7',
    title: 'The Library of Lost Dreams',
    excerpt: 'In a small town, there was a library that only appeared on rainy Sundays. Inside, the books told stories of dreams that never came true, hopes that were abandoned, and wishes that were forgotten...',
    image: '',
    category: 'Short Story',
    slug: 'library-of-lost-dreams',
    readingTime: 6,
    publishedAt: '2024-01-05',
  },
  {
    id: '8',
    title: 'On Reading Slumps and Finding Your Way Back',
    excerpt: 'It happens to all of us. That moment when picking up a book feels like a chore, when nothing seems to capture your attention. Here\'s how I found my way back to reading...',
    image: '',
    category: 'Reflection',
    slug: 'reading-slumps-finding-way-back',
    readingTime: 4,
    publishedAt: '2024-01-03',
  },
  {
    id: '9',
    title: 'The Bookmark That Traveled the World',
    excerpt: 'A simple bookmark, left in a book at a café in Paris, found its way to Tokyo, then New York, then Mumbai. Each reader added their own story, their own moment...',
    image: '',
    category: 'Short Story',
    slug: 'bookmark-that-traveled-world',
    readingTime: 5,
    publishedAt: '2023-12-30',
  },
  {
    id: '10',
    title: 'Random Thought: Why Do We Judge Books by Their Covers?',
    excerpt: 'We\'ve all done it. Walked into a bookstore, seen a beautiful cover, and immediately picked it up. But what if the best stories are hiding behind the simplest covers?',
    image: '',
    category: 'Thoughts',
    slug: 'judge-books-by-covers',
    readingTime: 3,
    publishedAt: '2023-12-28',
  },
  {
    id: '11',
    title: 'The Comfort of Rereading',
    excerpt: 'Some people ask why I reread books when there are so many new ones to discover. But there\'s something magical about returning to a familiar story, like visiting an old friend...',
    image: '',
    category: 'Reflection',
    slug: 'comfort-of-rereading',
    readingTime: 3,
    publishedAt: '2023-12-25',
  },
  {
    id: '12',
    title: 'A Story in Three Parts',
    excerpt: 'Part One: The Beginning. Every story starts with a moment. A decision. A chance encounter. This one started on a Tuesday, in a bookstore that smelled of old paper and possibility...',
    image: '',
    category: 'Short Story',
    slug: 'story-in-three-parts',
    readingTime: 7,
    publishedAt: '2023-12-22',
  },
];

export default function MusingsListing() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    category: '',
    title: '',
  });
  const [sortBy, setSortBy] = useState('newest');
  const postsPerPage = 6;

  // Filter and sort musings (dummy logic - will be replaced with API)
  const filteredMusings = dummyMusings.filter((musing) => {
    if (filters.category && musing.category !== filters.category) return false;
    if (filters.title && !musing.title.toLowerCase().includes(filters.title.toLowerCase())) return false;
    return true;
  });

  // Sort musings
  const sortedMusings = [...filteredMusings].sort((a, b) => {
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
  const totalPages = Math.ceil(sortedMusings.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const paginatedMusings = sortedMusings.slice(startIndex, startIndex + postsPerPage);

  return (
    <section className="pt-24 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-chai-brown mb-3">
            Her Musings Verse
          </h1>
          <p className="text-terracotta font-body italic text-lg mb-4">
            Short stories, random thoughts, and reflections
          </p>
          <p className="text-chai-brown-light font-body text-base max-w-2xl mx-auto">
            A space for the stories that don't fit anywhere else. Random thoughts, midnight musings, 
            short stories, and reflections from the heart.
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

          {/* Musings Grid */}
          <div className="lg:col-span-3">
            {paginatedMusings.length > 0 ? (
              <>
                <div className="grid sm:grid-cols-2 gap-6 mb-8">
                  {paginatedMusings.map((musing) => (
                    <MusingCard key={musing.id} {...musing} />
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
