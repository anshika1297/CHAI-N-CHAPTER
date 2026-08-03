import Image from 'next/image';
import { BookOpen, ExternalLink } from 'lucide-react';
import type { AuthorSpotlightFeaturedBook } from '@/lib/api';
import { getImageUrl } from '@/lib/api';
import { hasShopLinks, resolveSpotlightBookShopLinks, shopPath } from '@/lib/shopLinks';
import { SectionHeading, SmartLink } from './utils';

export default function AuthorSpotlightFeaturedBooks({
  books,
  spotlightSlug,
}: {
  books: AuthorSpotlightFeaturedBook[];
  spotlightSlug: string;
}) {
  if (!books.length) return null;

  return (
    <section className="mb-14" aria-labelledby="spotlight-books">
      <SectionHeading id="spotlight-books">Featured books</SectionHeading>
      <p className="section-subheading mt-2 mb-4">Titles we are celebrating right now</p>
      <ul className="grid gap-6 sm:grid-cols-2">
        {books.map((b, i) => {
          const cover = b.coverImage ? getImageUrl(b.coverImage) : '';
          return (
            <li
              key={`${b.title}-${i}`}
              className="card flex flex-col sm:flex-row gap-4 p-5 bg-cream-light hover:translate-y-0 hover:shadow-lg"
            >
              <div className="relative w-full sm:w-24 h-52 sm:h-36 shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-sage/20 to-cream mx-auto sm:mx-0 max-w-[8rem] sm:max-w-none">
                {cover ? (
                  <Image src={cover} alt={b.title} fill className="object-cover" unoptimized />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-chai-brown/30">
                    <BookOpen size={32} />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 flex flex-col">
                <h3 className="font-serif text-xl text-chai-brown">{b.title}</h3>
                {b.description ? (
                  <p className="mt-2 font-body text-sm text-chai-brown-light leading-relaxed whitespace-pre-wrap flex-1">
                    {b.description}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 font-sans text-sm">
                  {b.blogReviewLink ? (
                    <SmartLink href={b.blogReviewLink} className="text-sage font-medium hover:underline inline-flex items-center gap-1">
                      Review on site
                    </SmartLink>
                  ) : null}
                  {b.goodreadsLink ? (
                    <SmartLink href={b.goodreadsLink} className="text-terracotta hover:underline inline-flex items-center gap-1">
                      Goodreads <ExternalLink size={14} />
                    </SmartLink>
                  ) : null}
                  {hasShopLinks(resolveSpotlightBookShopLinks(b as unknown as Record<string, unknown>)) && spotlightSlug ? (
                    <SmartLink href={`${shopPath('author-spotlight', spotlightSlug)}#book-${i}`} className="text-terracotta hover:underline inline-flex items-center gap-1">
                      Where to buy
                    </SmartLink>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
