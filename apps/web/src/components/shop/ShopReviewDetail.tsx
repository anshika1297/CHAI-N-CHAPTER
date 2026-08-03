'use client';

import { useEffect, useState } from 'react';
import { getBlogPostBySlug } from '@/lib/api';
import { parseShopReviewFromPost } from '@/lib/shopCatalog';
import ShopAffiliateNote from './ShopAffiliateNote';
import ShopBookBlock from './ShopBookBlock';
import ShopBreadcrumbs from './ShopBreadcrumbs';
import RelatedBooksSection from '@/components/books/RelatedBooksSection';

export default function ShopReviewDetail({ slug }: { slug: string }) {
  const [book, setBook] = useState<ReturnType<typeof parseShopReviewFromPost>>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBlogPostBySlug(slug)
      .then(({ post }) => {
        const p = post && typeof post === 'object' ? (post as Record<string, unknown>) : null;
        setBook(p ? parseShopReviewFromPost(p, slug) : null);
      })
      .catch(() => setBook(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <p className="text-center font-body text-chai-brown-light py-16">Loading…</p>;
  if (!book) {
    return (
      <div className="text-center py-16">
        <p className="font-body text-chai-brown-light mb-4">No buy links for this review yet.</p>
      </div>
    );
  }

  return (
    <div className="site-container max-w-5xl">
      <ShopBreadcrumbs
        items={[
          { label: 'Shop', href: '/shop' },
          { label: 'Reviews', href: '/shop' },
          { label: book.bookTitle },
        ]}
      />
      <p className="text-xs font-sans uppercase tracking-wide text-terracotta mb-2">Book review</p>
      <h1 className="font-serif text-3xl text-chai-brown mb-8">Where to buy</h1>
      <ShopBookBlock
        title={book.bookTitle}
        author={book.bookAuthor}
        coverImage={book.coverImage}
        goodreadsLink={book.goodreadsLink}
        shopLinks={book.shopLinks}
        genre={book.genre}
        isbn={book.isbn}
        bookSlug={book.bookSlug}
        tags={book.tags}
        editorialLink={{ label: `Read: ${book.editorialTitle}`, href: book.editorialHref }}
      />
      <RelatedBooksSection
        bookSlug={book.bookSlug}
        author={book.bookAuthor}
        genre={book.genre}
        tags={book.tags}
        excludeSlugs={book.bookSlug ? [book.bookSlug] : undefined}
        className="mt-10"
        heading="Related books"
        subline="More titles to buy or explore — matched by author, genre, and tags"
      />
      <ShopAffiliateNote />
    </div>
  );
}
