import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { buildMetadata } from '@/lib/metadata';
import PageJsonLd from '@/components/schema/PageJsonLd';
import ReadingPathView from '@/components/reading-paths/ReadingPathView';
import { getReadingPathBySlug, getAllReadingPathSlugs } from '@/lib/readingPaths/definitions';
import { resolveReadingPathBySlug } from '@/lib/readingPaths/resolve';
import { resolveReadingPathMetadata } from '@/lib/readingPaths/metadata';
import { buildReadingPathSchema } from '@/lib/readingPaths/schema';
import { buildBreadcrumbSchema, buildWebPageSchema } from '@/lib/schema/webPage';

export const dynamicParams = false;
export const revalidate = 300;

export function generateStaticParams() {
  return getAllReadingPathSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const defn = getReadingPathBySlug(params?.slug ?? '');
  if (!defn) {
    return buildMetadata({
      title: 'Reading path',
      description: 'Curated reading guide on Chapters.aur.Chai.',
      path: `/reading-paths/${params?.slug ?? ''}`,
      noIndex: true,
    });
  }
  return buildMetadata(resolveReadingPathMetadata(defn));
}

export default async function ReadingPathPage({ params }: { params: { slug: string } }) {
  const defn = getReadingPathBySlug(params?.slug ?? '');
  if (!defn) notFound();

  const path = await resolveReadingPathBySlug(defn.slug);
  if (!path) notFound();

  const schemas = [
    buildWebPageSchema({
      path: path.pageHref,
      name: path.title,
      description: path.description,
      relatedLinks: [
        { name: 'Start Here', path: '/start-here' },
        { name: path.topicHubSlug.replace(/-/g, ' '), path: path.topicHubHref },
      ],
    }),
    buildBreadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Start Here', path: '/start-here' },
      { name: path.title, path: path.pageHref },
    ]),
    buildReadingPathSchema(path),
  ];

  return (
    <main className="pt-28 pb-16 min-h-screen">
      <PageJsonLd schemas={schemas} />
      <div className="site-container max-w-3xl">
        <nav className="mb-6 font-sans text-sm text-chai-brown-light" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/start-here" className="hover:text-terracotta transition-colors">
                Start Here
              </Link>
            </li>
            <li aria-hidden className="text-chai-brown/30">
              /
            </li>
            <li className="text-chai-brown">Reading path</li>
          </ol>
        </nav>

        <ReadingPathView path={path} showDedicatedLink={false} />

        <div className="mt-10 pt-8 border-t border-chai-brown/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="font-body text-sm text-chai-brown-light">
            Explore more posts in this topic hub, or return to Start Here for other paths.
          </p>
          <Link
            href={path.topicHubHref}
            className="inline-flex items-center gap-2 text-sm font-sans font-medium text-terracotta hover:gap-3 transition-all shrink-0"
          >
            Browse {path.topicHubSlug.replace(/-/g, ' ')}
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </main>
  );
}
