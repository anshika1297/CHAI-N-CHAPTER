import type { MetadataParams } from '@/lib/seo';

/** Publishable content silos supported by the metadata system. */
export type ContentKind = 'review' | 'recommendation' | 'musing' | 'author-spotlight';

export type ShopKind = 'review' | 'recommendations' | 'author-spotlight';

/** Fully resolved metadata for a single URL — all social fields explicit. */
export type ResolvedPageMetadata = {
  title: string;
  description: string;
  canonical: string;
  openGraphTitle: string;
  openGraphDescription: string;
  openGraphImage: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  keywords: string[];
  type: 'website' | 'article' | 'profile';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  noIndex?: boolean;
};

export type ContentResolveInput = {
  kind: ContentKind;
  slug: string;
  raw: Record<string, unknown>;
  /** Static fallback from content.ts when API is unreachable. */
  staticFallback?: {
    title?: string;
    description?: string;
    image?: string;
    publishedTime?: string;
    author?: string;
    keywords?: string[];
  };
};

export type TaxonomyItemRef = {
  kind: ContentKind;
  slug: string;
  title: string;
  excerpt?: string;
  href: string;
};

export type TagIndexEntry = {
  slug: string;
  label: string;
  count: number;
};

export type TopicHubDefinition = {
  slug: string;
  title: string;
  description: string;
  /** Match content whose tags include any of these (lowercase). */
  tags?: string[];
  /** Match review/recommendation/musing category (case-insensitive). */
  categories?: string[];
  /** Match musing themes (case-insensitive). */
  themes?: string[];
  /** Match author spotlight genres (case-insensitive). */
  genres?: string[];
};

/** Pillar page for a book genre — /genres/[slug]. */
export type GenreHubDefinition = {
  slug: string;
  title: string;
  description: string;
  /** Hero H1 suffix, e.g. "Books" → "Indian Mythology Books". */
  titleSuffix?: string;
  /** Match CMS `genres[]` and spotlight genres. */
  genres?: string[];
  /** Legacy category match on reviews/lists. */
  categories?: string[];
  tags?: string[];
  themes?: string[];
  /** Match book catalog `genre` / `genres`. */
  bookGenres?: string[];
  /** Cross-links to other genre pillars. */
  relatedGenres?: string[];
  /** Link to editorial topic hub. */
  topicHubSlug?: string;
  /** Future: linked reading path slug. */
  readingPathSlug?: string;
  /** Future: genre popularity (lower = higher on index). */
  popularityRank?: number;
};

/** Bridge ResolvedPageMetadata ↔ buildMetadata input. */
export type MetadataBuildInput = MetadataParams & {
  ogTitle?: string;
  ogDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
};
