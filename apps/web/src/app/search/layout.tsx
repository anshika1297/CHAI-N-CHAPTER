import { buildMetadata } from '@/lib/metadata';
import { resolvePageMetadata } from '@/lib/metadata/resolve';

export const metadata = buildMetadata(
  resolvePageMetadata({
    path: '/search',
    contentTitle: 'Search',
    fallbackTitle: 'Search',
    excerpt: 'Search book reviews, recommendations, musings, author spotlights, shop links, tags, and genres on Chapters.aur.Chai.',
    fallbackDescription:
      'Global search across Chapters.aur.Chai — find books, authors, reviews, and curated lists.',
    keywords: ['search', 'book search', 'Chapters.aur.Chai'],
    type: 'website',
    noIndex: true,
  })
);

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
