import { notFound } from 'next/navigation';
import MusingDetail from '@/components/musings/MusingDetail';
import PageJsonLd from '@/components/schema/PageJsonLd';
import { buildMetadata } from '@/lib/metadata';
import { resolveContentItemMetadata, resolveContentNotFoundMetadata } from '@/lib/metadata/content';
import { schemasForMusingPage } from '@/lib/schema';
import { getFetchBaseUrl } from '@/lib/apiBase';
import { fetchReadNext } from '@/lib/readNext';
import { fetchMusingForPage } from '@/lib/editorial/fetchForPage';

export const dynamicParams = true;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateStaticParams() {
  const base = getFetchBaseUrl();
  try {
    const res = await fetch(`${base}/api/musings?limit=9999`);
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
  const raw = await fetchMusingForPage(slug);

  if (!raw) {
    return buildMetadata(resolveContentNotFoundMetadata('musing', slug));
  }

  return buildMetadata(
    resolveContentItemMetadata({
      kind: 'musing',
      slug,
      raw,
    })
  );
}

export default async function MusingPostPage({ params }: { params: { slug: string } }) {
  const slug = params?.slug ?? '';
  const raw = await fetchMusingForPage(slug);
  if (!raw) notFound();

  const readNextItems = await fetchReadNext('musings', slug);

  return (
    <>
      <PageJsonLd schemas={schemasForMusingPage(raw, slug)} />
      <MusingDetail slug={slug} readNextItems={readNextItems} />
    </>
  );
}
