import BlogListing from '@/components/blog/BlogListing';
import { buildMetadata } from '@/lib/metadata';

export const metadata = buildMetadata({
  title: 'Book Reviews – Fiction, History & Mythology | India & UAE',
  description:
    'Honest book reviews by Anshika Mishra, book blogger & content creator. Fiction, history & mythology for readers worldwide—India & UAE. Find your next read from a critic you can trust.',
  path: '/blog',
  keywords: ['book reviews', 'fiction reviews', 'mythology book reviews', 'history book reviews', 'Anshika Mishra', 'India book blogger', 'UAE book blogger'],
});

export default function BlogPage() {
  return <BlogListing />;
}
