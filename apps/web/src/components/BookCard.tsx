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
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden shrink-0">
        <div 
          className="absolute inset-0 bg-gradient-to-br from-chai-brown to-chai-brown-dark"
          style={{ 
            backgroundImage: image ? `url(${getImageUrl(image)})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {!image && (
            <div className="absolute inset-0 flex items-center justify-center text-cream/60">
              <span className="text-5xl">📖</span>
            </div>
          )}
        </div>
        
        {/* Category badge */}
        <div className="absolute top-4 left-4">
          <span className="bg-terracotta text-cream text-xs font-sans px-3 py-1 rounded-full">
            {category}
          </span>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-chai-brown/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col min-h-0">
        {readingTime && (
          <p className="text-xs text-chai-brown-light mb-2 font-sans shrink-0">
            {readingTime} min read
          </p>
        )}
        
        <h3 className="font-serif text-lg sm:text-xl text-chai-brown mb-2 sm:mb-3 line-clamp-2 group-hover:text-terracotta transition-colors shrink-0">
          {title}
        </h3>
        
        <p className="text-chai-brown-light font-body text-sm leading-relaxed line-clamp-3 mb-4 flex-1 min-h-0">
          {excerpt}
        </p>

        <Link 
          href={`${basePath}/${slug}`}
          className="inline-flex items-center gap-2 text-terracotta font-sans text-sm font-medium hover:gap-3 transition-all shrink-0"
        >
          Read More
          <ArrowRight size={16} />
        </Link>
      </div>
    </article>
  );
}
