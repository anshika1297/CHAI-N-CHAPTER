import { notFound } from 'next/navigation';
import BlogDetail from '@/components/blog/BlogDetail';
import PageJsonLd from '@/components/schema/PageJsonLd';
import { buildMetadata } from '@/lib/metadata';
import { resolveContentItemMetadata, resolveContentNotFoundMetadata } from '@/lib/metadata/content';
import { schemasForReviewPage } from '@/lib/schema';
import { getFetchBaseUrl } from '@/lib/apiBase';
import { fetchReadNext } from '@/lib/readNext';
import { fetchBlogPostForPage } from '@/lib/editorial/fetchForPage';

export const dynamicParams = true;
/** Always render from live API so drafts published after deploy don't 500. */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateStaticParams() {
  const base = getFetchBaseUrl();
  try {
    const res = await fetch(`${base}/api/blog/posts?limit=9999`);
    if (res.ok) {
      const data = (await res.json()) as { posts?: { slug?: string }[] };
      const slugs = (data.posts ?? [])
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
  try {
    const raw = await fetchBlogPostForPage(slug);
    if (!raw) {
      return buildMetadata(resolveContentNotFoundMetadata('review', slug));
    }
    return buildMetadata(
      resolveContentItemMetadata({
        kind: 'review',
        slug,
        raw,
      })
    );
  } catch {
    return buildMetadata(resolveContentNotFoundMetadata('review', slug));
  }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const slug = params?.slug ?? '';
  let raw: Record<string, unknown> | null = null;
  try {
    raw = await fetchBlogPostForPage(slug);
  } catch {
    notFound();
  }
  if (!raw) notFound();

  const readNextItems = await fetchReadNext('blog', slug);

  let schemas: ReturnType<typeof schemasForReviewPage> = [];
  try {
    schemas = schemasForReviewPage(raw, slug);
  } catch {
    schemas = [];
  }

  return (
    <>
      <PageJsonLd schemas={schemas} />
      <BlogDetail slug={slug} readNextItems={readNextItems} />
    </>
  );
}
