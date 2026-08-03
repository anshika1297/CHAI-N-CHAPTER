'use client';

import { useEffect, useState } from 'react';
import type { SimilarBookRef } from '@/lib/contentFields';
import { fetchRelatedBooks, type RelatedBooksSeed } from './related';
import {
  mergeBookSuggestions,
  relatedBooksToSuggestions,
  similarBookRefsToSuggestions,
  type BookSuggestion,
} from './nudgeSuggestions';

export function useBookNudgeSuggestions(
  seed: RelatedBooksSeed | null | undefined,
  editorialSimilar: SimilarBookRef[] = []
): BookSuggestion[] {
  const [suggestions, setSuggestions] = useState<BookSuggestion[]>([]);

  const seedKey = seed ? JSON.stringify(seed) : '';
  const editorialKey = JSON.stringify(editorialSimilar);

  useEffect(() => {
    const editorial = similarBookRefsToSuggestions(editorialSimilar);

    if (!seed) {
      setSuggestions(editorial);
      return;
    }

    let cancelled = false;
    fetchRelatedBooks(seed)
      .then((books) => {
        if (cancelled) return;
        setSuggestions(mergeBookSuggestions(editorial, relatedBooksToSuggestions(books)));
      })
      .catch(() => {
        if (!cancelled) setSuggestions(editorial);
      });

    return () => {
      cancelled = true;
    };
  }, [seedKey, editorialKey]);

  return suggestions;
}
