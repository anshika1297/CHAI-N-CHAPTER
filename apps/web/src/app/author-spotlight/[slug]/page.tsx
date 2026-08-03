import { notFound } from 'next/navigation';
import { buildMetadata } from '@/lib/metadata';
import { resolveContentItemMetadata, resolveContentNotFoundMetadata } from '@/lib/metadata/content';
import { fetchAuthorSpotlightBySlugForPage } from '@/lib/authorSpotlight/fetchPublic';
import { ssrApiFetch } from '@/lib/ssrApiFetch';
import AuthorSpotlightDetail from '@/components/author-spotlight/AuthorSpotlightDetail';
import PageJsonLd from '@/components/schema/PageJsonLd';
import { schemasForSpotlightPage } from '@/lib/schema';
import { fetchReadNext } from '@/lib/readNext';
import { featuredBookSlugsFromSpotlight, fetchCatalogBooks } from '@/lib/books/catalog';
import { fetchRelatedBooks } from '@/lib/books/related';
import { readTags } from '@/lib/contentFields';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export async function generateStaticParams() {
  if (process.env.SKIP_BUILD_API_FETCH === '1') return [];
  try {
    const res = await ssrApiFetch('/api/author-spotlight');
    if (res.ok) {
      const data = (await res.json()) as { spotlights?: { slug?: string }[] };
      const slugs = (data.spotlights ?? [])
        .map((s) => (typeof s?.slug === 'string' ? s.slug.trim() : ''))
        .filter(Boolean);
      if (slugs.length) return slugs.map((slug) => ({ slug }));
    }
  } catch {
    // build without static slugs
  }
  return [];
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const slug = params?.slug ?? '';
  const spotlight = await fetchAuthorSpotlightBySlugForPage(slug);

  if (!spotlight) {
    return buildMetadata(resolveContentNotFoundMetadata('author-spotlight', slug));
  }

  return buildMetadata(
    resolveContentItemMetadata({
      kind: 'author-spotlight',
      slug,
      raw: spotlight as unknown as Record<string, unknown>,
    })
  );
}

export default async function AuthorSpotlightDetailPage({ params }: { params: { slug: string } }) {
  const slug = params?.slug ?? '';
  const spotlight = await fetchAuthorSpotlightBySlugForPage(slug);
  if (!spotlight) notFound();

  const bookSlugs = featuredBookSlugsFromSpotlight(spotlight);
  const tags = readTags(spotlight);
  const [catalogBooks, readNextItems, relatedBooks] = await Promise.all([
    fetchCatalogBooks(bookSlugs),
    fetchReadNext('author-spotlight', slug),
    fetchRelatedBooks({
      author: spotlight.name,
      genre: spotlight.genres?.[0],
      tags,
      excludeSlugs: bookSlugs,
      limit: 6,
    }),
  ]);

  return (
    <>
      <PageJsonLd schemas={schemasForSpotlightPage(spotlight)} />
      <section className="pt-24 pb-12 sm:pb-16 min-h-screen overflow-x-clip">
        <div className="site-container max-w-6xl w-full min-w-0">
          <AuthorSpotlightDetail
            spotlight={spotlight}
            catalogBooks={catalogBooks}
            readNextItems={readNextItems}
            relatedBooks={relatedBooks}
          />
        </div>
      </section>
    </>
  );
}
