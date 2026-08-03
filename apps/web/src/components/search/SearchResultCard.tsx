'use client';

import Link from 'next/link';
import type { SearchGroup, SearchResultItem } from '@/lib/search';
import { SEARCH_GROUP_LABELS } from '@/lib/search';

const GROUP_STYLE: Record<
  SearchGroup,
  { badge: string; accent: string }
> = {
  reviews: {
    badge: 'bg-terracotta/12 text-terracotta border-terracotta/25',
    accent: 'border-l-terracotta',
  },
  recommendations: {
    badge: 'bg-sage/12 text-sage border-sage/25',
    accent: 'border-l-sage',
  },
  musings: {
    badge: 'bg-chai-brown/10 text-chai-brown border-chai-brown/20',
    accent: 'border-l-chai-brown-light',
  },
  'author-spotlight': {
    badge: 'bg-amber-700/10 text-amber-800 border-amber-700/20',
    accent: 'border-l-amber-600',
  },
  shop: {
    badge: 'bg-terracotta/8 text-chai-brown border-terracotta/20',
    accent: 'border-l-terracotta/70',
  },
};

type Props = {
  item: SearchResultItem;
  onNavigate?: () => void;
};

export default function SearchResultCard({ item, onNavigate }: Props) {
  const style = GROUP_STYLE[item.group];

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`flex flex-col gap-1 rounded-lg border border-chai-brown/12 bg-white/80 px-3 py-3 sm:px-4 sm:py-3.5 border-l-[3px] ${style.accent} hover:border-terracotta/35 hover:bg-cream-light hover:shadow-sm transition-all`}
    >
      <span
        className={`self-start text-[10px] sm:text-xs font-sans font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${style.badge}`}
      >
        {SEARCH_GROUP_LABELS[item.group]}
      </span>
      <span className="font-serif text-sm sm:text-base text-chai-brown leading-snug">{item.title}</span>
      {item.subtitle ? (
        <span className="font-body text-xs text-chai-brown-light">{item.subtitle}</span>
      ) : item.excerpt ? (
        <span className="font-body text-xs text-chai-brown-light line-clamp-1">{item.excerpt}</span>
      ) : null}
    </Link>
  );
}
