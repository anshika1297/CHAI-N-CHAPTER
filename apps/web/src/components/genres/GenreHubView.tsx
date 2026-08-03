import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { GenreHubContent } from '@/lib/metadata/genres';
import { genreHubDisplayTitle } from '@/lib/metadata/genreHubs';
import GenreBooksSection from '@/components/genres/GenreBooksSection';
import GenreContentSection from '@/components/genres/GenreContentSection';
import NewsletterSection from '@/components/newsletter/NewsletterSection';
type Props = {
  content: GenreHubContent;
};

export default function GenreHubView({ content }: Props) {
  const { hub, books, reviews, recommendations, authorSpotlights, relatedGenres, topicHub } =
    content;
  const displayTitle = genreHubDisplayTitle(hub);

  return (
    <div className="w-full">
      <header className="mb-10 sm:mb-12 text-center max-w-3xl mx-auto">
        <p className="font-sans text-xs uppercase tracking-[0.2em] text-terracotta mb-3">Genre guide</p>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-chai-brown mb-4">{displayTitle}</h1>
        <p className="font-body text-base sm:text-lg text-chai-brown-light leading-relaxed">{hub.description}</p>
        {topicHub ? (
          <Link
            href={topicHub.href}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-sans font-medium text-terracotta hover:gap-2 transition-all"
          >
            Explore {topicHub.title} topic hub
            <ArrowRight size={14} aria-hidden />
          </Link>
        ) : null}
      </header>

      <GenreBooksSection books={books} genreTitle={hub.title} />

      <GenreContentSection
        id="genre-reviews"
        title="Featured reviews"
        items={reviews}
        viewAllHref="/blog"
        viewAllLabel="All reviews"
        emptyMessage={`Reviews tagged with ${hub.title} will appear as you publish matching posts.`}
      />

      <GenreContentSection
        id="genre-recommendations"
        title="Featured recommendations"
        items={recommendations}
        viewAllHref="/recommendations"
        viewAllLabel="All lists"
        emptyMessage={`Recommendation lists for ${hub.title} will appear here.`}
      />

      <GenreContentSection
        id="genre-authors"
        title="Featured authors"
        items={authorSpotlights}
        viewAllHref="/author-spotlight"
        viewAllLabel="All authors"
        emptyMessage={`Author spotlights in ${hub.title} will appear here.`}
      />

      {relatedGenres.length ? (
        <section className="mb-12 sm:mb-14" aria-labelledby="related-genres">
          <h2 id="related-genres" className="font-serif text-xl sm:text-2xl text-chai-brown mb-5">
            Related genres
          </h2>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {relatedGenres.map((related) => (
              <li key={related.slug}>
                <Link
                  href={`/genres/${related.slug}`}
                  className="block rounded-xl border border-chai-brown/10 bg-cream-light p-4 sm:p-5 hover:border-terracotta/35 transition-colors h-full"
                >
                  <h3 className="font-serif text-lg text-chai-brown hover:text-terracotta transition-colors">
                    {related.title}
                  </h3>
                  <p className="mt-2 font-body text-sm text-chai-brown-light line-clamp-2">{related.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-wrap justify-center gap-4 mb-12 font-sans text-sm">
        <Link href="/books" className="text-terracotta hover:underline">
          Books directory
        </Link>
        <Link href="/shop" className="text-terracotta hover:underline">
          Shop
        </Link>
        {hub.readingPathSlug ? (
          <Link href={`/reading-paths/${hub.readingPathSlug}`} className="text-terracotta hover:underline">
            Reading path
          </Link>
        ) : null}
      </div>

      <NewsletterSection
        variant="genre-hub"
        placement="inline-genre-hub"
        topicTitle={hub.title}
        contentSlug={hub.slug}
      />
    </div>
  );
}
