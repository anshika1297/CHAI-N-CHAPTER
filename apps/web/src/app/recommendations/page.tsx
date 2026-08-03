import RecommendationsListing from '@/components/recommendations/RecommendationsListing';
import PageJsonLd from '@/components/schema/PageJsonLd';
import { buildMetadata } from '@/lib/metadata';
import { buildListingHubSchema } from '@/lib/schema';

const schemas = buildListingHubSchema({
  path: '/recommendations',
  name: 'Book Recommendations — Chapters.aur.Chai',
  description:
    'Curated book lists and wrap-ups by Anshika Mishra — fiction, history, mythology, and literary picks for readers in India, UAE, and worldwide.',
  breadcrumbs: [
    { name: 'Home', path: '/' },
    { name: 'Recommendations', path: '/recommendations' },
  ],
});

export const metadata = buildMetadata({
  title: 'Book Recommendations – Fiction, History & Mythology | India & UAE',
  description:
    'Curated book lists and wrap-ups by Anshika Mishra, book blogger & content creator. Fiction, history & mythology for readers in India & UAE and worldwide. Find your next read from trusted recommendations.',
  path: '/recommendations',
  keywords: ['book recommendations', 'book lists', 'fiction recommendations', 'monthly wrap ups', 'reading recommendations', 'India book blogger', 'UAE book blogger'],
});

export default function RecommendationsPage() {
  return (
    <>
      <PageJsonLd schemas={schemas} />
      <RecommendationsListing />
    </>
  );
}
