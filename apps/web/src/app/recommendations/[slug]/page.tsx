import { notFound } from 'next/navigation';
import RecommendationDetail from '@/components/recommendations/RecommendationDetail';
import PageJsonLd from '@/components/schema/PageJsonLd';
import { buildMetadata } from '@/lib/metadata';
import { resolveContentItemMetadata, resolveContentNotFoundMetadata } from '@/lib/metadata/content';
import { schemasForRecommendationPage } from '@/lib/schema';
import { getFetchBaseUrl } from '@/lib/apiBase';
import { fetchReadNext } from '@/lib/readNext';
import { fetchRecommendationForPage } from '@/lib/editorial/fetchForPage';

export const dynamicParams = true;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    // API unreachable at build time — no static fallback slugs
  }
  return [];
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const slug = params?.slug ?? '';
  const raw = await fetchRecommendationForPage(slug);

  if (!raw) {
    return buildMetadata(resolveContentNotFoundMetadata('recommendation', slug));
  }

  return buildMetadata(
    resolveContentItemMetadata({
      kind: 'recommendation',
      slug,
      raw,
    })
  );
}

export default async function RecommendationPostPage({ params }: { params: { slug: string } }) {
  const slug = params?.slug ?? '';
  const raw = await fetchRecommendationForPage(slug);
  if (!raw) notFound();

  const readNextItems = await fetchReadNext('recommendations', slug);

  return (
    <>
      <PageJsonLd schemas={schemasForRecommendationPage(raw, slug)} />
      <RecommendationDetail slug={slug} readNextItems={readNextItems} />
    </>
  );
}
