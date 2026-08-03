/** JSON-LD object emitted by schema builders (Schema.org). */
export type JsonLdObject = Record<string, unknown>;

export type BookOfferInput = {
  url: string;
  seller?: string;
};

export type BookInput = {
  name: string;
  author?: string;
  image?: string;
  url?: string;
  isbn?: string;
  genre?: string;
  sameAs?: string[];
  description?: string;
  offers?: BookOfferInput[];
  subjectOf?: { name: string; url: string };
};

export type BookReviewInput = {
  headline: string;
  reviewBody?: string;
  description?: string;
  path: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  authorName?: string;
  book: BookInput;
  rating?: number;
  tags?: string[];
};

export type ArticleInput = {
  headline: string;
  description: string;
  path: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  authorName?: string;
  tags?: string[];
};

export type BlogPostingInput = ArticleInput;

export type SpotlightPersonInput = {
  name: string;
  description?: string;
  image?: string;
  path: string;
  url?: string;
  genres?: string[];
  sameAs?: string[];
  notableWorks?: string[];
};

export type ProfessionalServiceInput = {
  name: string;
  description: string;
  path: string;
  serviceTypes: string[];
  providerName?: string;
};
