import BlogDetail from '@/components/blog/BlogDetail';
import { buildMetadata } from '@/lib/metadata';
import { getBlogMeta, getBlogSlugs } from '@/lib/content';

/** Pre-render all known blog slugs: from API at build time, with fallback to content.ts */
export async function generateStaticParams() {
  const base = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5001';
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
    // API unreachable at build time; use static list
  }
  return getBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const slug = params?.slug ?? '';
  const meta = getBlogMeta(slug);
  const fallbackTitle = slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  // Per-post keywords are merged with site-wide primaryKeywords + extendedKeywords in buildMetadata
  const baseKeywords = ['book review', 'book critic', 'Anshika Mishra', meta?.title ?? fallbackTitle];
  const postKeywords = meta?.keywords ?? [];
  return buildMetadata({
    title: meta ? meta.title : `Book Review: ${fallbackTitle}`,
    description: meta?.description ?? `Book review by Anshika Mishra, book blogger & content creator. Honest analysis, highlights, and whether it's worth your time. India & UAE.`,
    path: `/blog/${slug}`,
    type: 'article',
    image: meta?.image,
    publishedTime: meta?.publishedTime,
    author: meta?.author,
    keywords: [...baseKeywords, ...postKeywords],
  });
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const slug = params?.slug ?? '';
  return <BlogDetail slug={slug} />;
}
