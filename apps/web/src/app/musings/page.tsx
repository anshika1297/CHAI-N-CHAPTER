import MusingsListing from '@/components/musings/MusingsListing';
import PageJsonLd from '@/components/schema/PageJsonLd';
import { buildMetadata } from '@/lib/metadata';
import { buildListingHubSchema } from '@/lib/schema';

const schemas = buildListingHubSchema({
  path: '/musings',
  name: 'Her Musings Verse — Chapters.aur.Chai',
  description:
    'Literary musings, reflections, and short essays by Anshika Mishra — books, life, and reading culture for India, UAE, and worldwide readers.',
  breadcrumbs: [
    { name: 'Home', path: '/' },
    { name: 'Musings', path: '/musings' },
  ],
});

export const metadata = buildMetadata({
  title: 'Her Musings Verse – Reflections by Anshika Mishra',
  description:
    'Short stories, reflections, and musings by Anshika Mishra, book blogger & content creator. Literary essays and thoughts from the heart—fiction, life, and books. For readers in India & UAE and worldwide.',
  path: '/musings',
  keywords: ['book blogger', 'literary blog', 'short stories', 'reading reflections', 'Anshika Mishra', 'India book blogger', 'UAE book blogger'],
});

export default function MusingsPage() {
  return (
    <>
      <PageJsonLd schemas={schemas} />
      <MusingsListing />
    </>
  );
}
