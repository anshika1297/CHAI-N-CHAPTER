'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, ChevronDown } from 'lucide-react';
import { getImageUrl } from '@/lib/api';
import type { DirectoryBook } from '@/lib/books/directory';
import { bookContentBadges } from '@/lib/books/badges';
import { groupBookSources } from '@/lib/books/groupSources';
import { resolveBookViewLink } from '@/lib/books/viewHref';
import BookSourceReferences from '@/components/books/BookSourceReferences';

type Props = {
  book: DirectoryBook;
};

const BADGE_STYLES: Record<string, string> = {
  reviewed: 'bg-sage/15 text-sage-dark border-sage/30',
  recommended: 'bg-terracotta/10 text-terracotta border-terracotta/25',
  spotlight: 'bg-chai-brown/8 text-chai-brown border-chai-brown/15',
};

export default function BookDirectoryCard({ book }: Props) {
  const [expanded, setExpanded] = useState(false);
  const cover = book.coverImage ? getImageUrl(book.coverImage) : '';
  const badges = bookContentBadges(book.sourceRefs ?? []);
  const sources = groupBookSources(book.sourceRefs ?? []);
  const { href, label } = resolveBookViewLink(book);
  const hasSources =
    sources.reviewedIn.length > 0 ||
    sources.recommendedIn.length > 0 ||
    sources.featuredIn.length > 0;

  const coverAlt =
    book.title?.trim() && book.author?.trim()
      ? `Cover of ${book.title} by ${book.author}`
      : book.title?.trim()
        ? `Cover of ${book.title}`
        : 'Book cover';

  return (
    <li className="flex flex-col">
      <article className="card flex flex-col h-full bg-cream-light border border-chai-brown/10 hover:border-terracotta/30 transition-colors overflow-hidden">
        <Link href={href} className="group block">
          <div className="relative aspect-[2/3] w-full bg-gradient-to-br from-sage/15 to-cream overflow-hidden">
            {cover ? (
              <Image
                src={cover}
                alt={coverAlt}
                fill
                className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                sizes="(max-width:640px) 50vw, 25vw"
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-chai-brown/20">
                <BookOpen size={36} aria-hidden />
              </div>
            )}
          </div>
        </Link>

        <div className="p-3 sm:p-4 flex flex-col flex-1 min-w-0">
          <Link href={href} className="group">
            <h3 className="font-serif text-sm sm:text-base text-chai-brown leading-snug line-clamp-2 group-hover:text-terracotta transition-colors">
              {book.title}
            </h3>
          </Link>
          {book.author?.trim() ? (
            <p className="mt-1 font-sans text-xs sm:text-sm text-chai-brown-light line-clamp-1">{book.author}</p>
          ) : null}
          {book.genre?.trim() ? (
            <p className="mt-1 font-sans text-[10px] sm:text-xs uppercase tracking-wide text-chai-brown/60">
              {book.genre}
            </p>
          ) : null}

          {badges.length ? (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {badges.map((badge) => (
                <li key={badge.id}>
                  <span
                    className={`inline-block font-sans text-[10px] px-2 py-0.5 rounded-full border ${BADGE_STYLES[badge.id]}`}
                  >
                    {badge.label}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-auto pt-3 flex flex-col gap-2">
            <Link
              href={href}
              className="inline-flex items-center gap-1.5 font-sans text-xs sm:text-sm font-medium text-terracotta hover:gap-2 transition-all"
            >
              {label}
              <ArrowRight size={14} aria-hidden />
            </Link>

            {hasSources ? (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="inline-flex items-center gap-1 font-sans text-xs text-chai-brown-light hover:text-terracotta transition-colors text-left"
                aria-expanded={expanded}
              >
                <ChevronDown
                  size={14}
                  className={`shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
                  aria-hidden
                />
                {expanded ? 'Hide references' : 'Show where featured'}
              </button>
            ) : null}
          </div>
        </div>

        {expanded && hasSources ? (
          <div className="px-3 sm:px-4 pb-4 border-t border-chai-brown/8 pt-3 bg-cream/50">
            <BookSourceReferences sources={sources} compact />
          </div>
        ) : null}
      </article>
    </li>
  );
}
