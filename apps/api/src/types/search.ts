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
