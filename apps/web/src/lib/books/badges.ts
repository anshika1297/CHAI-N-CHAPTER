import type { BookSourceRef } from '@/lib/books/catalog';

export type BookContentBadge = {
  id: 'reviewed' | 'recommended' | 'spotlight';
  label: string;
};

const BADGE_MAP: Record<BookSourceRef['contentType'], BookContentBadge> = {
  blog: { id: 'reviewed', label: 'Reviewed' },
  recommendations: { id: 'recommended', label: 'Recommended' },
  'author-spotlight': { id: 'spotlight', label: 'Featured in Author Spotlight' },
};

export function bookContentBadges(sourceRefs: BookSourceRef[] = []): BookContentBadge[] {
  const seen = new Set<string>();
  const badges: BookContentBadge[] = [];
  for (const ref of sourceRefs) {
    const badge = BADGE_MAP[ref.contentType];
    if (badge && !seen.has(badge.id)) {
      seen.add(badge.id);
      badges.push(badge);
    }
  }
  return badges;
}
