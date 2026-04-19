import MusingDetail from '@/components/musings/MusingDetail';
import { buildMetadata } from '@/lib/metadata';
import { getMusingMeta, getMusingSlugs, type ContentMeta } from '@/lib/content';
import { getFetchBaseUrl } from '@/lib/apiBase';

/**
 * ISR/on-demand rendering for slugs created after deploy.
 * See apps/web/src/app/blog/[slug]/page.tsx for rationale.
 */
export const dynamicParams = true;
export const revalidate = 60;

/** Pre-render all known musing slugs: from API at build time, with fallback to content.ts */
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
    // API unreachable at build time; use static list
  }
  return getMusingSlugs().map((slug) => ({ slug }));
}

/** Fetch a single musing's SEO-relevant fields from the API. Returns null on any failure. */
async function fetchMusingMetaFromApi(slug: string): Promise<ContentMeta | null> {
  try {
    const base = getFetchBaseUrl();
    const res = await fetch(`${base}/api/musings/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { item?: Record<string, unknown> };
    const p = data?.item;
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
  let meta = getMusingMeta(slug);
  if (!meta) meta = await fetchMusingMetaFromApi(slug);

  const fallbackTitle = slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const baseKeywords = ['Her Musings Verse', 'Anshika Mishra', meta?.title ?? fallbackTitle];
  const postKeywords = meta?.keywords ?? [];
  return buildMetadata({
    title: meta ? meta.title : `Her Musings Verse: ${fallbackTitle}`,
    description: meta?.description ?? 'Short stories, reflections, and musings by Anshika Mishra, book blogger & content creator. Literary essays and thoughts from the heart. India & UAE.',
    path: `/musings/${slug}`,
    type: 'article',
    image: meta?.image,
    publishedTime: meta?.publishedTime,
    author: meta?.author,
    keywords: [...baseKeywords, ...postKeywords],
  });
}

export default function MusingPostPage({ params }: { params: { slug: string } }) {
  const slug = params?.slug ?? '';
  return <MusingDetail slug={slug} />;
}
