'use client';

import { useEffect, useState } from 'react';
import { getRecommendationBySlug } from '@/lib/api';
import { parseShopBooksFromRecommendation } from '@/lib/shopCatalog';
import ShopAffiliateNote from './ShopAffiliateNote';
import ShopBookBlock from './ShopBookBlock';
import ShopBreadcrumbs from './ShopBreadcrumbs';
import RelatedBooksSection from '@/components/books/RelatedBooksSection';

export default function ShopRecommendationDetail({ slug }: { slug: string }) {
  const [listTitle, setListTitle] = useState('');
  const [books, setBooks] = useState<ReturnType<typeof parseShopBooksFromRecommendation>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecommendationBySlug(slug)
      .then(({ item }) => {
        const p = item && typeof item === 'object' ? (item as Record<string, unknown>) : null;
        setListTitle(p ? String(p.title ?? '') : '');
        setBooks(p ? parseShopBooksFromRecommendation(p) : []);
      })
      .catch(() => {
        setListTitle('');
        setBooks([]);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <p className="text-center font-body text-chai-brown-light py-16">Loading…</p>;
  if (!books.length) {
    return (
      <div className="text-center py-16">
        <p className="font-body text-chai-brown-light mb-4">No buy links for this list yet.</p>
      </div>
    );
  }

  return (
    <div className="site-container max-w-5xl">
      <ShopBreadcrumbs
        items={[
          { label: 'Shop', href: '/shop' },
          { label: 'Lists', href: '/shop' },
          { label: listTitle || 'Recommendations' },
        ]}
      />
      <p className="text-xs font-sans uppercase tracking-wide text-terracotta mb-2">Recommendations</p>
      <h1 className="font-serif text-3xl text-chai-brown mb-2">Where to buy</h1>
      {listTitle ? <p className="font-body text-chai-brown-light mb-8">{listTitle}</p> : null}
      <div className="space-y-6">
        {books.map((b) => (
          <ShopBookBlock
            key={b.id}
            id={`book-${b.id}`}
            title={b.title}
            author={b.author}
            coverImage={b.image}
            goodreadsLink={b.goodreadsLink}
            shopLinks={b.shopLinks}
            genre={b.genre}
            isbn={b.isbn}
            bookSlug={b.bookSlug}
            tags={b.tags}
            editorialLink={{ label: 'Read the full list', href: `/recommendations/${slug}` }}
          />
        ))}
      </div>
      <RelatedBooksSection
        recommendationSlug={slug}
        genre={books[0]?.genre}
        tags={books.flatMap((b) => b.tags)}
        excludeSlugs={books.map((b) => b.bookSlug).filter((s): s is string => Boolean(s?.trim()))}
        className="mt-10"
        heading="Related books"
        subline="More books from similar lists and genres"
      />
      <ShopAffiliateNote />
    </div>
  );
}
