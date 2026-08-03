import { notFound } from 'next/navigation';
import { buildMetadata } from '@/lib/metadata';
import { resolveTagMetadata } from '@/lib/metadata/taxonomy';
import { getTagDetail } from '@/lib/tags';
import { buildTagCollectionSchema } from '@/lib/schema/tag';
import PageJsonLd from '@/components/schema/PageJsonLd';
import TagHubView from '@/components/tags/TagHubView';

export const dynamicParams = true;
export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  const { collectTagIndex } = await import('@/lib/tags');
  const tags = await collectTagIndex();
  return tags.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const slug = params?.slug ?? '';
  const detail = await getTagDetail(slug);
  const previewImage = detail?.items?.[0]?.image;
  return buildMetadata(
    resolveTagMetadata(
      slug,
      detail ? { slug: detail.slug, label: detail.label, count: detail.count } : undefined,
      previewImage
    )
  );
}

export default async function TagPage({ params }: { params: { slug: string } }) {
  const slug = params?.slug ?? '';
  const detail = await getTagDetail(slug);

  if (!detail) notFound();

  const schemas = buildTagCollectionSchema({
    slug: detail.slug,
    label: detail.label,
    items: detail.items,
  });

  return (
    <main className="pt-28 pb-16 min-h-screen">
      <PageJsonLd schemas={schemas} />
      <div className="site-container">
      <TagHubView
        heading={`#${detail.label}`}
        description={`${detail.count} item${detail.count === 1 ? '' : 's'} tagged "${detail.label}" on Chapters.aur.Chai — reviews, recommendations, musings, author spotlights, and shop.`}
        items={detail.items}
        topicClusters={detail.topicClusters}
        relatedTags={detail.relatedTags}
        emptyMessage={`No published posts tagged "${detail.label}" yet.`}
      />
      </div>
    </main>
  );
}
