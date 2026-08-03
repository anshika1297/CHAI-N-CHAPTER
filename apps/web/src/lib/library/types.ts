/** Shared types + option lists for the internal Library OS admin module. */

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

export const AUTHOR_GENDERS = ['female', 'male', 'non-binary', 'unknown'] as const;
export type AuthorGender = (typeof AUTHOR_GENDERS)[number];

export const FICTION_TYPES = ['fiction', 'non-fiction'] as const;
export type FictionType = (typeof FICTION_TYPES)[number];

export const WOMEN_FOCUS_VALUES = ['no', 'primary', 'secondary', 'yes'] as const;
export type WomenFocus = (typeof WOMEN_FOCUS_VALUES)[number];

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

/** Human labels for status/ownership codes used across the UI. */
export const STATUS_LABELS: Record<ReadingStatus, string> = {
  'want-to-read': 'Want to read',
  'currently-reading': 'Currently reading',
  read: 'Read',
  dnf: 'Did not finish',
  arc: 'ARC',
  'beta-read': 'Beta read',
  wishlist: 'Wishlist',
};

export const DISCOVERY_STATUS_LABELS: Record<DiscoveryStatus, string> = {
  seen: 'Seen',
  interested: 'Interested',
  'must-buy': 'Must buy',
  'must-read': 'Must read',
  someday: 'Someday',
};

export const DISCOVERY_SOURCE_LABELS: Record<DiscoverySource, string> = {
  instagram: 'Instagram',
  threads: 'Threads',
  youtube: 'YouTube',
  goodreads: 'Goodreads',
  amazon: 'Amazon',
  friend: 'Friend',
  publisher: 'Publisher',
  author: 'Author',
  'book-fair': 'Book fair',
  'book-club': 'Book club',
  manual: 'Manual',
};

export const TAXONOMY_LABELS: Record<TaxonomyType, string> = {
  genre: 'Genres',
  subgenre: 'Subgenres',
  theme: 'Themes',
  trope: 'Tropes',
  mood: 'Moods',
  publisher: 'Publishers',
  country: 'Countries',
  language: 'Languages',
  tag: 'Tags',
  collection: 'Collections',
  series: 'Series',
  'hook-pattern': 'Winning hooks',
};

export interface BookCopy {
  format?: BookFormat | '';
  location?: string;
  notes?: string;
}

export interface BookContentLinks {
  goodreads?: string;
  amazon?: string;
  blog?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  newsletter?: string;
}

export interface RecommendationEntry {
  date: string;
  channel?: string;
  note?: string;
  contentUrl?: string;
}

export interface LibraryBookDto {
  _id: string;
  title: string;
  slug: string;
  subtitle?: string;
  coverImage?: string;
  isbn?: string;
  asin?: string;
  format?: BookFormat | '';
  pages?: number;
  publicationDate?: string;
  originalPublicationDate?: string;
  edition?: string;
  description?: string;

  author: string;
  authorSlug?: string;
  authorGender?: string;
  series?: string;
  seriesNumber?: number;
  inSeries?: boolean;
  standalone?: boolean;
  publisher?: string;
  country?: string;
  originalLanguage?: string;
  translator?: string;

  status: ReadingStatus;
  rating?: number;
  recommendationConfidence?: RecommendationConfidence | '';
  ownership?: OwnershipStatus | '';
  owned?: boolean;
  wishlist?: string;
  copies: BookCopy[];
  location?: string;
  startedDate?: string;
  finishedDate?: string;
  rereadCount?: number;

  fictionType?: string;
  primaryGenre?: string;
  secondaryGenre?: string;
  genres: string[];
  subgenres: string[];
  themes: string[];
  tropes: string[];
  moods: string[];
  keywords: string[];
  tags: string[];
  audience?: string;
  readingLevel?: string;
  writingStyle?: string;
  triggerWarnings: string[];
  femaleAuthor?: boolean;
  femaleProtagonist?: boolean;
  womenFocus?: string;

  oneLineRecommendation?: string;
  personalNotes?: string;
  favouriteCharacter?: string;
  favouriteQuote?: string;
  favouriteScene?: string;
  similarBooks: string[];
  whyIRecommendIt?: string;
  seasonalRecommendation: string[];
  instagramHook?: string;
  instagramPostTopic?: string;
  bestPostingMonth?: string;
  awards: string[];
  bestseller?: string;
  adaptation?: string;
  bookTokPopular?: string;
  bookstagramPopular?: string;

  discoverySource?: DiscoverySource | '';
  discoveryStatus?: DiscoveryStatus | '';
  collections: string[];

  contentLinks?: BookContentLinks;
  recommendationHistory: RecommendationEntry[];

  createdAt?: string;
  updatedAt?: string;
}

