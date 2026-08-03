import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles } from 'lucide-react';
import { getImageUrl, type AuthorSpotlightListItem } from '@/lib/api';
import { spotlightCoverImage } from '@/lib/authorSpotlightImages';

export default function AuthorSpotlightCard({ spotlight }: { spotlight: AuthorSpotlightListItem }) {
  const img = getImageUrl(spotlightCoverImage(spotlight));
  const href = `/author-spotlight/${encodeURIComponent(spotlight.slug)}`;

  return (
    <article className="card group h-full flex flex-col bg-cream-light">
      <Link href={href} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-sage/30 to-terracotta/20">
          {img ? (
            <Image
              src={img}
              alt={spotlight.name}
              fill
              className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-chai-brown/25">
              <Sparkles className="w-10 h-10 sm:w-14 sm:h-14" strokeWidth={1.25} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-chai-brown/50 via-transparent to-transparent opacity-80" />
          <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-5">
            <h2 className="font-serif text-sm sm:text-2xl text-cream drop-shadow-sm line-clamp-2">
              {spotlight.name}
            </h2>
            {spotlight.tagline ? (
              <p className="mt-0.5 sm:mt-1 font-body text-[11px] sm:text-sm text-cream/90 line-clamp-1 sm:line-clamp-2">
                {spotlight.tagline}
              </p>
            ) : null}
          </div>
        </div>
      </Link>

      <div className="p-2.5 sm:p-5 flex-1 flex flex-col">
        {spotlight.genres?.length ? (
          <p className="font-sans text-[10px] sm:text-xs text-sage-dark uppercase tracking-wide mb-2 sm:mb-3 line-clamp-1">
            {spotlight.genres.slice(0, 3).join(' · ')}
          </p>
        ) : null}
        <Link
          href={href}
          className="inline-flex items-center gap-1 sm:gap-2 text-sage font-sans text-xs sm:text-sm font-medium hover:gap-2 sm:hover:gap-3 transition-all mt-auto group/link"
        >
          Meet the author
          <ArrowRight size={14} className="sm:w-4 sm:h-4 group-hover/link:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </article>
  );
}
