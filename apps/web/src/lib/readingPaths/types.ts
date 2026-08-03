import type { ContentKind } from '@/lib/metadata/types';

export type ReadingPathStepKind = Extract<ContentKind, 'review' | 'recommendation' | 'author-spotlight' | 'musing'>;

export type ReadingPathStepDef = {
  step: number;
  title: string;
  description: string;
  kinds: ReadingPathStepKind[];
  /** Boost items whose tags overlap these (e.g. beginner, mythology) */
  preferTags?: string[];
  limit?: number;
};

export type ReadingPathDefinition = {
  slug: string;
  title: string;
  description: string;
  /** Linked topic hub — pool content from this hub's taxonomy rules */
  topicHubSlug: string;
  steps: ReadingPathStepDef[];
};

export type ReadingPathItem = {
  kind: ReadingPathStepKind;
  slug: string;
  title: string;
  excerpt?: string;
  href: string;
  image?: string;
};

export type ResolvedReadingPathStep = {
  step: number;
  title: string;
  description: string;
  items: ReadingPathItem[];
};

export type ResolvedReadingPath = {
  slug: string;
  title: string;
  description: string;
  topicHubSlug: string;
  topicHubHref: string;
  /** Canonical dedicated landing page */
  pageHref: string;
  steps: ResolvedReadingPathStep[];
};
