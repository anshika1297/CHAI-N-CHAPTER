/** Universal tagging — shared types for CMS, API, routes, and future topic clustering. */

export type EditorialContentKind = 'review' | 'recommendation' | 'musing' | 'author-spotlight';

export type ShopContentKind = 'shop-review' | 'shop-recommendation' | 'shop-spotlight';

export type TaggedContentKind = EditorialContentKind | ShopContentKind;

export type TagIndexEntry = {
  slug: string;
  label: string;
  /** Published items (editorial + shop) carrying this tag */
  count: number;
};

export type TaggedContentRef = {
  kind: TaggedContentKind;
  slug: string;
  title: string;
  excerpt?: string;
  href: string;
  tags: string[];
  /** Cover / profile image path from CMS (resolved via getImageUrl). */
  image?: string;
};

export type TagDetail = {
  slug: string;
  label: string;
  count: number;
  items: TaggedContentRef[];
  /** Topic hub slugs this tag belongs to (future clustering). */
  topicClusters: string[];
  /** Co-occurring tags on the same content set. */
  relatedTags: TagIndexEntry[];
};
