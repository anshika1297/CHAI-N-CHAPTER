import Link from 'next/link';
import type { GroupedBookSources } from '@/lib/books/groupSources';

type Props = {
  sources: GroupedBookSources;
  compact?: boolean;
};

function RefList({ label, refs }: { label: string; refs: GroupedBookSources['reviewedIn'] }) {
  if (!refs.length) return null;
  return (
    <div>
      <p className="font-sans text-[10px] uppercase tracking-wide text-chai-brown/60 mb-1.5">{label}</p>
      <ul className="space-y-1">
        {refs.map((ref) => {
          const href = ref.anchor ? `${ref.href}#${ref.anchor}` : ref.href;
          return (
            <li key={`${ref.contentType}-${ref.contentSlug}-${ref.anchor ?? ''}`}>
              <Link
                href={href}
                className="font-body text-xs sm:text-sm text-chai-brown hover:text-terracotta transition-colors line-clamp-2"
              >
                {ref.contentTitle}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function BookSourceReferences({ sources, compact = false }: Props) {
  return (
    <div className={compact ? 'space-y-3' : 'grid sm:grid-cols-3 gap-4 sm:gap-6'}>
      <RefList label="Reviewed in" refs={sources.reviewedIn} />
      <RefList label="Recommended in" refs={sources.recommendedIn} />
      <RefList label="Featured in" refs={sources.featuredIn} />
    </div>
  );
}
