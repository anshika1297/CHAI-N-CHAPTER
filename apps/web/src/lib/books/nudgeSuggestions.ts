import type { SimilarBookRef } from '@/lib/contentFields';
import { resolveBookViewLink } from '@/lib/books/viewHref';
import type { RelatedBook } from './related';

export type BookSuggestion = {
  key: string;
  title: string;
  author?: string;
  href: string;
};

export function similarBookRefsToSuggestions(refs: SimilarBookRef[]): BookSuggestion[] {
  return refs
    .filter((b) => b.title.trim() && b.internalUrl?.trim())
    .map((b) => ({
      key: `editorial-${b.title.trim()}-${b.author?.trim() ?? ''}`,
      title: b.title.trim(),
      author: b.author?.trim() || undefined,
      href: b.internalUrl!.trim(),
    }));
}

export function relatedBooksToSuggestions(books: RelatedBook[]): BookSuggestion[] {
  return books.map((b) => {
    const { href } = resolveBookViewLink(b);
    return {
      key: b.bookSlug,
      title: b.title,
      author: b.author?.trim() || undefined,
      href,
    };
  });
}

export function mergeBookSuggestions(...lists: BookSuggestion[][]): BookSuggestion[] {
  const seen = new Set<string>();
  const out: BookSuggestion[] = [];
  for (const list of lists) {
    for (const s of list) {
      const dedupe = `${s.title.toLowerCase()}|${(s.author ?? '').toLowerCase()}`;
      if (seen.has(dedupe)) continue;
      seen.add(dedupe);
      out.push(s);
    }
  }
  return out;
}
