import RecommendationDetail from '@/components/recommendations/RecommendationDetail';
import { buildMetadata } from '@/lib/metadata';
import { getRecommendationMeta, getRecommendationSlugs } from '@/lib/content';

/** Pre-render all known recommendation slugs: from API at build time, with fallback to content.ts */
export async function generateStaticParams() {
  const base = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5001';
  try {
    const res = await fetch(`${base}/api/recommendations?limit=9999`);
    if (res.ok) {
      const data = (await res.json()) as { items?: { slug?: string }[] };
      const slugs = (data.items ?? [])
        .map((p) => (typeof p?.slug === 'string' ? p.slug.trim() : ''))
        .filter(Boolean);
      if (slugs.length > 0) return slugs.map((slug) => ({ slug }));
    }
  } catch {
    // API unreachable at build time; use static list
  }
  return getRecommendationSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const slug = params?.slug ?? '';
  const meta = getRecommendationMeta(slug);
  const fallbackTitle = slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const baseKeywords = ['book recommendations', 'Anshika Mishra', meta?.title ?? fallbackTitle];
  const postKeywords = meta?.keywords ?? [];
  return buildMetadata({
    title: meta ? meta.title : `Book Recommendations: ${fallbackTitle}`,
    description: meta?.description ?? `Curated book recommendations by Anshika Mishra, book blogger & content creator. Fiction, history & mythology for readers in India & UAE and worldwide. Discover your next read.`,
    path: `/recommendations/${slug}`,
    type: 'article',
    image: meta?.image,
    publishedTime: meta?.publishedTime,
    author: meta?.author,
    keywords: [...baseKeywords, ...postKeywords],
  });
}

export default function RecommendationPostPage({ params }: { params: { slug: string } }) {
  const slug = params?.slug ?? '';
  return <RecommendationDetail slug={slug} />;
}
