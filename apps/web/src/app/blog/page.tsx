import { Suspense } from 'react';
import BlogListing from '@/components/blog/BlogListing';
import PageLoading from '@/components/PageLoading';
import PageJsonLd from '@/components/schema/PageJsonLd';
import { buildMetadata } from '@/lib/metadata';
import { buildListingHubSchema } from '@/lib/schema';

const schemas = buildListingHubSchema({
  path: '/blog',
  name: 'Book Reviews — Chapters.aur.Chai',
  description:
    'Honest book reviews by Anshika Mishra — fiction, history, mythology, and literary fiction for readers in India, UAE, and worldwide.',
  breadcrumbs: [
    { name: 'Home', path: '/' },
    { name: 'Book Reviews', path: '/blog' },
  ],
});

export const metadata = buildMetadata({
  title: 'Book Reviews – Fiction, History & Mythology | India & UAE',
  description:
    'Honest book reviews by Anshika Mishra, book blogger & content creator. Fiction, history & mythology for readers worldwide—India & UAE. Find your next read from a critic you can trust.',
  path: '/blog',
  keywords: ['book reviews', 'fiction reviews', 'mythology book reviews', 'history book reviews', 'Anshika Mishra', 'India book blogger', 'UAE book blogger'],
});

export default function BlogPage() {
  return (
    <>
      <PageJsonLd schemas={schemas} />
      <Suspense fallback={<PageLoading message="Loading book reviews..." />}>
        <BlogListing />
      </Suspense>
    </>
  );
}
