import type { AuthorSpotlightBlogLink } from '@/lib/api';
import { parseInternalContentUrl, type InternalContentKind } from '@/lib/resolveInternalLinkPreview';

export type FeaturedContentGroup = {
  kind: InternalContentKind | 'other';
  label: string;
  links: AuthorSpotlightBlogLink[];
};

const GROUP_LABELS: Record<InternalContentKind, string> = {
  blog: 'Related Reviews',
  recommendations: 'Related Recommendations',
  musings: 'Related Musings',
};

const GROUP_ORDER: InternalContentKind[] = ['blog', 'recommendations', 'musings'];

/** Bucket blog/site links by content type for Featured On section. */
export function groupSpotlightSiteLinks(links: AuthorSpotlightBlogLink[]): FeaturedContentGroup[] {
  const buckets: Record<InternalContentKind, AuthorSpotlightBlogLink[]> = {
    blog: [],
    recommendations: [],
    musings: [],
  };
  const other: AuthorSpotlightBlogLink[] = [];

  for (const link of links) {
    const parsed = parseInternalContentUrl(link.url);
    if (parsed) buckets[parsed.kind].push(link);
    else if (link.url?.trim()) other.push(link);
  }

  const groups: FeaturedContentGroup[] = [];
  for (const kind of GROUP_ORDER) {
    if (buckets[kind].length) {
      groups.push({ kind, label: GROUP_LABELS[kind], links: buckets[kind] });
    }
  }
  if (other.length) {
    groups.push({ kind: 'other', label: 'More on Chapters.Aur.Chai', links: other });
  }
  return groups;
}
