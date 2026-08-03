import { notFound } from 'next/navigation';
import { buildMetadata } from '@/lib/metadata';
import { collectContentForGenre, resolveGenreHubMetadata } from '@/lib/metadata/genres';
import { getAllGenreHubSlugs } from '@/lib/metadata/genreHubs';
import { fetchGenreIndex } from '@/lib/genres';
import { buildGenreHubSchemas } from '@/lib/metadata/genreSchema';
import PageJsonLd from '@/components/schema/PageJsonLd';
import GenreHubView from '@/components/genres/GenreHubView';

export const dynamicParams = true;
export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  const slugs = new Set(getAllGenreHubSlugs());
  try {
    const discovered = await fetchGenreIndex({ revalidate: 300 });
    for (const g of discovered) {
      if (g.count > 0) slugs.add(g.slug);
    }
  } catch {
    /* curated hubs only */
  }
  return [...slugs].map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const slug = params?.slug ?? '';
  const content = await collectContentForGenre(slug);
  if (!content) {
    return buildMetadata({
      title: 'Genre',
      description: 'Book genre guide on Chapters.aur.Chai.',
      path: `/genres/${slug}`,
      noIndex: true,
    });
  }
  return buildMetadata(resolveGenreHubMetadata(content.hub, content));
}

export default async function GenreHubPage({ params }: { params: { slug: string } }) {
  const slug = params?.slug ?? '';
  const content = await collectContentForGenre(slug);
  if (!content) notFound();

  const schemas = buildGenreHubSchemas(content);

  return (
    <main className="pt-28 pb-16 min-h-screen">
      <PageJsonLd schemas={schemas} />
      <div className="site-container">
        <GenreHubView content={content} />
      </div>
    </main>
  );
}
