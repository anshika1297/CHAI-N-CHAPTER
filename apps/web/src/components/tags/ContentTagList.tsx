import Link from 'next/link';
import { tagPathFromLabel } from '@/lib/tags';

type Props = {
  tags: string[];
  className?: string;
  heading?: string;
};

/** Linked tag pills — routes to /tags/[slug] */
export default function ContentTagList({ tags, className = '', heading = 'Tags' }: Props) {
  const valid = [...new Set(tags.map((t) => t.trim().toLowerCase()).filter(Boolean))];
  if (!valid.length) return null;

  return (
    <section className={`mb-8 pt-4 ${className}`} aria-label={heading || 'Tags'}>
      <div className="flex flex-wrap items-center gap-2">
        {heading ? <span className="text-sm font-sans font-medium text-chai-brown mr-1">{heading}:</span> : null}
        {valid.map((tag) => (
          <Link
            key={tag}
            href={tagPathFromLabel(tag)}
            className="bg-cream-light text-chai-brown text-xs font-sans px-3 py-1 rounded-full border border-chai-brown/20 hover:border-terracotta hover:text-terracotta transition-colors"
          >
            {tag}
          </Link>
        ))}
      </div>
    </section>
  );
}
