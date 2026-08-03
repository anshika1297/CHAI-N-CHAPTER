import { buildMetadata } from '@/lib/metadata';
import { resolveShopMetadata } from '@/lib/metadata/shop';
import { getAuthorSpotlightBySlugPublic } from '@/lib/api';
import ShopSpotlightDetail from '@/components/shop/ShopSpotlightDetail';
import ShopContentTags from '@/components/tags/ShopContentTags';
import { readTags } from '@/lib/contentFields';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const slug = params?.slug ?? '';
  let raw: Record<string, unknown> | null = null;
  try {
    const spotlight = await getAuthorSpotlightBySlugPublic(slug, { next: { revalidate: 60 } });
    if (spotlight) raw = spotlight as unknown as Record<string, unknown>;
  } catch {
    /* fallback */
  }
  return buildMetadata(resolveShopMetadata({ kind: 'author-spotlight', slug, raw }));
}

export default async function ShopAuthorSpotlightPage({ params }: { params: { slug: string } }) {
  const slug = params?.slug ?? '';
  let spotlight = null;
  try {
    spotlight = await getAuthorSpotlightBySlugPublic(slug, { next: { revalidate: 60 } });
  } catch {
    spotlight = null;
  }

  return (
    <main className="pt-28 pb-16 min-h-screen">
      {spotlight ? <ShopContentTags tags={readTags(spotlight)} /> : null}
      <ShopSpotlightDetail slug={slug} />
    </main>
  );
}
