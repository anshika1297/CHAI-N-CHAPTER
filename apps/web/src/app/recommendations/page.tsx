import RecommendationsListing from '@/components/recommendations/RecommendationsListing';
import { buildMetadata } from '@/lib/metadata';

export const metadata = buildMetadata({
  title: 'Book Recommendations – Fiction, History & Mythology',
  description:
    'Curated book lists and wrap-ups by Anshika Mishra. Fiction, history & mythology from around the world. Find your next read from trusted recommendations.',
  path: '/recommendations',
  keywords: ['book recommendations', 'book lists', 'fiction recommendations', 'monthly wrap ups', 'reading recommendations'],
});

export default function RecommendationsPage() {
  return <RecommendationsListing />;
}
