'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Clock, Tag } from 'lucide-react';
import { getImageUrl } from '@/lib/api';
import type { ReadNextItem, ReadNextVariant } from '@/lib/readNext';

const BASE_PATH: Record<ReadNextVariant, string> = {
  blog: '/blog',
  recommendations: '/recommendations',
  musings: '/musings',
  'author-spotlight': '/author-spotlight',
};

type Props = {
  item: ReadNextItem;
  variant: ReadNextVariant;
};

export default function ReadNextCard({ item, variant }: Props) {
  const href = `${BASE_PATH[variant]}/${encodeURIComponent(item.slug)}`;
  const img = item.image ? getImageUrl(item.image) : '';

  return (
    <Link
      href={href}
      className="group flex flex-col h-full rounded-xl border border-chai-brown/12 bg-cream-light overflow-hidden hover:border-terracotta/35 hover:shadow-md transition-all"
    >
      <div className="relative aspect-[4/3] bg-gradient-to-br from-chai-brown/20 to-chai-brown/40 overflow-hidden shrink-0">
        {img ? (
          <Image
            src={img}
            alt=""
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, 25vw"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-chai-brown/30 text-3xl">📖</div>
        )}
      </div>
      <div className="p-3 sm:p-4 flex flex-col flex-1 min-h-0">
        <h3 className="font-serif text-sm sm:text-base text-chai-brown line-clamp-2 group-hover:text-terracotta transition-colors mb-2 leading-snug">
          {item.title}
        </h3>
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-chai-brown-light font-sans">
          <span className="inline-flex items-center gap-1">
            <Tag size={12} className="text-terracotta/80 shrink-0" aria-hidden />
            {item.category}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock size={12} className="shrink-0" aria-hidden />
            {item.readingTime} min
          </span>
        </div>
      </div>
    </Link>
  );
}
