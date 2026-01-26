import RecommendationDetail from '@/components/recommendations/RecommendationDetail';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  // This will be replaced with actual data fetching
  return {
    title: 'Book Recommendations | chai.n.chapter',
    description: 'Discover curated book recommendations and reading lists.',
  };
}

export default function RecommendationPostPage({ params }: { params: { slug: string } }) {
  return <RecommendationDetail slug={params.slug} />;
}
