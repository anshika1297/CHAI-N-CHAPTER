'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { AuthorSpotlightQaItem } from '@/lib/api';

export default function AuthorSpotlightFaqAccordion({
  items,
  idPrefix,
}: {
  items: AuthorSpotlightQaItem[];
  idPrefix: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        const buttonId = `${idPrefix}-q-${i}`;
        const panelId = `${idPrefix}-a-${i}`;
        return (
          <div
            key={i}
            className="rounded-xl border border-chai-brown/10 bg-cream-light overflow-hidden shadow-sm"
          >
            <button
              type="button"
              id={buttonId}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left font-body font-medium text-chai-brown hover:bg-cream/80 transition-colors"
            >
              <span>{item.question}</span>
              <ChevronDown
                size={20}
                className={`shrink-0 text-terracotta transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                aria-hidden
              />
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className={isOpen ? 'block' : 'hidden'}
            >
              <p className="px-5 pb-5 pt-0 font-body text-chai-brown-light leading-relaxed whitespace-pre-wrap border-t border-chai-brown/5">
                {item.answer}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
