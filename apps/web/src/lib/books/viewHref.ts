import type { CatalogBook } from './catalog';
import { shopPath } from '@/lib/shopLinks';

export type BookViewLink = {
  href: string;
  label: string;
};

/** Indexable editorial link for schema / sitemap signals — never points at noindex shop URLs. */
export function resolveBookEditorialLink(book: CatalogBook): BookViewLink {
  const sourceRefs = book.sourceRefs ?? [];
  const reviewRef = sourceRefs.find((r) => r.contentType === 'blog');
  if (reviewRef) {
    return { href: reviewRef.href, label: 'Read review' };
  }

  const listRef = sourceRefs.find((r) => r.contentType === 'recommendations');
  if (listRef) {
    const href = listRef.anchor ? `${listRef.href}#${listRef.anchor}` : listRef.href;
    return { href, label: 'View list' };
  }

  const spotRef = sourceRefs.find((r) => r.contentType === 'author-spotlight');
  if (spotRef) {
    return { href: spotRef.href, label: 'Author spotlight' };
  }

  return { href: '/books', label: 'View book' };
}

/** Shop URL when buy links exist — secondary CTA only (shop pages are noindex). */
export function resolveBookShopHref(book: CatalogBook): string | null {
  const hasShop = (book.purchaseLinks?.length ?? 0) > 0;
  if (!hasShop) return null;

  const sourceRefs = book.sourceRefs ?? [];
  const blogRef = sourceRefs.find((r) => r.contentType === 'blog');
  if (blogRef) return shopPath('review', blogRef.contentSlug);

  const listRef = sourceRefs.find((r) => r.contentType === 'recommendations');
  if (listRef) {
    const base = shopPath('recommendations', listRef.contentSlug);
    return listRef.anchor ? `${base}#${listRef.anchor}` : base;
  }

  const spotRef = sourceRefs.find((r) => r.contentType === 'author-spotlight');
  if (spotRef) {
    const base = shopPath('author-spotlight', spotRef.contentSlug);
    return spotRef.anchor ? `${base}#${spotRef.anchor}` : base;
  }

  return null;
}

/** Primary UI link — always editorial (indexable) so /books passes link equity correctly. */
export function resolveBookViewLink(book: CatalogBook): BookViewLink {
  return resolveBookEditorialLink(book);
}
