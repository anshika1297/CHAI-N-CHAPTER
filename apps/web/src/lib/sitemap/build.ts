import type { MetadataRoute } from 'next';
import { canonicalUrl } from '@/lib/seo';
import { SITEMAP_MAX_URLS_PER_FILE } from './constants';
import { collectAllSitemapDrafts } from './sources';
import type { BuiltSitemap, SitemapEntryDraft } from './types';

function normalizePath(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return p === '/' ? '/' : p.replace(/\/+$/, '');
}

/** Deduplicate by canonical path; later entries do not override earlier (static wins over duplicates). */
export function dedupeSitemapDrafts(drafts: SitemapEntryDraft[]): SitemapEntryDraft[] {
  const seen = new Set<string>();
  const out: SitemapEntryDraft[] = [];
  for (const d of drafts) {
    const key = normalizePath(d.path);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...d, path: key });
  }
  return out;
}

export function draftsToMetadataRoute(drafts: SitemapEntryDraft[]): MetadataRoute.Sitemap {
  return drafts.map((d) => ({
    url: d.path === '/' ? canonicalUrl('') : canonicalUrl(d.path),
    lastModified: d.lastModified ? new Date(d.lastModified) : undefined,
    changeFrequency: d.changeFrequency,
    priority: d.priority,
  }));
}

export function countByKind(drafts: SitemapEntryDraft[]): BuiltSitemap['counts'] {
  const counts: BuiltSitemap['counts'] = {};
  for (const d of drafts) {
    counts[d.kind] = (counts[d.kind] ?? 0) + 1;
  }
  return counts;
}

/**
 * Split entries for Next.js generateSitemaps() when URL count exceeds per-file limit.
 * Usage (future):
 *   export async function generateSitemaps() {
 *     const { chunks } = await buildSitemapChunks();
 *     return chunks.map((_, id) => ({ id }));
 *   }
 */
export function splitSitemapChunks(
  drafts: SitemapEntryDraft[],
  maxPerFile = SITEMAP_MAX_URLS_PER_FILE
): SitemapEntryDraft[][] {
  if (drafts.length <= maxPerFile) return [drafts];
  const chunks: SitemapEntryDraft[][] = [];
  for (let i = 0; i < drafts.length; i += maxPerFile) {
    chunks.push(drafts.slice(i, i + maxPerFile));
  }
  return chunks;
}

/** Build full sitemap from live CMS/API (published content only). */
export async function buildSitemap(): Promise<BuiltSitemap> {
  const raw = await collectAllSitemapDrafts();
  const drafts = dedupeSitemapDrafts(raw);
  const entries = draftsToMetadataRoute(drafts);
  const counts = countByKind(drafts);

  if (process.env.NODE_ENV !== 'production') {
    console.log('[sitemap] built', { total: entries.length, counts });
  }

  return {
    entries,
    counts,
    generatedAt: new Date(),
  };
}

/** Build one chunk by id (for split sitemap index). */
export async function buildSitemapChunk(id: number): Promise<MetadataRoute.Sitemap> {
  const raw = await collectAllSitemapDrafts();
  const drafts = dedupeSitemapDrafts(raw);
  const chunks = splitSitemapChunks(drafts);
  const chunk = chunks[id] ?? [];
  return draftsToMetadataRoute(chunk);
}

export async function getSitemapChunkCount(): Promise<number> {
  const raw = await collectAllSitemapDrafts();
  const drafts = dedupeSitemapDrafts(raw);
  return splitSitemapChunks(drafts).length;
}
