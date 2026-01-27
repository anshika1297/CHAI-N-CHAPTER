import BlogListing from '@/components/blog/BlogListing';
import { buildMetadata } from '@/lib/metadata';

export const metadata = buildMetadata({
  title: 'Book Reviews – Fiction, History & Mythology',
  description:
    'Honest book reviews by Anshika Mishra. Fiction, history & mythology from around the world. Find your next read from a book critic you can trust.',
  path: '/blog',
  keywords: ['book reviews', 'fiction reviews', 'mythology book reviews', 'history book reviews', 'Anshika Mishra'],
});

export default function BlogPage() {
  return <BlogListing />;
}
