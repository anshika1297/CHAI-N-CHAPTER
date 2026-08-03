/**
 * CMS content field shapes (Page JSON items + AuthorSpotlight).
 * Page.content uses Schema.Types.Mixed — these types document the contract.
 */

import type { ContentFreshnessFields } from './contentFreshness.js';

export type ContentFaqItem = { question: string; answer: string };

export type SimilarBookRef = {
  title: string;
  author?: string;
  internalUrl?: string;
  note?: string;
};

export type SimilarAuthorRef = {
  name: string;
  reason?: string;
  url?: string;
};

export type UniversalSeoFields = {
  seoTitle?: string;
  seoDescription?: string;
  tags?: string[];
  /** Book genre(s) for /genres pillar pages and catalog. */
  genres?: string[];
  ogImage?: string;
  canonicalUrl?: string;
  seoKeywords?: string[];
};

export type ReviewPageItem = UniversalSeoFields & ContentFreshnessFields & {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  recommendedFor?: string;
  notRecommendedFor?: string;
  verdict?: string;
  similarBooks?: SimilarBookRef[];
};

export type RecommendationPageItem = UniversalSeoFields & ContentFreshnessFields & {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  whoIsThisListFor?: string;
  quickAnswer?: string;
  faq?: ContentFaqItem[];
};

export type MusingPageItem = UniversalSeoFields & ContentFreshnessFields & {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  keyTakeaway?: string;
  themes?: string[];
};
