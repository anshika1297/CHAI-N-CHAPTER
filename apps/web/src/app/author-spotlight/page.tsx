import { buildMetadata, resolveAuthorDirectoryMetadata } from '@/lib/metadata';
import { fetchAuthorSpotlightsForPage } from '@/lib/authorSpotlight/fetchPublic';
import AuthorSpotlightList from '@/components/author-spotlight/AuthorSpotlightList';
import PageJsonLd from '@/components/schema/PageJsonLd';
import { buildListingHubSchema } from '@/lib/schema';

const schemas = buildListingHubSchema({
  path: '/author-spotlight',
  name: 'Author Spotlight — Chapters.aur.Chai',
  description:
    'Meet authors we love — profiles, reading recommendations, and curated links from Chapters.aur.Chai.',
  breadcrumbs: [
    { name: 'Home', path: '/' },
    { name: 'Author Spotlight', path: '/author-spotlight' },
  ],
});

export const dynamic = 'force-dynamic';

export const metadata = buildMetadata(resolveAuthorDirectoryMetadata());

export default async function AuthorSpotlightListingPage() {
  const spotlights = await fetchAuthorSpotlightsForPage();

  return (
    <section className="pt-24 pb-12 sm:pb-16 min-h-screen">
      <PageJsonLd schemas={schemas} />
      <div className="site-container">
        <div className="text-center mb-8 sm:mb-12 max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-chai-brown mb-3">Author spotlight</h1>
          <p className="text-terracotta font-body italic text-lg">
            Celebrating writers and voices we are excited to share
          </p>
          <p className="mt-4 font-body text-chai-brown-light leading-relaxed">
            Bios, favourite reads, reading pairings, and curated links from our blog—everything in one place for
            readers who want to go deeper.
          </p>
        </div>
        <AuthorSpotlightList spotlights={spotlights} />
      </div>
    </section>
  );
}
