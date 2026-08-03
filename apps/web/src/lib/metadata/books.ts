import { resolveListingSocialImage } from './socialImage';
import { resolvePageMetadata } from './resolve';

export function resolveBooksDirectoryMetadata(bookCount?: number) {
  const countHint =
    typeof bookCount === 'number' && bookCount > 0
      ? ` Browse ${bookCount}+ books reviewed, recommended, and featured on the site.`
      : '';

  return resolvePageMetadata({
    path: '/books',
    seoTitle: 'Books Directory — Chapters.aur.Chai',
    contentTitle: 'Books Featured on Chapters.Aur.Chai',
    fallbackTitle: 'Books Featured on Chapters.Aur.Chai',
    seoDescription: `Discover books reviewed, recommended, discussed, and featured across Chapters.aur.Chai.${countHint} Search by title, author, or genre.`,
    excerpt:
      'A searchable directory of every book mentioned in our reviews, recommendation lists, author spotlights, and shop.',
    fallbackDescription:
      'Discover books reviewed, recommended, discussed, and featured across Chapters.aur.Chai — your central book knowledge base for readers in India, UAE, and worldwide.',
    keywords: [
      'books directory',
      'book catalog',
      'book reviews',
      'book recommendations',
      'author spotlight books',
      'Chapters.aur.Chai',
      'Indian book blog',
      'book discovery',
    ],
    type: 'website',
    image: resolveListingSocialImage({
      title: 'Books Directory',
      category: 'Book Catalog',
    }),
  });
}
