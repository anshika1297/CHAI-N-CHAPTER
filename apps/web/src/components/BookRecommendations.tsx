'use client';

import Link from 'next/link';
import BookCard from './BookCard';
import { ArrowRight } from 'lucide-react';

// Dummy data for now
const recommendations = [
  {
    title: 'For the Hopeless Romantics',
    excerpt: 'A curated list of love stories that will make your heart flutter. From slow-burn romances to epic love sagas, find your next favorite...',
    image: '',
    category: 'Recommendation',
    slug: 'hopeless-romantics-reads',
    readingTime: 4,
  },
  {
    title: 'Books to Read with Your Chai',
    excerpt: 'Perfect companions for your evening chai sessions. These books pair wonderfully with a steaming cup and a cozy blanket...',
    image: '',
    category: 'Recommendation',
    slug: 'books-with-chai',
    readingTime: 5,
  },
  {
    title: 'Weekend Escape Reads',
    excerpt: 'Looking to escape reality for a weekend? These immersive stories will transport you to different worlds and times...',
    image: '',
    category: 'Recommendation',
    slug: 'weekend-escape-reads',
    readingTime: 4,
  },
  {
    title: 'Books That Changed My Perspective',
    excerpt: 'Some books don\'t just entertain—they transform. Here are reads that shifted my worldview and made me think differently...',
    image: '',
    category: 'Recommendation',
    slug: 'perspective-changing-books',
    readingTime: 6,
  },
];

export default function BookRecommendations() {
  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-chai-brown mb-2">Book Recommendations</h2>
          <p className="section-subheading">
            Handpicked reads for every mood and moment
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {recommendations.map((rec, index) => (
            <div 
              key={rec.slug}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <BookCard {...rec} />
            </div>
          ))}
        </div>

        {/* Show More */}
        <div className="text-center mt-8 sm:mt-10">
          <Link 
            href="/blog?category=recommendations" 
            className="inline-flex items-center gap-2 btn-terracotta"
          >
            View All Recommendations
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
