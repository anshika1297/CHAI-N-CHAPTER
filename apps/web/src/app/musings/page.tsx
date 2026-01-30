import MusingsListing from '@/components/musings/MusingsListing';
import { buildMetadata } from '@/lib/metadata';

export const metadata = buildMetadata({
  title: 'Her Musings Verse – Reflections by Anshika Mishra',
  description:
    'Short stories, reflections, and musings by Anshika Mishra, book blogger & content creator. Literary essays and thoughts from the heart—fiction, life, and books. For readers in India & UAE and worldwide.',
  path: '/musings',
  keywords: ['book blogger', 'literary blog', 'short stories', 'reading reflections', 'Anshika Mishra', 'India book blogger', 'UAE book blogger'],
});

export default function MusingsPage() {
  return <MusingsListing />;
}
