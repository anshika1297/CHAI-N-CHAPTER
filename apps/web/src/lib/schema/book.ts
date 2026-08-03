import { SCHEMA_CONTEXT, compact, absImage } from './utils';
import type { BookInput, JsonLdObject } from './types';

/** Standalone Book schema — used on shop pages and nested in reviews. */
export function buildBookSchema(book: BookInput): JsonLdObject {
  return compact({
    '@context': SCHEMA_CONTEXT,
    '@type': 'Book',
    name: book.name,
    author: book.author
      ? { '@type': 'Person', name: book.author }
      : undefined,
    image: absImage(book.image),
    url: book.url,
    isbn: book.isbn,
    genre: book.genre,
    description: book.description,
    sameAs: book.sameAs?.filter(Boolean),
    offers: book.offers?.length
      ? book.offers.map((o) =>
          compact({
            '@type': 'Offer',
            url: o.url,
            availability: 'https://schema.org/InStock',
            seller: o.seller ? { '@type': 'Organization', name: o.seller } : undefined,
          })
        )
      : undefined,
    subjectOf: book.subjectOf
      ? compact({
          '@type': 'Article',
          name: book.subjectOf.name,
          url: book.subjectOf.url,
        })
      : undefined,
  });
}

/** Multiple books (shop list / recommendation shop page). */
export function buildBookListSchema(books: BookInput[]): JsonLdObject[] {
  return books.filter((b) => b.name.trim()).map((b) => buildBookSchema(b));
}
