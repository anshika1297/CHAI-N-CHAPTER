import type { MetadataRoute } from 'next';
import type { SitemapChangeFrequency, SitemapContentKind } from './constants';

/** Internal shape before dedupe and MetadataRoute mapping. */
export type SitemapEntryDraft = {
  path: string;
  lastModified?: string | Date;
  changeFrequency: SitemapChangeFrequency;
  priority: number;
  kind: SitemapContentKind;
};

export type BuiltSitemap = {
  entries: MetadataRoute.Sitemap;
  /** For logging / split-sitemap decisions */
  counts: Partial<Record<SitemapContentKind, number>>;
  generatedAt: Date;
};
