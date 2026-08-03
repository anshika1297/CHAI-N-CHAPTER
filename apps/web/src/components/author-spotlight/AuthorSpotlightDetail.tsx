import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { AuthorSpotlightDto } from '@/lib/api';
import type { ReadNextItem } from '@/lib/readNext';
import AuthorSpotlightHero from './AuthorSpotlightHero';
import AuthorSpotlightAbout from './AuthorSpotlightAbout';
import AuthorSpotlightBooksFromCatalog from './AuthorSpotlightBooksFromCatalog';
import type { CatalogBook } from '@/lib/books/catalog';
import AuthorSpotlightFeaturedOnSite from './AuthorSpotlightFeaturedOnSite';
import AuthorSpotlightReadingPairings from './AuthorSpotlightReadingPairings';
import AuthorSpotlightInterview from './AuthorSpotlightInterview';
import AuthorSpotlightConnect from './AuthorSpotlightConnect';
import AuthorSpotlightFaqAccordion from './AuthorSpotlightFaqAccordion';
import { SectionHeading } from './utils';
import ContentTagList from '@/components/tags/ContentTagList';
import ReadMoreSection from '@/components/blog/ReadMoreSection';
import CommentsSection from '@/components/comments/CommentsSection';
import ReaderReactions from '@/components/reactions/ReaderReactions';
import NewsletterInlineCta from '@/components/newsletter/NewsletterInlineCta';
import RelatedBookNudge from '@/components/books/RelatedBookNudge';
import type { RelatedBook } from '@/lib/books/related';
import { shopPath, spotlightHasShopLinks } from '@/lib/shopLinks';
import { readTags, spotlightFieldsFromRaw, buildSpotlightAeoPairs } from '@/lib/contentFields';
import { resolveAuthorConnectLinks } from '@/lib/spotlightConnect';

function interleaveNudges(sections: React.ReactNode[], relatedBooks: RelatedBook[]) {
  return sections.flatMap((section, i) => {
    const book = relatedBooks[i];
    if (!book) return [section];
    return [
      section,
      <RelatedBookNudge key={`related-nudge-${book.bookSlug}`} book={book} index={i} />,
    ];
  });
}

export default async function AuthorSpotlightDetail({
  spotlight,
  catalogBooks = [],
  readNextItems = [],
  relatedBooks = [],
}: {
  spotlight: AuthorSpotlightDto;
  catalogBooks?: CatalogBook[];
  readNextItems?: ReadNextItem[];
  relatedBooks?: RelatedBook[];
}) {
  const editorial = spotlightFieldsFromRaw(spotlight);
  const similarAuthors = editorial.similarAuthors ?? [];
  const tags = readTags(spotlight);
  const shopHref = spotlightHasShopLinks(spotlight as unknown as Record<string, unknown>)
    ? shopPath('author-spotlight', spotlight.slug)
    : undefined;

  const hasInterview = (spotlight.interview?.length ?? 0) > 0;
  const hasFaq = (spotlight.faq?.length ?? 0) > 0;
  const showAbout = Boolean(
    spotlight.introduction?.trim() ||
      spotlight.bio?.trim() ||
      buildSpotlightAeoPairs({ name: spotlight.name, tagline: spotlight.tagline, ...editorial }).length
  );
  const showBooks = catalogBooks.length > 0 || Boolean(shopHref);
  const showFeatured = (spotlight.blogLinks?.length ?? 0) > 0;
  const showPairings = (spotlight.readingPairings?.length ?? 0) > 0;
  const showConnect = resolveAuthorConnectLinks(spotlight).length > 0;

  const contentSections: React.ReactNode[] = [];

  if (showAbout) {
    contentSections.push(<AuthorSpotlightAbout key="about" spotlight={spotlight} />);
  }
  if (showBooks) {
    contentSections.push(
      <AuthorSpotlightBooksFromCatalog key="books" books={catalogBooks} shopHref={shopHref} />
    );
  }
  if (showFeatured) {
    contentSections.push(<AuthorSpotlightFeaturedOnSite key="featured" links={spotlight.blogLinks ?? []} />);
  }
  if (showPairings) {
    contentSections.push(
      <AuthorSpotlightReadingPairings key="pairings" pairings={spotlight.readingPairings ?? []} />
    );
  }
  if (hasInterview) {
    contentSections.push(
      <AuthorSpotlightInterview
        key="interview"
        title={spotlight.interviewSectionTitle?.trim() || 'Author interview'}
        authorName={spotlight.name}
        items={spotlight.interview}
      />
    );
  }
  if (showConnect) {
    contentSections.push(<AuthorSpotlightConnect key="connect" spotlight={spotlight} />);
  }
  if (hasFaq) {
    contentSections.push(
      <section key="faq" className="mb-14" aria-labelledby="spotlight-faq">
        <SectionHeading id="spotlight-faq">FAQ</SectionHeading>
        <p className="section-subheading mt-2 mb-6">Questions readers often ask</p>
        <AuthorSpotlightFaqAccordion items={spotlight.faq} idPrefix="faq" />
      </section>
    );
  }

  return (
    <>
      <nav className="mb-6 font-sans text-sm" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-2 text-chai-brown-light">
          <li>
            <Link href="/" className="hover:text-terracotta transition-colors">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/author-spotlight" className="hover:text-terracotta transition-colors">
              Author spotlight
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-chai-brown font-medium truncate max-w-[12rem] sm:max-w-none">
            {spotlight.name}
          </li>
        </ol>
        <Link
          href="/author-spotlight"
          className="mt-3 inline-flex items-center gap-2 text-chai-brown-light hover:text-terracotta transition-colors"
        >
          <ArrowLeft size={16} aria-hidden />
          All authors
        </Link>
      </nav>

      <article itemScope itemType="https://schema.org/Person" className="min-w-0 max-w-full">
        <meta itemProp="name" content={spotlight.name} />

        <AuthorSpotlightHero spotlight={spotlight} />

        {interleaveNudges(contentSections, relatedBooks)}

        <NewsletterInlineCta
          variant="author-spotlight"
          placement="content-author-spotlight"
          contentSlug={spotlight.slug}
        />
        <ReaderReactions contentType="author-spotlight" slug={spotlight.slug} />
        <CommentsSection contentType="author-spotlight" slug={spotlight.slug} />

        <ReadMoreSection variant="author-spotlight" items={readNextItems} />

        <ContentTagList tags={tags} className="mb-6 pt-8 border-t border-chai-brown/10" heading="" />

        {similarAuthors.length > 0 ? (
          <section className="mb-10" aria-labelledby="spotlight-related-authors">
            <SectionHeading id="spotlight-related-authors">Related authors</SectionHeading>
            <p className="section-subheading mt-2 mb-4">Readers who enjoyed this spotlight also explore</p>
            <ul className="space-y-3 font-body text-chai-brown-light">
              {similarAuthors.map((a) => (
                <li key={a.name}>
                  {a.url?.trim() ? (
                    <Link href={a.url.trim()} className="text-terracotta hover:underline font-medium">
                      {a.name}
                    </Link>
                  ) : (
                    <span className="font-medium text-chai-brown">{a.name}</span>
                  )}
                  {a.reason?.trim() ? <span> — {a.reason}</span> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <footer className="pt-8 border-t border-chai-brown/10 text-center">
          <p className="font-body text-chai-brown-light mb-4">Discover more voices we love</p>
          <Link href="/author-spotlight" className="btn-secondary inline-flex items-center gap-2">
            View all author spotlights
          </Link>
        </footer>
      </article>
    </>
  );
}
