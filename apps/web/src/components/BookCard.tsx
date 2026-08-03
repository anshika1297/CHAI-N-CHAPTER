'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getImageUrl } from '@/lib/api';

interface BookCardProps {
  title: string;
  excerpt: string;
  image: string;
  category: string;
  slug: string;
  readingTime?: number;
  /** Base path for "Read More" link; default /blog */
  basePath?: string;
}

export default function BookCard({ title, excerpt, image, category, slug, readingTime, basePath = '/blog' }: BookCardProps) {
  return (
    <article className="card group h-full flex flex-col">
      <div className="relative aspect-[5/4] sm:aspect-[4/3] overflow-hidden shrink-0">
        <div
          className="absolute inset-0 bg-gradient-to-br from-chai-brown to-chai-brown-dark"
          style={{
            backgroundImage: image ? `url(${getImageUrl(image)})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {!image && (
            <div className="absolute inset-0 flex items-center justify-center text-cream/60">
              <span className="text-3xl sm:text-5xl">📖</span>
            </div>
          )}
        </div>

        <div className="absolute top-2 left-2 sm:top-4 sm:left-4">
          <span className="bg-terracotta text-cream text-[10px] sm:text-xs font-sans px-2 py-0.5 sm:px-3 sm:py-1 rounded-full line-clamp-1 max-w-[8rem] sm:max-w-none">
            {category}
          </span>
        </div>

        <div className="absolute inset-0 bg-chai-brown/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="p-2.5 sm:p-5 flex-1 flex flex-col min-h-0">
        {readingTime ? (
          <p className="hidden sm:block text-xs text-chai-brown-light mb-2 font-sans shrink-0">
            {readingTime} min read
          </p>
        ) : null}

        <h3 className="font-serif text-sm sm:text-xl text-chai-brown mb-1 sm:mb-3 line-clamp-2 group-hover:text-terracotta transition-colors shrink-0 leading-snug">
          {title}
        </h3>

        <p className="hidden sm:block text-chai-brown-light font-body text-sm leading-relaxed line-clamp-3 mb-4 flex-1 min-h-0">
          {excerpt}
        </p>

        <Link
          href={`${basePath}/${slug}`}
          className="inline-flex items-center gap-1 sm:gap-2 text-terracotta font-sans text-xs sm:text-sm font-medium hover:gap-3 transition-all shrink-0 mt-auto"
        >
          Read More
          <ArrowRight size={14} className="sm:w-4 sm:h-4" />
        </Link>
      </div>
    </article>
  );
}
