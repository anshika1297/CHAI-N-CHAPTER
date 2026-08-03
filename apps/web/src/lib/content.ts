/**
 * Legacy content metadata helpers — kept for type compatibility.
 * All live content comes from the API (MongoDB). Do not add static placeholder slugs here;
 * they create ghost pages that get indexed without real content.
 */

export type ContentMeta = {
  title: string;
  description: string;
  image?: string;
  publishedTime?: string;
  author?: string;
  keywords?: string[];
};

export function getBlogSlugs(): string[] {
  return [];
}

export function getRecommendationSlugs(): string[] {
  return [];
}

export function getMusingSlugs(): string[] {
  return [];
}

export function getBlogMeta(_slug: string): ContentMeta | null {
  return null;
}

export function getRecommendationMeta(_slug: string): ContentMeta | null {
  return null;
}

export function getMusingMeta(_slug: string): ContentMeta | null {
  return null;
}
