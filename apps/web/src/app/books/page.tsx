import { buildMetadata } from '@/lib/metadata';
import { resolveBooksDirectoryMetadata } from '@/lib/metadata/books';
import { fetchBookDirectory, BOOKS_DIRECTORY_PAGE_SIZE } from '@/lib/books/directory';
import { buildBooksDirectorySchemas } from '@/lib/books/directorySchema';
import PageJsonLd from '@/components/schema/PageJsonLd';
import BooksDirectory from '@/components/books/BooksDirectory';
import ExploreHubLinks from '@/components/content/ExploreHubLinks';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  try {
    const { total } = await fetchBookDirectory({ limit: 1, includeFacets: false, revalidate: 300 });
    return buildMetadata(resolveBooksDirectoryMetadata(total));
  } catch {
    return buildMetadata(resolveBooksDirectoryMetadata());
  }
}

type PageProps = {
  searchParams?: { genre?: string; page?: string };
};

export default async function BooksDirectoryPage({ searchParams }: PageProps) {
  const initialGenre = searchParams?.genre?.trim() ?? '';
  const page = Math.max(1, parseInt(searchParams?.page ?? '1', 10) || 1);

  let books: Awaited<ReturnType<typeof fetchBookDirectory>>['books'] = [];
  let total = 0;
  let facets: Awaited<ReturnType<typeof fetchBookDirectory>>['facets'];
  let totalPages = 1;

  try {
    const result = await fetchBookDirectory({
      limit: BOOKS_DIRECTORY_PAGE_SIZE,
      page,
      sort: 'az',
      includeFacets: true,
      revalidate: 300,
      genre: initialGenre || undefined,
    });
    books = result.books;
    total = result.total;
    facets = result.facets;
    totalPages = result.totalPages;
  } catch {
    /* client component will fetch /api/books/directory as fallback */
  }

  let schemas: ReturnType<typeof buildBooksDirectorySchemas> = [];
  try {
    schemas = buildBooksDirectorySchemas(books);
  } catch {
    /* page still renders without JSON-LD */
  }

  return (
    <main className="pt-28 pb-16 min-h-screen">
      <PageJsonLd schemas={schemas} />
      <div className="site-container">
        <header className="text-center mb-10 sm:mb-12 max-w-3xl mx-auto">
          <p className="font-sans text-xs uppercase tracking-[0.2em] text-terracotta mb-3">Book knowledge base</p>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-chai-brown mb-4">
            Books Featured on Chapters.Aur.Chai
          </h1>
          <p className="font-body text-base sm:text-lg text-chai-brown-light leading-relaxed">
            Discover books reviewed, recommended, discussed, and featured across Chapters.Aur.Chai.
          </p>
          {total > 0 ? (
            <p className="mt-3 font-sans text-sm text-chai-brown/70">
              {total} {total === 1 ? 'book' : 'books'} in the directory
            </p>
          ) : null}
        </header>

        <BooksDirectory
          books={books}
          facets={facets}
          total={total}
          page={page}
          totalPages={totalPages}
          initialGenre={initialGenre}
        />

        <ExploreHubLinks intro="Browse by genre, topic, or tag — or explore the full books directory." />
      </div>
    </main>
  );
}
