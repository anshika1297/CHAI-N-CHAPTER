'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import BookCard from './BookCard';
import { ArrowRight } from 'lucide-react';
import { getPageSettings } from '@/lib/api';

type CardItem = { title: string; excerpt: string; image: string; category: string; slug: string; readingTime?: number };

const defaultRecentReviews: CardItem[] = [
  { title: 'The Art of Slow Living: Finding Peace in Pages', excerpt: 'A beautiful meditation on slowing down and finding joy in the simple act of reading. This book changed how I approach my daily routine...', image: '', category: 'Book Review', slug: 'art-of-slow-living', readingTime: 5 },
  { title: 'Finding Hygge in Hardcover: Winter Reads', excerpt: "As the winter settles in, there's nothing quite like curling up with a warm cup of chai and these cozy reads that feel like a warm hug...", image: '', category: 'Book Review', slug: 'finding-hygge-winter-reads', readingTime: 7 },
  { title: 'Stories That Stayed: My All-Time Favorites', excerpt: 'Some books leave an imprint on your soul. Here are the stories that I carry with me, the ones that shaped my reading journey...', image: '', category: 'Book Review', slug: 'stories-that-stayed', readingTime: 6 },
];

function toCardItem(x: Record<string, unknown>): CardItem | null {
  if (typeof x?.title !== 'string' || typeof x?.slug !== 'string') return null;
  return {
    title: String(x.title).trim(),
    excerpt: typeof x.excerpt === 'string' ? x.excerpt.trim() : '',
    image: typeof x.image === 'string' ? x.image : '',
    category: typeof x.category === 'string' ? x.category.trim() : 'Book Review',
    slug: String(x.slug).trim(),
    readingTime: typeof x.readingTime === 'number' ? x.readingTime : (typeof x.readingTime === 'string' ? parseInt(x.readingTime, 10) : undefined),
  };
}

export default function BookReviews() {
  const [cards, setCards] = useState<CardItem[]>(defaultRecentReviews);

  useEffect(() => {
    getPageSettings('blog')
      .then(({ content }) => {
        if (content && typeof content === 'object' && !Array.isArray(content)) {
          const c = content as { posts?: Record<string, unknown>[] };
          if (Array.isArray(c.posts) && c.posts.length > 0) {
            const sorted = [...c.posts].sort((a, b) => {
              const da = typeof (a as { publishedAt?: string }).publishedAt === 'string' ? new Date((a as { publishedAt: string }).publishedAt).getTime() : 0;
              const db = typeof (b as { publishedAt?: string }).publishedAt === 'string' ? new Date((b as { publishedAt: string }).publishedAt).getTime() : 0;
              return db - da;
            });
            const list = sorted.slice(0, 3).map(toCardItem).filter((x): x is CardItem => x != null);
            if (list.length) setCards(list);
          }
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-cream-dark/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-chai-brown mb-2">Book Reviews</h2>
          <p className="section-subheading">Steeping stories and spilling tea on my latest reads</p>
        </div>
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
          {cards.map((review, index) => (
            <div key={review.slug} className="w-full sm:w-[320px] lg:max-w-[340px] animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
              <BookCard {...review} />
            </div>
          ))}
        </div>
        <div className="text-center mt-6 sm:mt-8">
          <Link href="/blog?category=reviews" className="inline-flex items-center gap-2 btn-secondary">
            View All Reviews
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
