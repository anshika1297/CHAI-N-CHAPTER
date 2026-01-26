import BlogDetail from '@/components/blog/BlogDetail';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  // This will be replaced with actual data fetching
  return {
    title: 'Book Review | chai.n.chapter',
    description: 'Read our detailed book review and discover new stories.',
  };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  return <BlogDetail slug={params.slug} />;
}
