import RecommendationDetail from '@/components/recommendations/RecommendationDetail';
import { buildMetadata } from '@/lib/metadata';
import { getRecommendationMeta } from '@/lib/content';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  const meta = getRecommendationMeta(slug);
  const fallbackTitle = slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const baseKeywords = ['book recommendations', 'Anshika Mishra', meta?.title ?? fallbackTitle];
  const postKeywords = meta?.keywords ?? [];
  return buildMetadata({
    title: meta ? meta.title : `Book Recommendations: ${fallbackTitle}`,
    description: meta?.description ?? `Curated book recommendations by Anshika Mishra. Fiction, history & mythology from around the world. Discover your next read.`,
    path: `/recommendations/${slug}`,
    type: 'article',
    image: meta?.image,
    publishedTime: meta?.publishedTime,
    author: meta?.author,
    keywords: [...baseKeywords, ...postKeywords],
  });
}

export default function RecommendationPostPage({ params }: { params: { slug: string } }) {
  return <RecommendationDetail slug={params.slug} />;
}
