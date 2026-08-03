import { buildBookSchema } from '@/lib/schema/book';
import { canonicalUrl } from '@/lib/seo';
import type { CatalogBook } from '@/lib/books/catalog';
import { bookPath } from '@/lib/books/registry';

/** Prepare Book JSON-LD for future /books/[slug] pages. */
export function catalogBookSchema(book: CatalogBook) {
  return buildBookSchema({
    name: book.title,
    author: book.author,
    image: book.coverImage,
    genre: book.genre,
    isbn: book.isbn,
    description: book.description,
    url: canonicalUrl(bookPath(book.bookSlug)),
    sameAs: [
      ...(book.goodreadsUrl ? [book.goodreadsUrl] : []),
      ...book.purchaseLinks.map((l) => l.url),
    ].filter((u, i, a) => a.indexOf(u) === i),
    offers: book.purchaseLinks
      .filter((l) => l.channel !== 'goodreads')
      .map((l) => ({ url: l.url, seller: l.label })),
  });
}
