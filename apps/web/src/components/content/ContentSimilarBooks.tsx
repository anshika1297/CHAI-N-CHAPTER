import Link from 'next/link';
import type { SimilarBookRef } from '@/lib/contentFields';

type Props = {
  books: SimilarBookRef[];
  heading?: string;
  /** Reviewed book title — used for a clearer “if you loved these → read this” heading. */
  bookTitle?: string;
};

function resolveHeading(heading: string | undefined, bookTitle?: string): string {
  if (heading?.trim()) return heading.trim();
  const title = bookTitle?.trim();
  if (title) {
    return `If you loved any of these, you'll want to read ${title}`;
  }
  return 'If you loved any of these, this book is for you';
}

export default function ContentSimilarBooks({ books, heading, bookTitle }: Props) {
  const valid = books.filter((b) => b.title.trim());
  if (!valid.length) return null;

  const sectionHeading = resolveHeading(heading, bookTitle);

  return (
    <section className="mb-8 border-t border-chai-brown/10 pt-8" aria-labelledby="similar-books-heading">
      <h2 id="similar-books-heading" className="font-serif text-xl text-chai-brown mb-4">
        {sectionHeading}
      </h2>
      <ul className="space-y-3">
        {valid.map((b) => (
          <li key={`${b.title}-${b.author ?? ''}`} className="font-body text-chai-brown-light">
            {b.internalUrl?.trim() ? (
              <Link href={b.internalUrl.trim()} className="text-terracotta hover:underline font-medium">
                {b.title}
              </Link>
            ) : (
              <span className="font-medium text-chai-brown">{b.title}</span>
            )}
            {b.author?.trim() && <span className="text-chai-brown-light"> — {b.author}</span>}
            {b.note?.trim() && <p className="text-sm mt-0.5">{b.note}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
