import type { TaggedContentRef } from '@/lib/tags';
import TagHubListItem from '@/components/tags/TagHubListItem';
import NewsletterSection from '@/components/newsletter/NewsletterSection';
import ReadingPathView from '@/components/reading-paths/ReadingPathView';
import type { ResolvedReadingPath } from '@/lib/readingPaths/types';

const KIND_LABELS: Record<TaggedContentRef['kind'], string> = {
  review: 'Review',
  recommendation: 'Recommendations',
  musing: 'Musing',
  'author-spotlight': 'Author Spotlight',
  'shop-review': 'Shop',
  'shop-recommendation': 'Shop',
  'shop-spotlight': 'Shop',
};

type Props = {
  heading: string;
  description?: string;
  items: TaggedContentRef[];
  emptyMessage?: string;
  hubSlug?: string;
  readingPath?: ResolvedReadingPath | null;
};

export default function TaxonomyHubView({
  heading,
  description,
  items,
  emptyMessage,
  hubSlug,
  readingPath,
}: Props) {
  return (
    <div className="w-full">
      <header className="mb-10">
        <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown mb-3">{heading}</h1>
        {description ? (
          <p className="font-body text-chai-brown-light text-base sm:text-lg leading-relaxed">{description}</p>
        ) : null}
      </header>

      {readingPath ? (
        <div className="mb-12 sm:mb-14 pb-12 sm:pb-14 border-b border-chai-brown/10">
          <ReadingPathView path={readingPath} />
        </div>
      ) : null}

      {items.length === 0 ? (
        <p className="font-body text-chai-brown-light">{emptyMessage ?? 'No published content yet.'}</p>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={`${item.kind}-${item.slug}`}>
              <TagHubListItem item={item} kindLabel={KIND_LABELS[item.kind]} />
            </li>
          ))}
        </ul>
      )}

      <div className="mt-14 sm:mt-16">
        <NewsletterSection
          variant="topic-hub"
          placement="inline-topic-hub"
          topicTitle={heading}
          contentSlug={hubSlug}
        />
      </div>
    </div>
  );
}
