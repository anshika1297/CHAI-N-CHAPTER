import { buildMetadata } from '@/lib/metadata';
import { resolveShopMetadata } from '@/lib/metadata/shop';
import { getFetchBaseUrl } from '@/lib/apiBase';
import ShopRecommendationDetail from '@/components/shop/ShopRecommendationDetail';
import ShopContentTags from '@/components/tags/ShopContentTags';
import { readTags } from '@/lib/contentFields';

export const dynamicParams = true;
export const revalidate = 60;

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const slug = params?.slug ?? '';
  let raw: Record<string, unknown> | null = null;
  try {
    const res = await fetch(`${getFetchBaseUrl()}/api/recommendations/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = (await res.json()) as { item?: Record<string, unknown> };
      raw = data.item && typeof data.item === 'object' ? data.item : null;
    }
  } catch {
    /* fallback */
  }
  return buildMetadata(resolveShopMetadata({ kind: 'recommendations', slug, raw }));
}

async function fetchRecommendation(slug: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${getFetchBaseUrl()}/api/recommendations/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { item?: Record<string, unknown> };
    return data.item && typeof data.item === 'object' ? data.item : null;
  } catch {
    return null;
  }
}

export default async function ShopRecommendationsPage({ params }: { params: { slug: string } }) {
  const slug = params?.slug ?? '';
  const raw = await fetchRecommendation(slug);
  return (
    <main className="pt-28 pb-16 min-h-screen">
      {raw ? <ShopContentTags tags={readTags(raw)} /> : null}
      <ShopRecommendationDetail slug={slug} />
    </main>
  );
}
