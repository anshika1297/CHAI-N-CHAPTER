export type SearchGroup =
  | 'reviews'
  | 'recommendations'
  | 'musings'
  | 'author-spotlight'
  | 'shop';

export type SearchResultItem = {
  id: string;
  group: SearchGroup;
  title: string;
  subtitle?: string;
  excerpt?: string;
  href: string;
  score: number;
  matchReason?: string;
};

export type SearchTagHit = {
  slug: string;
  label: string;
  href: string;
  score: number;
};

export type GroupedSearchResults = Record<SearchGroup, SearchResultItem[]>;

export type SearchResponse = {
  query: string;
  total: number;
  tags: SearchTagHit[];
  groups: GroupedSearchResults;
};

export const SEARCH_GROUP_LABELS: Record<SearchGroup, string> = {
  reviews: 'Book Reviews',
  recommendations: 'Recommendations',
  musings: 'Her Musings Verse',
  'author-spotlight': 'Author Spotlights',
  shop: 'Shop',
};

export const SEARCH_GROUP_ORDER: SearchGroup[] = [
  'reviews',
  'recommendations',
  'musings',
  'author-spotlight',
  'shop',
];
