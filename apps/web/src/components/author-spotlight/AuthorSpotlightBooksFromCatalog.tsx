import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, ArrowRight } from 'lucide-react';
import { getImageUrl } from '@/lib/api';
import type { CatalogBook } from '@/lib/books/catalog';
import { resolveBookViewLink } from '@/lib/books/viewHref';
import ShopWhereToBuyCta from '@/components/shop/ShopWhereToBuyCta';
import { SectionHeading } from './utils';

export default function AuthorSpotlightBooksFromCatalog({
  books,
  shopHref,
}: {
  books: CatalogBook[];
  shopHref?: string;
}) {
  if (!books.length && !shopHref) return null;

  return (
    <section className="mb-14" aria-labelledby="spotlight-books">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 min-w-0">
        <div className="min-w-0 flex-1">
          <SectionHeading id="spotlight-books">Books by this author</SectionHeading>
        </div>
        {shopHref ? <ShopWhereToBuyCta href={shopHref} className="shrink-0 self-start sm:self-auto" /> : null}
      </div>
      {books.length ? (
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {books.map((book) => {
          const cover = book.coverImage ? getImageUrl(book.coverImage) : '';
          const { href } = resolveBookViewLink(book);
          return (
            <li key={book.bookSlug}>
              <Link
                href={href}
                className="group card flex flex-col h-full bg-cream-light hover:border-terracotta/30 transition-all"
              >
                <div className="relative aspect-[2/3] w-full bg-gradient-to-br from-sage/20 to-cream overflow-hidden">
                  {cover ? (
                    <Image
                      src={cover}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width:640px) 50vw, 33vw"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-chai-brown/25">
                      <BookOpen size={40} aria-hidden />
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-serif text-lg text-chai-brown leading-snug">{book.title}</h3>
                  {book.author ? (
                    <p className="mt-1 font-sans text-sm text-chai-brown-light">{book.author}</p>
                  ) : null}
                  {book.description?.trim() ? (
                    <p className="mt-2 font-body text-sm text-chai-brown-light line-clamp-3 flex-1">
                      {book.description}
                    </p>
                  ) : null}
                  <span className="mt-4 inline-flex items-center gap-1.5 font-sans text-sm font-medium text-terracotta group-hover:gap-2 transition-all">
                    View book <ArrowRight size={16} aria-hidden />
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      ) : null}
    </section>
  );
}
