'use client';

import ReadNextCard from './ReadNextCard';
import type { ReadNextItem, ReadNextVariant } from '@/lib/readNext';

const SECTION_HEADINGS: Record<ReadNextVariant, string> = {
  blog: 'Read next',
  recommendations: 'Explore more',
  musings: 'Read next',
  'author-spotlight': 'More authors to explore',
};

interface ReadMoreSectionProps {
  variant: ReadNextVariant;
  items: ReadNextItem[];
}

export default function ReadMoreSection({ variant, items }: ReadMoreSectionProps) {
  if (!items.length) return null;

  return (
    <section className="mb-12 pt-10 border-t border-chai-brown/10" aria-label={SECTION_HEADINGS[variant]}>
      <h2 className="font-serif text-2xl text-chai-brown mb-6">{SECTION_HEADINGS[variant]}</h2>
      <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {items.map((item) => (
          <li key={item.slug} className="h-full animate-fade-in-up">
            <ReadNextCard item={item} variant={variant} />
          </li>
        ))}
      </ul>
    </section>
  );
}
