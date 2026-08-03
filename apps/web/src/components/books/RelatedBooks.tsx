import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import { getImageUrl } from '@/lib/api';
import type { RelatedBook } from '@/lib/books/related';
import { resolveBookViewLink } from '@/lib/books/viewHref';

type Props = {
  books: RelatedBook[];
  heading?: string;
  subline?: string;
  className?: string;
  variant?: 'cards' | 'inline';
};

export default function RelatedBooks({
  books,
  heading = 'Related books',
  subline = 'More reads you might enjoy on Chapters.aur.Chai',
  className = '',
  variant = 'cards',
}: Props) {
  if (!books.length) return null;

  if (variant === 'inline') {
    return (
      <section
        className={`border-t border-chai-brown/10 pt-6 ${className}`}
        aria-labelledby="related-books-heading"
      >
        <p id="related-books-heading" className="font-body text-sm text-chai-brown-light leading-relaxed">
          <span className="text-chai-brown font-medium">Also check: </span>
          {books.map((book, i) => {
            const { href } = resolveBookViewLink(book);
            return (
              <span key={book.bookSlug}>
                {i > 0 ? <span aria-hidden> · </span> : null}
                <Link href={href} className="text-terracotta hover:underline">
                  {book.title}
                  {book.author?.trim() ? ` by ${book.author.trim()}` : ''}
                </Link>
              </span>
            );
          })}
        </p>
      </section>
    );
  }

  return (
    <section
      className={`border-t border-chai-brown/10 pt-8 sm:pt-10 ${className}`}
      aria-labelledby="related-books-heading"
    >
      <header className="mb-6">
        <h2 id="related-books-heading" className="font-serif text-xl sm:text-2xl text-chai-brown">
          {heading}
        </h2>
        {subline ? <p className="mt-1 font-body text-sm text-chai-brown-light">{subline}</p> : null}
      </header>

      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-5">
        {books.map((book) => {
          const cover = book.coverImage ? getImageUrl(book.coverImage) : '';
          const { href, label } = resolveBookViewLink(book);
          return (
            <li key={book.bookSlug}>
              <Link
                href={href}
                className="group card flex flex-col h-full bg-cream-light hover:border-terracotta/30 transition-all"
              >
                <div className="relative aspect-[2/3] w-full bg-gradient-to-br from-sage/15 to-cream overflow-hidden">
                  {cover ? (
                    <Image
                      src={cover}
                      alt=""
                      fill
                      className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      sizes="(max-width:640px) 50vw, 33vw"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-chai-brown/20">
                      <BookOpen size={36} aria-hidden />
                    </div>
                  )}
                </div>
                <div className="p-3 sm:p-4 flex flex-col flex-1 min-w-0">
                  <h3 className="font-serif text-sm sm:text-base text-chai-brown leading-snug line-clamp-2 group-hover:text-terracotta transition-colors">
                    {book.title}
                  </h3>
                  {book.author?.trim() ? (
                    <p className="mt-1 font-sans text-xs sm:text-sm text-chai-brown-light line-clamp-1">
                      {book.author}
                    </p>
                  ) : null}
                  <span className="mt-3 inline-flex items-center gap-1 font-sans text-xs sm:text-sm font-medium text-terracotta group-hover:gap-1.5 transition-all">
                    {label}
                    <ArrowRight size={14} aria-hidden />
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
