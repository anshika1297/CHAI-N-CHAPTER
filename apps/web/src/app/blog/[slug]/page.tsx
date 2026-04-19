import BlogDetail from '@/components/blog/BlogDetail';
import { buildMetadata } from '@/lib/metadata';
import { getBlogMeta, getBlogSlugs, type ContentMeta } from '@/lib/content';
import { getFetchBaseUrl } from '@/lib/apiBase';

/**
 * ISR/on-demand rendering for slugs created after deploy.
 * - `dynamicParams = true` lets Next.js render unknown slugs on demand at request time.
 * - `revalidate = 60` re-renders + re-caches each slug at most once every 60s, so admin edits
 *   to metadata / new posts show up without a rebuild.
 */
export const dynamicParams = true;
export const revalidate = 60;

/** Pre-render all known blog slugs: from API at build time, with fallback to content.ts */
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
    // API unreachable at build time; use static list
  }
  return getBlogSlugs().map((slug) => ({ slug }));
}

/** Fetch a single post's SEO-relevant fields from the API. Returns null on any failure. */
async function fetchBlogMetaFromApi(slug: string): Promise<ContentMeta | null> {
  try {
    const base = getFetchBaseUrl();
    const res = await fetch(`${base}/api/blog/posts/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { post?: Record<string, unknown> };
    const p = data?.post;
    if (!p || typeof p !== 'object') return null;
    const title = String((p as Record<string, unknown>).seoTitle || (p as Record<string, unknown>).title || '').trim();
    if (!title) return null;
    const description = String(
      (p as Record<string, unknown>).seoDescription || (p as Record<string, unknown>).excerpt || ''
    ).trim();
    const image = typeof p.image === 'string' ? p.image : undefined;
    const publishedTime = typeof p.publishedAt === 'string' ? p.publishedAt : undefined;
    const author = typeof p.author === 'string' ? p.author : undefined;
    const keywords = Array.isArray(p.seoKeywords)
      ? (p.seoKeywords as unknown[]).filter((s): s is string => typeof s === 'string')
      : [];
    return { title, description, image, publishedTime, author, keywords };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const slug = params?.slug ?? '';
  // Fast path: static metadata bundled at build
  let meta = getBlogMeta(slug);
  // Fallback: fetch from API so post-deploy slugs still get proper SEO
  if (!meta) meta = await fetchBlogMetaFromApi(slug);

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
