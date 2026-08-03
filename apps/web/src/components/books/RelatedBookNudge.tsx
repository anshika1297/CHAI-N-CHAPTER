import Link from 'next/link';
import type { BookSuggestion } from '@/lib/books/nudgeSuggestions';
import type { RelatedBook } from '@/lib/books/related';
import { resolveBookViewLink } from '@/lib/books/viewHref';

const LEADS = [
  'While you’re here —',
  'You might also enjoy —',
  'Another title from our shelves —',
  'Keep exploring with —',
  'From our library —',
  'Worth a look —',
] as const;

type Props = {
  index?: number;
} & (
  | { book: RelatedBook; suggestion?: never }
  | { suggestion: BookSuggestion; book?: never }
);

/** Single related-book aside — subtle interstitial between content sections. */
export default function RelatedBookNudge({ book, suggestion, index = 0 }: Props) {
  const lead = LEADS[index % LEADS.length];

  const title = suggestion?.title ?? book!.title;
  const author = (suggestion?.author ?? book!.author)?.trim();
  const href = suggestion?.href ?? resolveBookViewLink(book!).href;

  return (
    <aside
      className="my-8 sm:my-10 py-3.5 px-4 sm:px-5 rounded-r-lg border-l-2 border-sage/35 bg-cream-light/40"
      aria-label={`Related book: ${title}`}
    >
      <p className="font-body text-sm sm:text-[0.9375rem] text-chai-brown-light leading-relaxed">
        <span className="text-chai-brown/65">{lead} </span>
        <Link href={href} className="text-terracotta hover:underline font-medium">
          {title}
        </Link>
        {author ? (
          <>
            {' '}
            <span className="text-chai-brown/55">by {author}</span>
          </>
        ) : null}
      </p>
    </aside>
  );
}
