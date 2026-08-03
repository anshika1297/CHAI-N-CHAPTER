/**
 * Universal tagging contract — tags stored on each content document:
 * - Page.content posts (blog, recommendations, musings): item.tags: string[]
 * - AuthorSpotlight: tags: string[]
 * Shop entries inherit tags from their parent content (no separate storage).
 */

export type TaggedContentKind =
  | 'review'
  | 'recommendation'
  | 'musing'
  | 'author-spotlight'
  | 'shop-review'
  | 'shop-recommendation'
  | 'shop-spotlight';

export type TagIndexEntry = {
  slug: string;
  label: string;
  count: number;
};

export type TaggedContentRef = {
  kind: TaggedContentKind;
  slug: string;
  title: string;
  excerpt?: string;
  href: string;
  tags: string[];
  image?: string;
};

export type TagDetail = {
  slug: string;
  label: string;
  count: number;
  items: TaggedContentRef[];
  topicClusters: string[];
  relatedTags: TagIndexEntry[];
};
