'use client';

import Link from 'next/link';
import BookCard from './BookCard';
import { ArrowRight } from 'lucide-react';

// Dummy data for now
const recentReviews = [
  {
    title: 'The Art of Slow Living: Finding Peace in Pages',
    excerpt: 'A beautiful meditation on slowing down and finding joy in the simple act of reading. This book changed how I approach my daily routine...',
    image: '',
    category: 'Book Review',
    slug: 'art-of-slow-living',
    readingTime: 5,
  },
  {
    title: 'Finding Hygge in Hardcover: Winter Reads',
    excerpt: 'As the winter settles in, there\'s nothing quite like curling up with a warm cup of chai and these cozy reads that feel like a warm hug...',
    image: '',
    category: 'Book Review',
    slug: 'finding-hygge-winter-reads',
    readingTime: 7,
  },
  {
    title: 'Stories That Stayed: My All-Time Favorites',
    excerpt: 'Some books leave an imprint on your soul. Here are the stories that I carry with me, the ones that shaped my reading journey...',
    image: '',
    category: 'Book Review',
    slug: 'stories-that-stayed',
    readingTime: 6,
  },
  {
    title: 'A Journey Through Indian Literature',
    excerpt: 'Exploring the rich tapestry of Indian storytelling, from ancient epics to contemporary voices that speak to our modern hearts...',
    image: '',
    category: 'Book Review',
    slug: 'journey-indian-literature',
    readingTime: 8,
  },
];

export default function BookReviews() {
  return (
    <section className="py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-cream-dark/50">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-chai-brown mb-2">Book Reviews</h2>
          <p className="section-subheading">
            Steeping stories and spilling tea on my latest reads
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {recentReviews.map((review, index) => (
            <div 
              key={review.slug} 
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <BookCard {...review} />
            </div>
          ))}
        </div>

        {/* Show More */}
        <div className="text-center mt-6 sm:mt-8">
          <Link 
            href="/blog?category=reviews" 
            className="inline-flex items-center gap-2 btn-secondary"
          >
            View All Reviews
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