export interface LibraryBookFacets {
  authors: string[];
  genres: string[];
  themes: string[];
  moods: string[];
  tropes: string[];
  tags: string[];
  locations: string[];
  authorCountries: string[];
  seasons?: string[];
  languages?: string[];
  collections?: string[];
}

export interface LibraryBookListResult {
  books: LibraryBookDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  facets?: LibraryBookFacets;
}

export interface AuthorStats {
  totalBooks: number;
  booksRead: number;
  booksOwned: number;
  averageRating: number;
  recommendationCount?: number;
  lastRecommendedAt?: string | null;
}

export interface LibraryAuthorDto {
  _id: string;
  name: string;
  slug: string;
  country?: string;
  primaryLanguage?: string;
  website?: string;
  goodreads?: string;
  instagram?: string;
  shortBio?: string;
  awards: string[];
  priorityAuthor: boolean;
  stats?: AuthorStats;
}

export interface TaxonomyItemDto {
  _id: string;
  type: TaxonomyType;
  name: string;
  slug: string;
  description?: string;
}

export interface LibraryInsightCard {
  id: string;
  title: string;
  body: string;
  count: number;
  href: string;
  tone: 'terracotta' | 'sage' | 'muted';
}

export interface LibraryInsights {
  cards: LibraryInsightCard[];
  occasions: { name: string; count: number; neverRecommended: number }[];
  enrichment: {
    authorsMissingCountry: number;
    booksMissingTags: number;
    booksMissingThemes: number;
  };
  recentlyRecommended: {
    _id: string;
    title: string;
    author: string;
    lastRecommendedAt: string;
  }[];
  unreadOwnedSample: {
    _id: string;
    title: string;
    author: string;
    status: string;
  }[];
}

export interface LibraryAnalytics {
  finishedByYear: { year: number; count: number }[];
  finishedThisYearByMonth: { month: number; label: string; count: number }[];
  genreMix: { name: string; count: number }[];
  recommendationByGenre: { name: string; times: number; books: number }[];
  recommendationByChannel: { name: string; count: number }[];
  discoveryByStatus: { name: string; count: number }[];
  discoveryBySource: { name: string; count: number }[];
  totals: {
    finishedThisYear: number;
    recommendationsThisYear: number;
    discoveryPipeline: number;
  };
}

export interface DuplicateBookRow {
  _id: string;
  title: string;
  author: string;
  isbn?: string;
  status: string;
  rating?: number;
  coverImage?: string;
  timesRecommended: number;
  fieldCount: number;
}

export interface DuplicateGroup {
  key: string;
  reason: 'isbn' | 'title-author';
  books: DuplicateBookRow[];
}

export interface LibraryStats {
  totals: {
    totalBooks: number;
    booksRead: number;
    currentlyReading: number;
    wantToRead: number;
    booksOwned: number;
    totalAuthors: number;
    readNeverReviewed: number;
  };
  recentlyAdded: Pick<LibraryBookDto, '_id' | 'title' | 'author' | 'coverImage' | 'slug' | 'status'>[];
  topGenres: { name: string; count: number }[];
  byLocation: { name: string; count: number }[];
  insights?: LibraryInsights;
}

export interface ImportPreviewBook {
  title: string;
  author: string;
  isbn?: string;
  status: ReadingStatus;
  rating?: number;
  pages?: number;
  isDuplicate: boolean;
  genres?: string[];
}

export interface ImportPreviewResult {
  preview: true;
  total: number;
  duplicates: number;
  books: ImportPreviewBook[];
  mode?: 'insert' | 'upsert';
  note?: string;
}

export interface QueryChip {
  field: string;
  value: string;
  label: string;
}

export interface LibraryQueryResult {
  query: string;
  engine: 'ai' | 'heuristic';
  aiProvider?: string;
  aiAvailable: boolean;
  summary: string;
  chips: QueryChip[];
  params: Record<string, string | number | boolean>;
  total: number;
  books: LibraryBookDto[];
}

export interface AuthorEnrichSuggestion {
  id: string;
  name: string;
  country: string;
  primaryLanguage: string;
}

export interface AuthorEnrichSuggestResult {
  suggestions: AuthorEnrichSuggestion[];
  provider: string;
  message?: string;
  errors?: { provider: string; message: string }[];
  processed?: number;
  remaining?: number;
}

export interface BookClassificationSuggestion {
  genres: string[];
  subgenres: string[];
  themes: string[];
  moods: string[];
  tropes: string[];
  tags: string[];
  keywords: string[];
  seasonalRecommendation: string[];
  similarBooks: string[];
  triggerWarnings: string[];
  audience: string;
  readingLevel: string;
  writingStyle: string;
  series: string;
  publisher: string;
  country: string;
  originalLanguage: string;
  description: string;
  oneLineRecommendation: string;
  pages?: number;
}

