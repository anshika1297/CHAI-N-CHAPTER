import Link from 'next/link';
import { buildMetadata } from '@/lib/metadata';
import { resolveTopicsIndexMetadata } from '@/lib/metadata/taxonomy';
import { TOPIC_HUBS } from '@/lib/metadata/topicHubs';
import { fetchGenreIndex } from '@/lib/genres';
import { getGenreHubBySlug, genreHubDisplayTitle } from '@/lib/metadata/genreHubs';
import PageJsonLd from '@/components/schema/PageJsonLd';
import ExploreHubLinks from '@/components/content/ExploreHubLinks';
import { buildListingHubSchema } from '@/lib/schema';

const schemas = buildListingHubSchema({
  path: '/topics',
  name: 'Reading Topic Hubs — Chapters.aur.Chai',
  description:
    'Curated reading guides across fiction, non-fiction, Indian literature, mythology, and more.',
  breadcrumbs: [
    { name: 'Home', path: '/' },
    { name: 'Topics', path: '/topics' },
  ],
});

export const dynamic = 'force-dynamic';

export const metadata = buildMetadata(resolveTopicsIndexMetadata());

export default async function TopicsIndexPage() {
  const discovered = await fetchGenreIndex({ revalidate: 300 });

  return (
    <main className="pt-28 pb-16 min-h-screen">
      <PageJsonLd schemas={schemas} />
      <div className="site-container">
        <header className="mb-10">
          <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown mb-3">Reading topic hubs</h1>
          <p className="font-body text-chai-brown-light">
            Curated collections of reviews, recommendations, musings, and author spotlights.
          </p>
        </header>
        <ul className="space-y-4">
          {TOPIC_HUBS.map((hub) => (
            <li key={hub.slug}>
              <Link
                href={`/topics/${hub.slug}`}
                className="block rounded-xl border border-chai-brown/10 bg-cream-light p-5 hover:border-terracotta/40 transition-colors"
              >
                <h2 className="font-serif text-xl text-chai-brown">{hub.title}</h2>
                <p className="font-body text-sm text-chai-brown-light mt-2">{hub.description}</p>
              </Link>
            </li>
          ))}
        </ul>

        {discovered.length > 0 ? (
          <section className="mt-12 sm:mt-14" aria-labelledby="discovered-genres">
            <h2 id="discovered-genres" className="font-serif text-2xl text-chai-brown mb-3">
              Book genres from your library
            </h2>
            <p className="font-body text-sm text-chai-brown-light mb-5 max-w-2xl">
              Genres you assign in the admin on reviews, lists, and author spotlights — browse books and related
              content for each.
            </p>
            <ul className="flex flex-wrap gap-2">
              {discovered.map((g) => {
                const hub = getGenreHubBySlug(g.slug);
                const label = hub ? genreHubDisplayTitle(hub) : g.label;
                return (
                  <li key={g.slug}>
                    <Link
                      href={`/genres/${g.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-chai-brown/15 bg-cream-light px-3 py-1.5 font-sans text-sm text-chai-brown hover:border-terracotta/40 transition-colors"
                    >
                      {label}
                      {g.count > 0 ? (
                        <span className="text-xs text-chai-brown/50">({g.count})</span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        <ExploreHubLinks />
      </div>
    </main>
  );
}
