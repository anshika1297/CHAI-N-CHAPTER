import Link from 'next/link';
import type { ReadNextItem, ReadNextVariant } from '@/lib/readNext';

const BASE_PATH: Record<ReadNextVariant, string> = {
  blog: '/blog',
  recommendations: '/recommendations',
  musings: '/musings',
  'author-spotlight': '/author-spotlight',
};

const MUSING_LEADS = [
  'Another musing for you —',
  'From Her Musings Verse —',
  'Keep reading —',
  'You might also like —',
  'A little more to sit with —',
  'Worth your next cup of chai —',
] as const;

type Props = {
  item: ReadNextItem;
  variant: ReadNextVariant;
  index?: number;
};

/** One-line related content nudge — no image (musings, etc.). */
export default function ReadNextNudge({ item, variant, index = 0 }: Props) {
  const href = `${BASE_PATH[variant]}/${encodeURIComponent(item.slug)}`;
  const leads = variant === 'musings' ? MUSING_LEADS : MUSING_LEADS;
  const lead = leads[index % leads.length];

  return (
    <aside
      className="my-8 sm:my-10 py-3.5 px-4 sm:px-5 rounded-r-lg border-l-2 border-sage/35 bg-cream-light/40"
      aria-label={`Related: ${item.title}`}
    >
      <p className="font-body text-sm sm:text-[0.9375rem] text-chai-brown-light leading-relaxed">
        <span className="text-chai-brown/65">{lead} </span>
        <Link href={href} className="text-terracotta hover:underline font-medium">
          {item.title}
        </Link>
        {item.category?.trim() ? (
          <span className="text-chai-brown/55"> · {item.category.trim()}</span>
        ) : null}
      </p>
    </aside>
  );
}
