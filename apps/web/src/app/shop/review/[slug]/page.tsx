import { buildMetadata } from '@/lib/metadata';
import { resolveShopMetadata } from '@/lib/metadata/shop';
import { getFetchBaseUrl } from '@/lib/apiBase';
import ShopReviewDetail from '@/components/shop/ShopReviewDetail';
import ShopContentTags from '@/components/tags/ShopContentTags';
import { readTags } from '@/lib/contentFields';

export const dynamicParams = true;
export const revalidate = 60;

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const slug = params?.slug ?? '';
  let raw: Record<string, unknown> | null = null;
  try {
    const res = await fetch(`${getFetchBaseUrl()}/api/blog/posts/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = (await res.json()) as { post?: Record<string, unknown> };
      raw = data.post && typeof data.post === 'object' ? data.post : null;
    }
  } catch {
    /* fallback */
  }
  return buildMetadata(resolveShopMetadata({ kind: 'review', slug, raw }));
}

async function fetchReviewPost(slug: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${getFetchBaseUrl()}/api/blog/posts/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { post?: Record<string, unknown> };
    return data.post && typeof data.post === 'object' ? data.post : null;
  } catch {
    return null;
  }
}

export default async function ShopReviewPage({ params }: { params: { slug: string } }) {
  const slug = params?.slug ?? '';
  const raw = await fetchReviewPost(slug);
  return (
    <main className="pt-28 pb-16 min-h-screen">
      {raw ? <ShopContentTags tags={readTags(raw)} /> : null}
      <ShopReviewDetail slug={slug} />
    </main>
  );
}
