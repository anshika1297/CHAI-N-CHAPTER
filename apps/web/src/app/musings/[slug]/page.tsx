import MusingDetail from '@/components/musings/MusingDetail';
import { buildMetadata } from '@/lib/metadata';
import { getMusingMeta } from '@/lib/content';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  const meta = getMusingMeta(slug);
  const fallbackTitle = slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const baseKeywords = ['Her Musings Verse', 'Anshika Mishra', meta?.title ?? fallbackTitle];
  const postKeywords = meta?.keywords ?? [];
  return buildMetadata({
    title: meta ? meta.title : `Her Musings Verse: ${fallbackTitle}`,
    description: meta?.description ?? 'Short stories, reflections, and musings by Anshika Mishra. Literary essays and thoughts from the heart.',
    path: `/musings/${slug}`,
    type: 'article',
    image: meta?.image,
    publishedTime: meta?.publishedTime,
    author: meta?.author,
    keywords: [...baseKeywords, ...postKeywords],
  });
}

export default function MusingPostPage({ params }: { params: { slug: string } }) {
  return <MusingDetail slug={params.slug} />;
}
