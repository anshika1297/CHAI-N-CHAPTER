'use client';

import { useEffect, useState } from 'react';
import RelatedBooks from './RelatedBooks';
import { fetchRelatedBooks, type RelatedBooksSeed } from '@/lib/books/related';

type Props = RelatedBooksSeed & {
  heading?: string;
  subline?: string;
  className?: string;
  variant?: 'cards' | 'inline';
};

export default function RelatedBooksSection({
  heading,
  subline,
  className,
  variant = 'cards',
  ...seed
}: Props) {
  const [books, setBooks] = useState<Awaited<ReturnType<typeof fetchRelatedBooks>>>([]);
  const [loaded, setLoaded] = useState(false);

  const seedKey = JSON.stringify({
    bookSlug: seed.bookSlug,
    excludeSlugs: seed.excludeSlugs,
    author: seed.author,
    genre: seed.genre,
    tags: seed.tags,
    recommendationSlug: seed.recommendationSlug,
    limit: seed.limit,
  });

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    fetchRelatedBooks(seed)
      .then((result) => {
        if (!cancelled) setBooks(result);
      })
      .catch(() => {
        if (!cancelled) setBooks([]);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seedKey captures seed changes
  }, [seedKey]);

  if (!loaded || !books.length) return null;

  return (
    <RelatedBooks books={books} heading={heading} subline={subline} className={className} variant={variant} />
  );
}
