/**
 * Shared enums + master-data types for the internal Library OS module.
 * Kept in one place so models, routes, and import logic stay in sync.
 */

export const READING_STATUSES = [
  'want-to-read',
  'currently-reading',
  'read',
  'dnf',
  'arc',
  'beta-read',
  'wishlist',
] as const;
export type ReadingStatus = (typeof READING_STATUSES)[number];

export const OWNERSHIP_STATUSES = [
  'owned',
  'borrowed',
  'digital',
  'library',
  'wishlist',
  'not-owned',
] as const;
export type OwnershipStatus = (typeof OWNERSHIP_STATUSES)[number];

export const RECOMMENDATION_CONFIDENCE = ['low', 'medium', 'high', 'must-recommend'] as const;
export type RecommendationConfidence = (typeof RECOMMENDATION_CONFIDENCE)[number];

export const BOOK_FORMATS = ['hardcover', 'paperback', 'ebook', 'audiobook', 'other'] as const;
export type BookFormat = (typeof BOOK_FORMATS)[number];

export const DISCOVERY_SOURCES = [
  'instagram',
  'threads',
  'youtube',
  'goodreads',
  'amazon',
  'friend',
  'publisher',
  'author',
  'book-fair',
  'book-club',
  'manual',
] as const;
export type DiscoverySource = (typeof DISCOVERY_SOURCES)[number];

export const DISCOVERY_STATUSES = ['seen', 'interested', 'must-buy', 'must-read', 'someday'] as const;
export type DiscoveryStatus = (typeof DISCOVERY_STATUSES)[number];

/** Author gender (Excel: Author Gender). */
export const AUTHOR_GENDERS = ['female', 'male', 'non-binary', 'unknown', ''] as const;
export type AuthorGender = (typeof AUTHOR_GENDERS)[number];

/** Fiction / Non-fiction (Excel). */
export const FICTION_TYPES = ['fiction', 'non-fiction', ''] as const;
export type FictionType = (typeof FICTION_TYPES)[number];

/**
 * Women Focus (Excel) — sample values: No / Primary / Secondary / Yes.
 */
export const WOMEN_FOCUS_VALUES = ['no', 'primary', 'secondary', 'yes', ''] as const;
export type WomenFocus = (typeof WOMEN_FOCUS_VALUES)[number];

/** Master-data collections (§8) stored in one taxonomy collection keyed by `type`. */
export const TAXONOMY_TYPES = [
  'genre',
  'subgenre',
  'theme',
  'trope',
  'mood',
  'publisher',
  'country',
  'language',
  'tag',
  'collection',
  'series',
  'hook-pattern',
] as const;
export type TaxonomyType = (typeof TAXONOMY_TYPES)[number];

export function isTaxonomyType(v: unknown): v is TaxonomyType {
  return typeof v === 'string' && (TAXONOMY_TYPES as readonly string[]).includes(v);
}

/** URL/id-safe slug from an arbitrary label. */
export function librarySlugify(input: string): string {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
