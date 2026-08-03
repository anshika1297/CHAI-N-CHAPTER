import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BookOpen } from 'lucide-react';
import { getImageUrl } from '@/lib/api';
import type { DirectoryBook } from '@/lib/books/directory';
import { resolveBookViewLink } from '@/lib/books/viewHref';

type Props = {
  books: DirectoryBook[];
  genreTitle: string;
};

export default function GenreBooksSection({ books, genreTitle }: Props) {
  const booksHref = `/books?genre=${encodeURIComponent(genreTitle)}`;

  return (
    <section className="mb-12 sm:mb-14" aria-labelledby="genre-featured-books">
      <div className="flex items-end justify-between gap-4 mb-5 sm:mb-6">
        <h2 id="genre-featured-books" className="font-serif text-xl sm:text-2xl text-chai-brown">
          Books in {genreTitle}
        </h2>
        <Link
          href={booksHref}
          className="inline-flex items-center gap-1 font-sans text-sm font-medium text-terracotta hover:gap-1.5 transition-all shrink-0"
        >
          View all
          <ArrowRight size={14} aria-hidden />
        </Link>
      </div>

      {!books.length ? (
        <div className="rounded-xl border border-dashed border-chai-brown/15 bg-cream-dark/20 px-5 py-8 text-center">
          <p className="font-body text-sm text-chai-brown-light">
            No books indexed for {genreTitle} yet. Add this genre on reviews or lists in the admin, then{' '}
            <Link href={booksHref} className="text-terracotta hover:underline">
              browse the books directory
            </Link>
            .
          </p>
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {books.slice(0, 8).map((book) => {
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
                          sizes="(max-width:640px) 50vw, 25vw"
                          unoptimized
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-chai-brown/20">
                          <BookOpen size={32} aria-hidden />
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex flex-col flex-1 min-w-0">
                      <h3 className="font-serif text-sm text-chai-brown leading-snug line-clamp-2 group-hover:text-terracotta transition-colors">
                        {book.title}
                      </h3>
                      {book.author?.trim() ? (
                        <p className="mt-1 font-sans text-xs text-chai-brown-light line-clamp-1">{book.author}</p>
                      ) : null}
                      <span className="mt-2 inline-flex items-center gap-1 font-sans text-xs font-medium text-terracotta">
                        {label}
                        <ArrowRight size={12} aria-hidden />
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>

          {books.length > 8 ? (
            <p className="mt-4 font-body text-sm text-chai-brown-light">
              + {books.length - 8} more {genreTitle.toLowerCase()} books —{' '}
              <Link href={booksHref} className="text-terracotta hover:underline">
                view all in the books directory
              </Link>
              .
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
