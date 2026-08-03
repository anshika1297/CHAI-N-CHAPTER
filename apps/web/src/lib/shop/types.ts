/** Preset purchase channels — optional on each shop link row. */
export type ShopLinkChannel =
  | 'amazon-in'
  | 'amazon-uae'
  | 'publisher'
  | 'goodreads'
  | 'flipkart'
  | 'other';

export type ShopPurchaseLink = {
  label: string;
  url: string;
  channel?: ShopLinkChannel;
};

/** Optional shop-specific metadata (overrides editorial fields when set). */
export type ShopBookMeta = {
  title?: string;
  author?: string;
  genre?: string;
  coverImage?: string;
  isbn?: string;
  /** Reserved for future /books/[slug] — not routed yet. */
  bookSlug?: string;
};

export type ShopEditorialRef = {
  kind: 'review' | 'recommendations' | 'author-spotlight';
  slug: string;
  title: string;
  href: string;
};

/** Canonical resolved book for shop UI, schema, and future registry. */
export type ResolvedShopBook = {
  bookSlug?: string;
  title: string;
  author: string;
  genre?: string;
  coverImage?: string;
  isbn?: string;
  purchaseLinks: ShopPurchaseLink[];
  goodreadsUrl?: string;
  editorial: ShopEditorialRef;
  tags: string[];
};
