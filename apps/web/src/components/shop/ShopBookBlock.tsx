import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, ExternalLink } from 'lucide-react';
import { getImageUrl } from '@/lib/api';
import { genreTagHref } from '@/lib/shop/resolve';
import { tagToSlug } from '@/lib/tags/normalize';
import type { ShopPurchaseLink } from '@/lib/shop/types';
import ShopLinkButtons from './ShopLinkButtons';

export default function ShopBookBlock({
  id,
  title,
  author,
  coverImage,
  description,
  goodreadsLink,
  shopLinks,
  editorialLink,
  genre,
  isbn,
  bookSlug,
  tags = [],
}: {
  id?: string;
  title: string;
  author?: string;
  coverImage?: string;
  description?: string;
  goodreadsLink?: string;
  shopLinks: ShopPurchaseLink[];
  editorialLink?: { label: string; href: string };
  genre?: string;
  isbn?: string;
  bookSlug?: string;
  tags?: string[];
}) {
  const cover = coverImage ? getImageUrl(coverImage) : '';
  const genreHref = genreTagHref(genre);

  return (
    <article id={id} className="scroll-mt-28 card p-6 sm:p-8 bg-cream-light border border-chai-brown/10">
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="relative w-full sm:w-36 h-56 sm:h-48 shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-sage/20 to-cream mx-auto sm:mx-0">
          {cover ? (
            <Image src={cover} alt={title} fill className="object-cover" unoptimized />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-chai-brown/30">
              <BookOpen size={40} />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h2 className="font-serif text-2xl text-chai-brown">{title}</h2>
            {genre ? (
              genreHref ? (
                <Link
                  href={genreHref}
                  className="text-xs font-sans px-2.5 py-0.5 rounded-full bg-sage/15 text-sage border border-sage/25 hover:bg-sage/25 transition-colors"
                >
                  {genre}
                </Link>
              ) : (
                <span className="text-xs font-sans px-2.5 py-0.5 rounded-full bg-sage/15 text-sage border border-sage/25">
                  {genre}
                </span>
              )
            ) : null}
          </div>
          {author ? <p className="mt-1 font-body text-chai-brown-light">by {author}</p> : null}
          {isbn ? (
            <p className="mt-2 font-mono text-xs text-chai-brown-light">ISBN {isbn}</p>
          ) : null}
          {description ? (
            <p className="mt-3 font-body text-sm text-chai-brown-light leading-relaxed whitespace-pre-wrap">{description}</p>
          ) : null}
          <div className="mt-5">
            <p className="font-sans text-xs uppercase tracking-wide text-chai-brown-light mb-3">Buy links</p>
            <ShopLinkButtons links={shopLinks} />
          </div>
          <div className="mt-4 flex flex-wrap gap-4 font-sans text-sm">
            {goodreadsLink && !shopLinks.some((l) => l.channel === 'goodreads' && l.url === goodreadsLink) ? (
              <a
                href={goodreadsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-terracotta hover:underline inline-flex items-center gap-1"
              >
                Goodreads <ExternalLink size={14} />
              </a>
            ) : null}
            {editorialLink ? (
              <Link href={editorialLink.href} className="text-sage font-medium hover:underline">
                {editorialLink.label}
              </Link>
            ) : null}
          </div>
          {tags.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Related tags">
              {tags.slice(0, 6).map((tag) => {
                const slug = tagToSlug(tag);
                if (!slug) return null;
                return (
                  <li key={tag}>
                    <Link
                      href={`/tags/${encodeURIComponent(slug)}`}
                      className="text-xs font-sans px-2 py-0.5 rounded-full border border-chai-brown/15 text-chai-brown-light hover:border-terracotta/40 hover:text-terracotta transition-colors"
                    >
                      {tag}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : null}
          {bookSlug ? (
            <p className="mt-4 text-[11px] font-sans text-chai-brown-light/80">
              Book ID: <span className="font-mono">{bookSlug}</span>
              <span className="ml-1">(full book page coming soon)</span>
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
