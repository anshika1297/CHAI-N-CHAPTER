import { buildMetadata } from '@/lib/metadata';
import { collectTagIndex, resolveTagsIndexMetadata } from '@/lib/metadata/taxonomy';
import PageJsonLd from '@/components/schema/PageJsonLd';
import TagsIndexList from '@/components/tags/TagsIndexList';
import ExploreHubLinks from '@/components/content/ExploreHubLinks';
import { buildListingHubSchema } from '@/lib/schema';

const schemas = buildListingHubSchema({
  path: '/tags',
  name: 'Browse by Tag — Chapters.aur.Chai',
  description: 'Explore Chapters.aur.Chai content by tag — reviews, lists, musings, and author spotlights.',
  breadcrumbs: [
    { name: 'Home', path: '/' },
    { name: 'Tags', path: '/tags' },
  ],
});

export const dynamic = 'force-dynamic';

export const metadata = buildMetadata(resolveTagsIndexMetadata());

export default async function TagsIndexPage() {
  const tags = await collectTagIndex();

  return (
    <main className="pt-28 pb-16 min-h-screen">
      <PageJsonLd schemas={schemas} />
      <div className="site-container">
        <header className="mb-10">
          <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown mb-3">Browse by tag</h1>
          <p className="font-body text-chai-brown-light">
            Explore book reviews, recommendations, musings, author spotlights, and shop entries by tag.
          </p>
        </header>
        <TagsIndexList initialTags={tags} />
        <ExploreHubLinks />
      </div>
    </main>
  );
}
