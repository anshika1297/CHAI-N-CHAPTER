import RecommendationDetail from '@/components/recommendations/RecommendationDetail';
import { buildMetadata } from '@/lib/metadata';
import { getRecommendationMeta, getRecommendationSlugs, type ContentMeta } from '@/lib/content';
import { getFetchBaseUrl } from '@/lib/apiBase';

/**
 * ISR/on-demand rendering for slugs created after deploy.
 * See apps/web/src/app/blog/[slug]/page.tsx for rationale.
 */
export const dynamicParams = true;
export const revalidate = 60;

/** Pre-render all known recommendation slugs: from API at build time, with fallback to content.ts */
export async function generateStaticParams() {
  const base = getFetchBaseUrl();
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

/** Fetch a single recommendation's SEO-relevant fields from the API. Returns null on any failure. */
async function fetchRecommendationMetaFromApi(slug: string): Promise<ContentMeta | null> {
  try {
    const base = getFetchBaseUrl();
    const res = await fetch(`${base}/api/recommendations/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { item?: Record<string, unknown> };
    const p = data?.item;
    if (!p || typeof p !== 'object') return null;
    const title = String((p as Record<string, unknown>).seoTitle || (p as Record<string, unknown>).title || '').trim();
    if (!title) return null;
    const description = String(
      (p as Record<string, unknown>).seoDescription || (p as Record<string, unknown>).excerpt || ''
    ).trim();
    const image = typeof p.image === 'string' ? p.image : undefined;
    const publishedTime = typeof p.publishedAt === 'string' ? p.publishedAt : undefined;
    const author = typeof p.author === 'string' ? p.author : undefined;
    const keywords = Array.isArray(p.seoKeywords)
      ? (p.seoKeywords as unknown[]).filter((s): s is string => typeof s === 'string')
      : [];
    return { title, description, image, publishedTime, author, keywords };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const slug = params?.slug ?? '';
  let meta = getRecommendationMeta(slug);
  if (!meta) meta = await fetchRecommendationMetaFromApi(slug);

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
