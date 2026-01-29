'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import BookCard from './BookCard';
import { ArrowRight } from 'lucide-react';
import { getPageSettings } from '@/lib/api';

type CardItem = { title: string; excerpt: string; image: string; category: string; slug: string; readingTime?: number };

const defaultMusings: CardItem[] = [
  { title: 'The Art of Reading in Silence', excerpt: "In a world full of noise, there's something sacred about the quiet moments spent with a book.", image: '', category: 'Reflection', slug: 'art-of-reading-in-silence', readingTime: 3 },
  { title: 'A Letter to My Younger Reading Self', excerpt: "Dear 15-year-old me, I wish I could tell you that the books you're reading now will shape who you become.", image: '', category: 'Personal', slug: 'letter-to-younger-reading-self', readingTime: 4 },
  { title: 'The Coffee Shop Chronicles: Chapter One', excerpt: 'She sat in the corner, a worn copy of "The Seven Husbands of Evelyn Hugo" in her hands.', image: '', category: 'Short Story', slug: 'coffee-shop-chronicles-chapter-one', readingTime: 5 },
];

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
  const [cards, setCards] = useState<CardItem[]>(defaultMusings);

  useEffect(() => {
    getPageSettings('musings')
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
    <section className="py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-cream-dark/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-chai-brown mb-2">Her Musings Verse</h2>
          <p className="section-subheading">Reflections, short stories, and thoughts from the heart</p>
        </div>
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
          {cards.map((musing, index) => (
            <div key={musing.slug} className="w-full sm:w-[320px] lg:max-w-[340px] animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
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
