import MusingDetail from '@/components/musings/MusingDetail';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  return {
    title: 'Her Musings Verse | chai.n.chapter',
    description: 'Read short stories, reflections, and random thoughts from the heart.',
  };
}

export default function MusingPostPage({ params }: { params: { slug: string } }) {
  return <MusingDetail slug={params.slug} />;
}
