import { notFound } from 'next/navigation';
import { buildMetadata } from '@/lib/metadata';
import { collectContentForTopic, resolveTopicHubMetadata } from '@/lib/metadata/taxonomy';
import { getAllTopicHubSlugs } from '@/lib/metadata/topicHubs';
import { buildTopicHubCollectionSchema } from '@/lib/schema';
import PageJsonLd from '@/components/schema/PageJsonLd';
import TaxonomyHubView from '@/components/taxonomy/TaxonomyHubView';
import { resolveReadingPathForHub } from '@/lib/readingPaths/resolve';

export const dynamicParams = false;
export const revalidate = 300;

export function generateStaticParams() {
  return getAllTopicHubSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const slug = params?.slug ?? '';
  const result = await collectContentForTopic(slug);
  if (!result) {
    return buildMetadata({
      title: 'Topic hub',
      description: 'Reading guide on Chapters.aur.Chai.',
      path: `/topics/${slug}`,
      noIndex: true,
    });
  }
  const previewImage = result.items[0]?.image;
  return buildMetadata(resolveTopicHubMetadata(result.hub, result.items.length, previewImage));
}

export default async function TopicHubPage({ params }: { params: { slug: string } }) {
  const slug = params?.slug ?? '';
  const result = await collectContentForTopic(slug);
  if (!result) notFound();

  const { hub, items } = result;
  const readingPath = await resolveReadingPathForHub(hub.slug);
  const schemas = buildTopicHubCollectionSchema({
    slug: hub.slug,
    title: hub.title,
    description: hub.description,
    items,
  });

  return (
    <main className="pt-28 pb-16 min-h-screen">
      <PageJsonLd schemas={schemas} />
      <div className="site-container">
        <TaxonomyHubView
          heading={hub.title}
          description={hub.description}
          items={items}
          hubSlug={hub.slug}
          readingPath={readingPath}
          emptyMessage={`Content for "${hub.title}" will appear as you publish matching posts.`}
        />
      </div>
    </main>
  );
}
