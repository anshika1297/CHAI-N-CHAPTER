'use client';

import Link from 'next/link';
import { Clock, Tag, Star } from 'lucide-react';

interface BlogCardProps {
  title: string;
  excerpt: string;
  image: string;
  category: string;
  slug: string;
  readingTime: number;
  author?: string;
  bookTitle?: string;
  /** Book rating 1–5 (optional). */
  rating?: number;
}

export default function BlogCard({
  title,
  excerpt,
  image,
  category,
  slug,
  readingTime,
  author,
  bookTitle,
  rating,
}: BlogCardProps) {
  return (
    <article className="card group h-full flex flex-col">
      {/* Image */}
      <Link href={`/blog/${slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden">
          <div
            className="absolute inset-0 bg-gradient-to-br from-chai-brown to-chai-brown-dark transition-transform duration-300 group-hover:scale-105"
            style={{
              backgroundImage: image ? `url(${image})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {!image && (
              <div className="absolute inset-0 flex items-center justify-center text-cream/60">
                <span className="text-5xl">📖</span>
              </div>
            )}
          </div>

          {/* Category Badge */}
          <div className="absolute top-4 left-4">
            <span className="bg-terracotta text-cream text-xs font-sans px-3 py-1 rounded-full flex items-center gap-1">
              <Tag size={12} />
              {category}
            </span>
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-chai-brown/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </Link>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Reading Time & Rating */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-chai-brown-light mb-2 font-sans">
          <span className="flex items-center gap-2">
            <Clock size={14} />
            {readingTime} min read
          </span>
          {rating != null && (
            <span className="flex items-center gap-1 text-terracotta">
              <Star size={14} className="fill-terracotta" />
              {rating}/5
            </span>
          )}
        </div>

        {/* Title */}
        <Link href={`/blog/${slug}`}>
          <h3 className="font-serif text-xl text-chai-brown mb-3 line-clamp-2 group-hover:text-terracotta transition-colors">
            {title}
          </h3>
        </Link>

        {/* Book Title & Author (if available) */}
        {(bookTitle || author) && (
          <div className="text-xs text-chai-brown-light mb-3 font-sans">
            {bookTitle && <span className="italic">{bookTitle}</span>}
            {bookTitle && author && <span className="mx-2">•</span>}
            {author && <span>by {author}</span>}
          </div>
        )}

        {/* Excerpt */}
        <p className="text-chai-brown-light font-body text-sm leading-relaxed line-clamp-3 mb-4 flex-1">
          {excerpt}
        </p>

        {/* Read More Link */}
        <Link
          href={`/blog/${slug}`}
          className="inline-flex items-center gap-2 text-terracotta font-sans text-sm font-medium hover:gap-3 transition-all mt-auto"
        >
          Read More →
        </Link>
      </div>
    </article>
  );
}
