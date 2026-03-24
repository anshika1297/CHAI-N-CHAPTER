import MusingDetail from '@/components/musings/MusingDetail';
import { buildMetadata } from '@/lib/metadata';
import { getMusingMeta, getMusingSlugs } from '@/lib/content';

/** Pre-render all known musing slugs: from API at build time, with fallback to content.ts */
export async function generateStaticParams() {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
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

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const slug = params?.slug ?? '';
  const meta = getMusingMeta(slug);
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
