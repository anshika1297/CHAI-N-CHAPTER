import { getFetchBaseUrl } from '@/lib/apiBase';
import type { CatalogBook } from '@/lib/books/catalog';
import { parseShopLinkChannel } from '@/lib/shop/sanitize';
import type { ShopBookMeta, ShopPurchaseLink } from '@/lib/shop/types';

export type CatalogAutofillPatch = {
  shopLinks: ShopPurchaseLink[];
  shopBook?: ShopBookMeta;
  bookLink?: string;
  coverImage?: string;
};

/** Client-side lookup against the public book catalog (shop links live here). */
export async function lookupCatalogBookClient(
  title: string,
  author: string
): Promise<CatalogBook | null> {
  const t = title.trim();
  const a = author.trim();
  if (!t || !a) return null;
  try {
    const params = new URLSearchParams({ title: t, author: a });
    const res = await fetch(`${getFetchBaseUrl()}/api/books/lookup?${params}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { book?: CatalogBook | null };
    return data.book ?? null;
  } catch {
    return null;
  }
}

export function catalogBookToAutofillPatch(book: CatalogBook): CatalogAutofillPatch {
  const shopLinks: ShopPurchaseLink[] = (book.purchaseLinks ?? [])
    .map((l) => {
      const label = (l.label || '').trim();
      const url = (l.url || '').trim();
      if (!label || !url) return null;
      const channel = parseShopLinkChannel(l.channel);
      const row: ShopPurchaseLink = { label, url };
      if (channel) row.channel = channel;
      return row;
    })
    .filter((l): l is ShopPurchaseLink => Boolean(l));

  const shopBook: ShopBookMeta = {};
  if (book.title) shopBook.title = book.title;
  if (book.author) shopBook.author = book.author;
  if (book.genre) shopBook.genre = book.genre;
  if (book.coverImage) shopBook.coverImage = book.coverImage;
  if (book.isbn) shopBook.isbn = book.isbn;
  if (book.bookSlug) shopBook.bookSlug = book.bookSlug;

  const patch: CatalogAutofillPatch = {
    shopLinks,
    shopBook: Object.keys(shopBook).length ? shopBook : undefined,
  };
  if (book.goodreadsUrl?.trim()) patch.bookLink = book.goodreadsUrl.trim();
  if (book.coverImage?.trim()) patch.coverImage = book.coverImage.trim();
  return patch;
}
