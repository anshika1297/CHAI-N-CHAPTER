import Link from 'next/link';
import type { TaggedContentRef } from '@/lib/tags';
import { tagPath } from '@/lib/tags';
import { getTopicHubBySlug } from '@/lib/metadata/topicHubs';
import TagHubListItem from './TagHubListItem';

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
  topicClusters?: string[];
  relatedTags?: { slug: string; label: string; count: number }[];
  emptyMessage?: string;
};

export default function TagHubView({
  heading,
  description,
  items,
  topicClusters = [],
  relatedTags = [],
  emptyMessage,
}: Props) {
  return (
    <div className="w-full">
      <header className="mb-10">
        <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown mb-3">{heading}</h1>
        {description ? (
          <p className="font-body text-chai-brown-light text-base sm:text-lg leading-relaxed">{description}</p>
        ) : null}
      </header>

      {topicClusters.length > 0 ? (
        <section className="mb-8" aria-label="Related topic hubs">
          <p className="text-sm font-sans font-medium text-chai-brown mb-2">Related topics</p>
          <div className="flex flex-wrap gap-2">
            {topicClusters.map((clusterSlug) => {
              const hub = getTopicHubBySlug(clusterSlug);
              return (
                <Link
                  key={clusterSlug}
                  href={`/topics/${clusterSlug}`}
                  className="rounded-full border border-sage/40 bg-cream-light px-3 py-1 text-sm font-body text-chai-brown hover:border-terracotta transition-colors"
                >
                  {hub?.title ?? clusterSlug}
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {relatedTags.length > 0 ? (
        <section className="mb-8" aria-label="Related tags">
          <p className="text-sm font-sans font-medium text-chai-brown mb-2">Related tags</p>
          <div className="flex flex-wrap gap-2">
            {relatedTags.map((tag) => (
              <Link
                key={tag.slug}
                href={tagPath(tag.slug)}
                className="inline-flex items-center gap-1 rounded-full border border-chai-brown/15 bg-cream-light px-3 py-1 text-sm font-body text-chai-brown hover:border-terracotta transition-colors"
              >
                {tag.label}
                <span className="text-chai-brown-light text-xs">({tag.count})</span>
              </Link>
            ))}
          </div>
        </section>
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
    </div>
  );
}
