'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import BookCard from './BookCard';
import { ArrowRight } from 'lucide-react';
import { getMusings } from '@/lib/api';

type CardItem = { title: string; excerpt: string; image: string; category: string; slug: string; readingTime?: number };

function toCardItem(x: Record<string, unknown>): CardItem | null {
  if (typeof x?.title !== 'string' || typeof x?.slug !== 'string') return null;
  return {
    title: String(x.title).trim(),
    excerpt: typeof x.excerpt === 'string' ? x.excerpt.trim() : '',
    image: typeof x.image === 'string' ? x.image : '',
    category: typeof x.category === 'string' ? x.category.trim() : 'Reflection',
    slug: String(x.slug).trim(),
    readingTime: typeof x.readingTime === 'number' ? x.readingTime : (typeof x.readingTime === 'string' ? parseInt(x.readingTime, 10) : undefined),
  };
}

export default function MusingsVerse() {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getMusings({ limit: 4, sort: 'newest' })
      .then(({ items }) => {
        const list = (Array.isArray(items) ? items : [])
          .map((p) => toCardItem(p as Record<string, unknown>))
          .filter((x): x is CardItem => x != null);
        if (list.length) setCards(list);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  if (!ready || cards.length === 0) return null;

  return (
    <section className="py-6 sm:py-12 md:py-16 bg-cream-dark/30">
      <div className="site-container">
        <div className="text-center mb-6 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-chai-brown mb-2">Her Musings Verse</h2>
          <p className="section-subheading mb-4 sm:mb-8">Reflections, short stories, and thoughts from the heart</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
          {cards.map((musing, index) => (
            <div key={musing.slug} className="animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
              <BookCard {...musing} basePath="/musings" />
            </div>
          ))}
        </div>
        <div className="text-center mt-6 sm:mt-8">
          <Link href="/musings" className="inline-flex items-center gap-2 btn-secondary">
            View All Musings
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
