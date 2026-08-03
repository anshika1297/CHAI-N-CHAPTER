'use client';

import { useEffect, useState } from 'react';
import { getAuthorSpotlightBySlugPublic } from '@/lib/api';
import { parseShopBooksFromSpotlight } from '@/lib/shopCatalog';
import ShopAffiliateNote from './ShopAffiliateNote';
import ShopBookBlock from './ShopBookBlock';
import ShopBreadcrumbs from './ShopBreadcrumbs';
import RelatedBooksSection from '@/components/books/RelatedBooksSection';

export default function ShopSpotlightDetail({ slug }: { slug: string }) {
  const [name, setName] = useState('');
  const [books, setBooks] = useState<ReturnType<typeof parseShopBooksFromSpotlight>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuthorSpotlightBySlugPublic(slug)
      .then((spotlight) => {
        if (!spotlight) {
          setName('');
          setBooks([]);
          return;
        }
        setName(spotlight.name);
        setBooks(parseShopBooksFromSpotlight(spotlight));
      })
      .catch(() => {
        setName('');
        setBooks([]);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <p className="text-center font-body text-chai-brown-light py-16">Loading…</p>;
  if (!books.length) {
    return (
      <div className="text-center py-16">
        <p className="font-body text-chai-brown-light mb-4">No buy links for this spotlight yet.</p>
      </div>
    );
  }

  return (
    <div className="site-container max-w-5xl">
      <ShopBreadcrumbs
        items={[
          { label: 'Shop', href: '/shop' },
          { label: 'Authors', href: '/shop' },
          { label: name || 'Author spotlight' },
        ]}
      />
      <p className="text-xs font-sans uppercase tracking-wide text-terracotta mb-2">Author spotlight</p>
      <h1 className="font-serif text-3xl text-chai-brown mb-2">Where to buy</h1>
      {name ? <p className="font-body text-chai-brown-light mb-8">{name}</p> : null}
      <div className="space-y-6">
        {books.map((b) => (
          <ShopBookBlock
            key={b.anchorId}
            id={b.anchorId}
            title={b.title}
            author={b.author}
            coverImage={b.coverImage}
            description={b.description}
            goodreadsLink={b.goodreadsLink}
            shopLinks={b.shopLinks}
            genre={b.genre}
            isbn={b.isbn}
            bookSlug={b.bookSlug}
            tags={b.tags}
            editorialLink={
              b.blogReviewLink
                ? { label: 'Review on site', href: b.blogReviewLink }
                : { label: 'Read the spotlight', href: `/author-spotlight/${slug}` }
            }
          />
        ))}
      </div>
      <RelatedBooksSection
        author={name}
        genre={books[0]?.genre}
        tags={books.flatMap((b) => b.tags)}
        excludeSlugs={books.map((b) => b.bookSlug).filter((s): s is string => Boolean(s?.trim()))}
        className="mt-10"
        heading="Related books"
        subline="More books by this author and similar reads across Chapters.aur.Chai"
      />
      <ShopAffiliateNote />
    </div>
  );
}
