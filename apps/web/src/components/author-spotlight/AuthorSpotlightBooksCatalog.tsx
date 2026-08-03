import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, ArrowRight } from 'lucide-react';
import type { AuthorSpotlightFeaturedBook } from '@/lib/api';
import { getImageUrl } from '@/lib/api';
import { spotlightBookShopHref } from '@/lib/spotlightBooks';
import { SectionHeading } from './utils';

export default function AuthorSpotlightBooksCatalog({
  books,
  spotlightSlug,
}: {
  books: AuthorSpotlightFeaturedBook[];
  spotlightSlug: string;
}) {
  if (!books.length) return null;

  return (
    <section className="mb-14" aria-labelledby="spotlight-books">
      <SectionHeading id="spotlight-books">Books by this author</SectionHeading>
      <p className="section-subheading mt-2 mb-6">Explore their catalogue — each title links to our shop entry</p>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {books.map((book, i) => {
          const cover = book.coverImage ? getImageUrl(book.coverImage) : '';
          const shopHref = spotlightBookShopHref(spotlightSlug, book, i);
          const CardInner = (
            <>
              <div className="relative aspect-[2/3] w-full bg-gradient-to-br from-sage/20 to-cream overflow-hidden">
                {cover ? (
                  <Image src={cover} alt="" fill className="object-cover" sizes="(max-width:640px) 50vw, 33vw" unoptimized />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-chai-brown/25">
                    <BookOpen size={40} aria-hidden />
                  </div>
                )}
              </div>
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-serif text-lg text-chai-brown leading-snug">{book.title}</h3>
                {book.description?.trim() ? (
                  <p className="mt-2 font-body text-sm text-chai-brown-light line-clamp-3 flex-1">
                    {book.description}
                  </p>
                ) : null}
                {shopHref ? (
                  <span className="mt-4 inline-flex items-center gap-1.5 font-sans text-sm font-medium text-terracotta group-hover:gap-2 transition-all">
                    View book <ArrowRight size={16} aria-hidden />
                  </span>
                ) : book.blogReviewLink?.trim() ? (
                  <span className="mt-4 font-sans text-sm text-sage">Read our review</span>
                ) : null}
              </div>
            </>
          );

          return (
            <li key={`${book.title}-${i}`}>
              {shopHref ? (
                <Link
                  href={shopHref}
                  className="group card flex flex-col h-full bg-cream-light hover:border-terracotta/30 transition-all"
                >
                  {CardInner}
                </Link>
              ) : book.blogReviewLink?.trim() ? (
                <Link
                  href={book.blogReviewLink}
                  className="group card flex flex-col h-full bg-cream-light hover:border-sage/40 transition-all"
                >
                  {CardInner}
                </Link>
              ) : (
                <article className="card flex flex-col h-full bg-cream-light">{CardInner}</article>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
