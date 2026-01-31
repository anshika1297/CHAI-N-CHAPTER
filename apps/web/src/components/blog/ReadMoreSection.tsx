'use client';

import { useState, useEffect } from 'react';
import { getBlogPosts, getRecommendations, getMusings, getImageUrl } from '@/lib/api';
import BlogCard from './BlogCard';
import RecommendationCard from '@/components/recommendations/RecommendationCard';
import MusingCard from '@/components/musings/MusingCard';

type BlogCardItem = {
  title: string;
  excerpt: string;
  image: string;
  category: string;
  slug: string;
  readingTime: number;
  author?: string;
  bookTitle?: string;
  rating?: number;
};

type RecCardItem = {
  title: string;
  excerpt: string;
  image: string;
  category: string;
  slug: string;
  readingTime: number;
  bookCount?: number;
};

type MusingCardItem = {
  title: string;
  excerpt: string;
  image: string;
  category: string;
  slug: string;
  readingTime: number;
};

function toBlogCardItem(p: Record<string, unknown>): BlogCardItem | null {
  if (typeof p?.title !== 'string' || typeof p?.slug !== 'string') return null;
  return {
    title: String(p.title).trim(),
    excerpt: typeof p.excerpt === 'string' ? p.excerpt : '',
    image: getImageUrl(typeof p.image === 'string' ? p.image : ''),
    category: typeof p.category === 'string' ? p.category : 'Book Review',
    slug: String(p.slug).trim(),
    readingTime: typeof p.readingTime === 'number' ? p.readingTime : Number(p.readingTime) || 5,
    author: typeof p.author === 'string' ? p.author : undefined,
    bookTitle: typeof p.bookTitle === 'string' ? p.bookTitle : undefined,
    rating: typeof p.rating === 'number' && p.rating >= 1 && p.rating <= 5 ? p.rating : undefined,
  };
}

function toRecCardItem(r: Record<string, unknown>): RecCardItem | null {
  if (typeof r?.title !== 'string' || typeof r?.slug !== 'string') return null;
  const books = Array.isArray(r.books) ? r.books : [];
  return {
    title: String(r.title).trim(),
    excerpt: typeof r.excerpt === 'string' ? r.excerpt : '',
    image: getImageUrl(typeof r.image === 'string' ? r.image : ''),
    category: typeof r.category === 'string' ? r.category : 'Book List',
    slug: String(r.slug).trim(),
    readingTime: typeof r.readingTime === 'number' ? r.readingTime : Number(r.readingTime) || 5,
    bookCount: typeof r.bookCount === 'number' ? r.bookCount : books.length,
  };
}

function toMusingCardItem(m: Record<string, unknown>): MusingCardItem | null {
  if (typeof m?.title !== 'string' || typeof m?.slug !== 'string') return null;
  return {
    title: String(m.title).trim(),
    excerpt: typeof m.excerpt === 'string' ? m.excerpt : '',
    image: getImageUrl(typeof m.image === 'string' ? m.image : ''),
    category: typeof m.category === 'string' ? m.category : 'Reflection',
    slug: String(m.slug).trim(),
    readingTime: typeof m.readingTime === 'number' ? m.readingTime : Number(m.readingTime) || 3,
  };
}

/** Shuffle array (Fisher–Yates) and return new array. */
function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const READ_MORE_COUNT = 3;

const SECTION_HEADINGS = {
  blog: 'Read next',
  recommendations: 'Explore more',
  musings: 'Read next',
} as const;

export type ReadMoreVariant = 'blog' | 'recommendations' | 'musings';

interface ReadMoreSectionProps {
  /** Which type of cards to show (blog reviews, recommendation lists, or musings). */
  variant: ReadMoreVariant;
  /** Exclude this slug from the list (e.g. current post/list). */
  excludeSlug?: string;
}

export default function ReadMoreSection({ variant, excludeSlug }: ReadMoreSectionProps) {
  const [blogItems, setBlogItems] = useState<BlogCardItem[]>([]);
  const [recItems, setRecItems] = useState<RecCardItem[]>([]);
  const [musingItems, setMusingItems] = useState<MusingCardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (variant === 'blog') {
      getBlogPosts({ limit: 24, sort: 'newest' })
        .then(({ posts }) => {
          const raw = Array.isArray(posts) ? posts : [];
          const list = raw.map((p) => toBlogCardItem(p as Record<string, unknown>)).filter((x): x is BlogCardItem => x != null);
          const filtered = excludeSlug ? list.filter((i) => i.slug !== excludeSlug) : list;
          setBlogItems(shuffle(filtered).slice(0, READ_MORE_COUNT));
        })
        .catch(() => setBlogItems([]))
        .finally(() => setLoading(false));
    } else if (variant === 'recommendations') {
      getRecommendations({ limit: 24, sort: 'newest' })
        .then(({ items: raw }) => {
          const list = (Array.isArray(raw) ? raw : []).map((r) => toRecCardItem(r as Record<string, unknown>)).filter((x): x is RecCardItem => x != null);
          const filtered = excludeSlug ? list.filter((i) => i.slug !== excludeSlug) : list;
          setRecItems(shuffle(filtered).slice(0, READ_MORE_COUNT));
        })
        .catch(() => setRecItems([]))
        .finally(() => setLoading(false));
    } else {
      getMusings({ limit: 24, sort: 'newest' })
        .then(({ items: raw }) => {
          const list = (Array.isArray(raw) ? raw : []).map((m) => toMusingCardItem(m as Record<string, unknown>)).filter((x): x is MusingCardItem => x != null);
          const filtered = excludeSlug ? list.filter((i) => i.slug !== excludeSlug) : list;
          setMusingItems(shuffle(filtered).slice(0, READ_MORE_COUNT));
        })
        .catch(() => setMusingItems([]))
        .finally(() => setLoading(false));
    }
  }, [variant, excludeSlug]);

  const heading = SECTION_HEADINGS[variant];
  const showBlog = variant === 'blog' && blogItems.length > 0;
  const showRec = variant === 'recommendations' && recItems.length > 0;
  const showMusings = variant === 'musings' && musingItems.length > 0;

  if (loading || (!showBlog && !showRec && !showMusings)) return null;

  return (
    <section className="mb-12 pt-10 border-t border-chai-brown/10">
      <h2 className="font-serif text-2xl text-chai-brown mb-6">{heading}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {showBlog &&
          blogItems.map((post) => (
            <div key={post.slug} className="animate-fade-in-up">
              <BlogCard
                title={post.title}
                excerpt={post.excerpt}
                image={post.image}
                category={post.category}
                slug={post.slug}
                readingTime={post.readingTime}
                author={post.author}
                bookTitle={post.bookTitle}
                rating={post.rating}
              />
            </div>
          ))}
        {showRec &&
          recItems.map((item) => (
            <div key={item.slug} className="animate-fade-in-up">
              <RecommendationCard
                title={item.title}
                excerpt={item.excerpt}
                image={item.image}
                category={item.category}
                slug={item.slug}
                readingTime={item.readingTime}
                bookCount={item.bookCount}
              />
            </div>
          ))}
        {showMusings &&
          musingItems.map((item) => (
            <div key={item.slug} className="animate-fade-in-up">
              <MusingCard
                title={item.title}
                excerpt={item.excerpt}
                image={item.image}
                category={item.category}
                slug={item.slug}
                readingTime={item.readingTime}
              />
            </div>
          ))}
      </div>
    </section>
  );
}
