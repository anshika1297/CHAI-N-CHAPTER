import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import TagHubListItem from '@/components/tags/TagHubListItem';
import type { TaggedContentRef } from '@/lib/tags';

const KIND_LABELS: Record<TaggedContentRef['kind'], string> = {
  review: 'Book Review',
  recommendation: 'Book Recommendations',
  musing: 'Musing',
  'author-spotlight': 'Author Spotlight',
  'shop-review': 'Shop — Book Review',
  'shop-recommendation': 'Shop — Book List',
  'shop-spotlight': 'Shop — Author Spotlight',
};

type Props = {
  id: string;
  title: string;
  items: TaggedContentRef[];
  viewAllHref?: string;
  viewAllLabel?: string;
  emptyMessage?: string;
};

export default function GenreContentSection({
  id,
  title,
  items,
  viewAllHref,
  viewAllLabel = 'View all',
  emptyMessage,
}: Props) {
  if (!items.length && !emptyMessage) return null;

  return (
    <section className="mb-12 sm:mb-14" aria-labelledby={id}>
      <div className="flex items-end justify-between gap-4 mb-5 sm:mb-6">
        <h2 id={id} className="font-serif text-xl sm:text-2xl text-chai-brown">
          {title}
        </h2>
        {viewAllHref && items.length ? (
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-1 font-sans text-sm font-medium text-terracotta hover:gap-1.5 transition-all shrink-0"
          >
            {viewAllLabel}
            <ArrowRight size={14} aria-hidden />
          </Link>
        ) : null}
      </div>

      {items.length ? (
        <ul className="space-y-3">
          {items.slice(0, 6).map((item) => (
            <li key={`${item.kind}-${item.slug}`}>
              <TagHubListItem item={item} kindLabel={KIND_LABELS[item.kind]} />
            </li>
          ))}
        </ul>
      ) : emptyMessage ? (
        <p className="font-body text-sm text-chai-brown-light">{emptyMessage}</p>
      ) : null}
    </section>
  );
}
