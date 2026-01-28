'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import BookCard from './BookCard';
import { ArrowRight } from 'lucide-react';
import { getPageSettings } from '@/lib/api';

type CardItem = { title: string; excerpt: string; image: string; category: string; slug: string; readingTime?: number };

const defaultRecommendations: CardItem[] = [
  { title: 'For the Hopeless Romantics', excerpt: 'A curated list of love stories that will make your heart flutter. From slow-burn romances to epic love sagas, find your next favorite...', image: '', category: 'Recommendation', slug: 'hopeless-romantics-reads', readingTime: 4 },
  { title: 'Books to Read with Your Chai', excerpt: 'Perfect companions for your evening chai sessions. These books pair wonderfully with a steaming cup and a cozy blanket...', image: '', category: 'Recommendation', slug: 'books-with-chai', readingTime: 5 },
  { title: 'Weekend Escape Reads', excerpt: 'Looking to escape reality for a weekend? These immersive stories will transport you to different worlds and times...', image: '', category: 'Recommendation', slug: 'weekend-escape-reads', readingTime: 4 },
  { title: 'Books That Changed My Perspective', excerpt: "Some books don't just entertain—they transform. Here are reads that shifted my worldview and made me think differently...", image: '', category: 'Recommendation', slug: 'perspective-changing-books', readingTime: 6 },
];

function toCardItem(x: Record<string, unknown>): CardItem | null {
  if (typeof x?.title !== 'string' || typeof x?.slug !== 'string') return null;
  return {
    title: String(x.title).trim(),
    excerpt: typeof x.excerpt === 'string' ? x.excerpt.trim() : '',
    image: typeof x.image === 'string' ? x.image : '',
    category: typeof x.category === 'string' ? x.category.trim() : 'Recommendation',
    slug: String(x.slug).trim(),
    readingTime: typeof x.readingTime === 'number' ? x.readingTime : (typeof x.readingTime === 'string' ? parseInt(x.readingTime, 10) : undefined),
  };
}

export default function BookRecommendations() {
  const [cards, setCards] = useState<CardItem[]>(defaultRecommendations);

  useEffect(() => {
    getPageSettings('recommendations')
      .then(({ content }) => {
        if (content && typeof content === 'object' && !Array.isArray(content)) {
          const c = content as { items?: Record<string, unknown>[] };
          if (Array.isArray(c.items) && c.items.length > 0) {
            const sorted = [...c.items].sort((a, b) => {
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
    <section className="py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-chai-brown mb-2">Book Recommendations</h2>
          <p className="section-subheading">Handpicked reads for every mood and moment</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {cards.map((rec, index) => (
            <div key={rec.slug} className="animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
              <BookCard {...rec} />
            </div>
          ))}
        </div>
        <div className="text-center mt-6 sm:mt-8">
          <Link href="/recommendations" className="inline-flex items-center gap-2 btn-terracotta">
            View All Recommendations
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
