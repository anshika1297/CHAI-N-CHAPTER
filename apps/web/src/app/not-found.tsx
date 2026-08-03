import Link from 'next/link';
import { buildMetadata } from '@/lib/metadata';
import ExploreHubLinks from '@/components/content/ExploreHubLinks';

export const metadata = buildMetadata({
  title: 'Page not found',
  description: 'This page does not exist on Chapters.aur.Chai.',
  path: '/404',
  noIndex: true,
});

export default function NotFound() {
  return (
    <main className="pt-28 pb-16 min-h-screen">
      <div className="site-container max-w-xl text-center">
        <p className="font-sans text-xs uppercase tracking-[0.2em] text-terracotta mb-3">404</p>
        <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown mb-4">Page not found</h1>
        <p className="font-body text-chai-brown-light leading-relaxed mb-8">
          The page you are looking for may have moved or no longer exists. Try one of these starting points.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          <Link href="/start-here" className="btn-primary">
            Start here
          </Link>
          <Link href="/blog" className="btn-secondary">
            Book reviews
          </Link>
          <Link href="/search" className="btn-secondary">
            Search
          </Link>
        </div>
        <ExploreHubLinks intro="Explore the site" />
      </div>
    </main>
  );
}
