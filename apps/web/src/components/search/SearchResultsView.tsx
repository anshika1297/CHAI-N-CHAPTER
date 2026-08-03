'use client';

import Link from 'next/link';
import type { SearchResponse } from '@/lib/search';
import { SEARCH_GROUP_LABELS, SEARCH_GROUP_ORDER } from '@/lib/search';
import SearchResultCard from './SearchResultCard';

type Props = {
  results: SearchResponse | null;
  loading?: boolean;
  query: string;
  compact?: boolean;
  onNavigate?: () => void;
  showEmptyHint?: boolean;
};

export default function SearchResultsView({
  results,
  loading,
  query,
  compact = false,
  onNavigate,
  showEmptyHint = true,
}: Props) {
  if (!query.trim() || query.trim().length < 2) {
    if (!showEmptyHint) return null;
    return (
      <p className="font-body text-sm text-chai-brown-light px-2 py-3">
        Type at least 2 characters to search reviews, books, authors, and tags.
      </p>
    );
  }

  if (loading) {
    return (
      <div className="px-2 py-8 text-center">
        <div className="inline-flex items-center gap-2 font-body text-sm text-chai-brown-light">
          <span className="h-4 w-4 rounded-full border-2 border-terracotta/30 border-t-terracotta animate-spin" />
          Searching…
        </div>
      </div>
    );
  }

  if (!results || results.total === 0) {
    return (
      <p className="font-body text-sm text-chai-brown-light px-2 py-6 text-center">
        No results for &ldquo;{query}&rdquo;. Try a book title, author, or tag.
      </p>
    );
  }

  return (
    <div className={compact ? 'space-y-5 py-1' : 'space-y-8 py-2'}>
      {results.tags.length > 0 ? (
        <section aria-label="Matching tags" className="px-1">
          <h3 className="text-xs font-sans font-semibold uppercase tracking-wide text-chai-brown/60 mb-2.5">
            Matching tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {results.tags.map((tag) => (
              <Link
                key={tag.slug}
                href={tag.href}
                onClick={onNavigate}
                className="rounded-full border border-terracotta/25 bg-terracotta/8 px-3 py-1.5 text-sm font-body text-chai-brown hover:bg-terracotta/15 transition-colors"
              >
                #{tag.label}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {SEARCH_GROUP_ORDER.map((group) => {
        const items = results.groups[group];
        if (!items?.length) return null;
        return (
          <section key={group} aria-label={SEARCH_GROUP_LABELS[group]} className="px-1">
            <h3 className="text-xs font-sans font-semibold uppercase tracking-wide text-chai-brown/60 mb-2.5 flex items-center gap-2">
              <span>{SEARCH_GROUP_LABELS[group]}</span>
              <span className="text-chai-brown-light font-normal normal-case tracking-normal">
                ({items.length})
              </span>
            </h3>
            <ul className={`grid gap-2 ${compact ? '' : 'sm:grid-cols-2 sm:gap-3'}`}>
              {items.map((item) => (
                <li key={item.id}>
                  <SearchResultCard item={item} onNavigate={onNavigate} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