export interface BookClassificationSuggestResult {
  suggestion: BookClassificationSuggestion;
  provider: string;
}

export interface BookEnrichSuggestion extends BookClassificationSuggestion {
  id: string;
  title: string;
  author: string;
}

export interface BookEnrichSuggestResult {
  suggestions: BookEnrichSuggestion[];
  provider: string;
  message?: string;
  errors?: { provider: string; message: string }[];
  processed?: number;
  remaining?: number;
  maxPerRequest?: number;
}

export const RECOMMEND_CHANNELS = [
  'instagram',
  'blog',
  'newsletter',
  'linkedin',
  'youtube',
  'threads',
  'book-club',
  'other',
] as const;
export type RecommendChannel = (typeof RECOMMEND_CHANNELS)[number];

export interface RecommendBuilderBook {
  _id: string;
  title: string;
  author?: string;
  coverImage?: string;
  slug?: string;
  status: ReadingStatus;
  rating?: number;
  pages?: number;
  genres: string[];
  themes: string[];
  moods: string[];
  tags: string[];
  seasonalRecommendation: string[];
  oneLineRecommendation?: string;
  recommendationConfidence?: string;
  ownership?: string;
  owned: boolean;
  country?: string;
  originalLanguage?: string;
  timesRecommended: number;
  lastRecommendedAt: string | null;
  daysSinceRecommended: number | null;
  /** Why AI thought it fits (when Ask used AI fit). */
  fitReason?: string;
  fitConfidence?: string;
}

export interface RecommendBuilderResult {
  total: number;
  returned: number;
  filters: Record<string, string | number | boolean>;
  books: RecommendBuilderBook[];
  channels: string[];
  facets?: LibraryBookFacets;
  /** Human notes when filters were auto-loosened to avoid empty lists. */
  relaxed?: string[];
  query?: string;
  summary?: string;
  parseEngine?: 'ai' | 'heuristic';
  parseProvider?: string;
  fitEngine?: 'ai-fit' | 'filter';
  fitProvider?: string;
  hooks?: BookHookItem[];
  hooksProvider?: string;
  stylePatternsUsed?: number;
}

export interface ContentDrafts {
  instagramCaption: string;
  instagramCarousel: string[];
  linkedinPost: string;
  newsletterBlurb: string;
  blogOutline: string[];
  hashtags: string[];
  seoTitle: string;
  seoDescription: string;
  discussionQuestions: string[];
  bookClubQuestions: string[];
}

export interface ContentDraftResult {
  book: { _id: string; title: string; author?: string };
  drafts: ContentDrafts;
  provider: string;
  errors?: { provider: string; message: string }[];
}

export interface BookHookItem {
  id: string;
  title: string;
  author: string;
  hook: string;
}

export interface ListHooksResult {
  mode: 'list';
  hooks: BookHookItem[];
  provider: string;
  errors?: { provider: string; message: string }[];
  processed?: number;
  remaining?: number;
  maxPerRequest?: number;
  message?: string;
  stylePatternsUsed?: number;
}

export interface SingleHooksResult {
  mode: 'single';
  book: { _id: string; title: string; author?: string };
  hooks: string[];
  provider: string;
  errors?: { provider: string; message: string }[];
  stylePatternsUsed?: number;
}

export type HooksResult = ListHooksResult | SingleHooksResult;

export interface AskHooksResult {
  mode: 'ask';
  query: string;
  summary: string;
  engine: 'ai' | 'heuristic';
  queryProvider?: string;
  params?: Record<string, string | number | boolean>;
  total: number;
  returned?: number;
  hooks: BookHookItem[];
  provider: string;
  errors?: { provider: string; message: string }[];
  stylePatternsUsed?: number;
  maxPerRequest?: number;
  message?: string;
}

export interface HookToBooksResult {
  mode: 'hook-match';
  sourceHook: { id?: string; text: string };
  summary: string;
  engine: 'ai' | 'heuristic';
  queryProvider?: string;
  params?: Record<string, string | number | boolean>;
  total: number;
  returned?: number;
  books: Array<{
    _id: string;
    title: string;
    author: string;
    genres?: string[];
    themes?: string[];
    tags?: string[];
    rating?: number;
    status?: string;
  }>;
  hooks: BookHookItem[];
  provider: string;
  errors?: { provider: string; message: string }[];
  stylePatternsUsed?: number;
  maxPerRequest?: number;
  message?: string;
}

export interface ImportFailure {
  title: string;
  reason: string;
}

export interface ImportCommitResult {
  committed: true;
  total: number;
  offset: number;
  processed: number;
  nextOffset: number;
  done: boolean;
  inserted: number;
  updated?: number;
  skippedDuplicates: number;
  authorsCreated: number;
  taxonomyCreated?: number;
  mode?: 'insert' | 'upsert';
  failed: ImportFailure[];
}
