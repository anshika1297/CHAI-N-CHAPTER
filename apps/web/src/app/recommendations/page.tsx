import RecommendationsListing from '@/components/recommendations/RecommendationsListing';

export const metadata = {
  title: 'Book Recommendations | chai.n.chapter',
  description: 'Discover curated book lists, weekly wrap-ups, monthly recommendations, and yearly favorites.',
};

export default function RecommendationsPage() {
  return <RecommendationsListing />;
}
