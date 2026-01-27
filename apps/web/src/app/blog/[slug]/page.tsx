import BlogDetail from '@/components/blog/BlogDetail';
import { buildMetadata } from '@/lib/metadata';
import { getBlogMeta } from '@/lib/content';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  const meta = getBlogMeta(slug);
  const fallbackTitle = slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  // Per-post keywords are merged with site-wide primaryKeywords + extendedKeywords in buildMetadata
  const baseKeywords = ['book review', 'book critic', 'Anshika Mishra', meta?.title ?? fallbackTitle];
  const postKeywords = meta?.keywords ?? [];
  return buildMetadata({
    title: meta ? meta.title : `Book Review: ${fallbackTitle}`,
    description: meta?.description ?? `Book review by Anshika Mishra. Honest analysis, highlights, and whether it's worth your time.`,
    path: `/blog/${slug}`,
    type: 'article',
    image: meta?.image,
    publishedTime: meta?.publishedTime,
    author: meta?.author,
    keywords: [...baseKeywords, ...postKeywords],
  });
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  return <BlogDetail slug={params.slug} />;
}
