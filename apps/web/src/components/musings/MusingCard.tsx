'use client';

import Link from 'next/link';
import { Clock, Tag } from 'lucide-react';

interface MusingCardProps {
  title: string;
  excerpt: string;
  image: string;
  category: string;
  slug: string;
  readingTime: number;
}

export default function MusingCard({
  title,
  excerpt,
  image,
  category,
  slug,
  readingTime,
}: MusingCardProps) {
  return (
    <article className="card group h-full flex flex-col">
      {/* Image */}
      <Link href={`/musings/${slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden">
          <div
            className="absolute inset-0 bg-gradient-to-br from-chai-brown-light to-chai-brown transition-transform duration-300 group-hover:scale-105"
            style={{
              backgroundImage: image ? `url(${image})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {!image && (
              <div className="absolute inset-0 flex items-center justify-center text-cream/60">
                <span className="text-5xl">✨</span>
              </div>
            )}
          </div>

          {/* Category Badge */}
          <div className="absolute top-4 left-4">
            <span className="bg-chai-brown-light text-cream text-xs font-sans px-3 py-1 rounded-full flex items-center gap-1">
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
        {/* Reading Time */}
        <div className="flex items-center gap-2 text-xs text-chai-brown-light mb-2 font-sans">
          <Clock size={14} />
          <span>{readingTime} min read</span>
        </div>

        {/* Title */}
        <Link href={`/musings/${slug}`}>
          <h3 className="font-serif text-xl text-chai-brown mb-3 line-clamp-2 group-hover:text-chai-brown-light transition-colors">
            {title}
          </h3>
        </Link>

        {/* Excerpt */}
        <p className="text-chai-brown-light font-body text-sm leading-relaxed line-clamp-3 mb-4 flex-1">
          {excerpt}
        </p>

        {/* Read More Link */}
        <Link
          href={`/musings/${slug}`}
          className="inline-flex items-center gap-2 text-chai-brown-light font-sans text-sm font-medium hover:gap-3 transition-all mt-auto"
        >
          Read More →
        </Link>
      </div>
    </article>
  );
}
