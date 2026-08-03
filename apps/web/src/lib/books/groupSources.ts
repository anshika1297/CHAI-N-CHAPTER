import type { BookSourceRef } from '@/lib/books/catalog';

export type GroupedBookSources = {
  reviewedIn: BookSourceRef[];
  recommendedIn: BookSourceRef[];
  featuredIn: BookSourceRef[];
};

export function groupBookSources(sourceRefs: BookSourceRef[] = []): GroupedBookSources {
  const reviewedIn: BookSourceRef[] = [];
  const recommendedIn: BookSourceRef[] = [];
  const featuredIn: BookSourceRef[] = [];
  const seen = new Set<string>();

  for (const ref of sourceRefs) {
    const key = `${ref.contentType}:${ref.contentSlug}:${ref.anchor ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);

    if (ref.contentType === 'blog') reviewedIn.push(ref);
    else if (ref.contentType === 'recommendations') recommendedIn.push(ref);
    else if (ref.contentType === 'author-spotlight') featuredIn.push(ref);
  }

  return { reviewedIn, recommendedIn, featuredIn };
}
