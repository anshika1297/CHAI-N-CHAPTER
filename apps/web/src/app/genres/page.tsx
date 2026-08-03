import Link from 'next/link';
import { buildMetadata } from '@/lib/metadata';
import { resolveGenresIndexMetadata } from '@/lib/metadata/genres';
import { GENRE_HUBS, genreHubDisplayTitle, getGenreHubBySlug } from '@/lib/metadata/genreHubs';
import { fetchGenreIndex } from '@/lib/genres';
import PageJsonLd from '@/components/schema/PageJsonLd';
import ExploreHubLinks from '@/components/content/ExploreHubLinks';
import { buildListingHubSchema } from '@/lib/schema';

const schemas = buildListingHubSchema({
  path: '/genres',
  name: 'Browse by Genre — Chapters.aur.Chai',
  description:
    'Genre pages for book reviews, recommendations, author spotlights, and the books directory — updated automatically from your CMS content.',
  breadcrumbs: [
    { name: 'Home', path: '/' },
    { name: 'Genres', path: '/genres' },
  ],
});

export const dynamic = 'force-dynamic';

export const metadata = buildMetadata(resolveGenresIndexMetadata());

export default async function GenresIndexPage() {
  const discovered = await fetchGenreIndex({ revalidate: 300 });
  const curated = [...GENRE_HUBS].sort(
    (a, b) => (a.popularityRank ?? 99) - (b.popularityRank ?? 99)
  );
  const curatedSlugs = new Set(curated.map((h) => h.slug));

  const extra = discovered
    .filter((g) => !curatedSlugs.has(g.slug) && g.count > 0)
    .map((g) => getGenreHubBySlug(g.slug))
    .filter((h): h is NonNullable<typeof h> => h != null);

  const allHubs = [...curated, ...extra];

  return (
    <main className="pt-28 pb-16 min-h-screen">
      <PageJsonLd schemas={schemas} />
      <div className="site-container">
        <header className="mb-10 sm:mb-12 max-w-2xl">
          <p className="font-sans text-xs uppercase tracking-[0.2em] text-terracotta mb-3">Genre guides</p>
          <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown mb-3">Browse by genre</h1>
          <p className="font-body text-chai-brown-light leading-relaxed">
            Reviews, recommendations, author spotlights, and books — grouped by genre. New genres you add in the
            admin appear here automatically.
          </p>
        </header>

        {allHubs.length === 0 ? (
          <p className="font-body text-chai-brown-light">
            Add genres to reviews, lists, or author spotlights in the admin — they will appear here.
          </p>
        ) : (
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {allHubs.map((hub) => {
              const count = discovered.find((g) => g.slug === hub.slug)?.count;
              return (
                <li key={hub.slug}>
                  <Link
                    href={`/genres/${hub.slug}`}
                    className="block rounded-xl border border-chai-brown/10 bg-cream-light p-5 sm:p-6 hover:border-terracotta/40 transition-colors h-full"
                  >
                    <h2 className="font-serif text-xl text-chai-brown">{genreHubDisplayTitle(hub)}</h2>
                    <p className="font-body text-sm text-chai-brown-light mt-2 line-clamp-3">{hub.description}</p>
                    {count != null && count > 0 ? (
                      <p className="mt-3 font-sans text-xs text-chai-brown/60">{count} items</p>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <ExploreHubLinks />
      </div>
    </main>
  );
}
