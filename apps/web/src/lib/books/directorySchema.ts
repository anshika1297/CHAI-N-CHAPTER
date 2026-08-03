import { canonicalUrl, siteConfig } from '@/lib/seo';
import { buildBreadcrumbSchema } from '@/lib/schema/webPage';
import { buildBookSchema } from '@/lib/schema/book';
import { getImageUrl } from '@/lib/api';
import { resolveBookEditorialLink } from '@/lib/books/viewHref';
import type { DirectoryBook } from '@/lib/books/directory';
import type { JsonLdObject } from '@/lib/schema/types';

const SCHEMA_CONTEXT = 'https://schema.org';

/** CollectionPage + ItemList + sample Book entities for /books. */
export function buildBooksDirectorySchemas(books: DirectoryBook[]): JsonLdObject[] {
  const url = canonicalUrl('/books');
  const itemListElement = books.slice(0, 50).map((book, i) => {
    const shopLink = resolveBookEditorialLink(book);
    return {
      '@type': 'ListItem',
      position: i + 1,
      name: book.title,
      url: canonicalUrl(shopLink.href),
      item: {
        '@type': 'Book',
        name: book.title,
        author: book.author
          ? { '@type': 'Person', name: book.author }
          : undefined,
        genre: book.genre || undefined,
        image: book.coverImage ? getImageUrl(book.coverImage) : undefined,
        url: canonicalUrl(shopLink.href),
      },
    };
  });

  const schemas: JsonLdObject[] = [
    {
      '@context': SCHEMA_CONTEXT,
      '@type': 'CollectionPage',
      '@id': url,
      name: 'Books Featured on Chapters.Aur.Chai',
      description:
        'Discover books reviewed, recommended, discussed, and featured across Chapters.aur.Chai.',
      url,
      inLanguage: 'en-IN',
      isPartOf: {
        '@type': 'WebSite',
        name: siteConfig.name,
        url: siteConfig.url,
      },
      mainEntity: {
        '@type': 'ItemList',
        name: 'Books on Chapters.aur.Chai',
        numberOfItems: books.length,
        itemListElement,
      },
    },
    buildBreadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Books', path: '/books' },
    ]),
  ];

  for (const book of books.slice(0, 12)) {
    const shopLink = resolveBookEditorialLink(book);
    schemas.push(
      buildBookSchema({
        name: book.title,
        author: book.author,
        image: book.coverImage,
        genre: book.genre,
        isbn: book.isbn,
        description: book.description,
        url: canonicalUrl(shopLink.href),
        sameAs: [
          ...(book.goodreadsUrl ? [book.goodreadsUrl] : []),
          ...(book.purchaseLinks ?? []).map((l) => l.url),
        ].filter((u, i, a) => a.indexOf(u) === i),
      })
    );
  }

  return schemas;
}
