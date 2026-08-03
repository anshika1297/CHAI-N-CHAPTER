import { canonicalUrl, ogImageUrl, siteConfig } from '@/lib/seo';

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

export type DynamicOgParams = {
  title: string;
  category?: string;
  /** Absolute or site-relative cover image URL embedded in the card */
  cover?: string;
};

function truncate(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

/** Build absolute URL for the dynamic OG image route (server-rendered social card). */
export function buildDynamicOgImageUrl(params: DynamicOgParams): string {
  const title = truncate(params.title, 120);
  const search = new URLSearchParams();
  search.set('title', title);
  if (params.category?.trim()) search.set('category', truncate(params.category, 48));
  if (params.cover?.trim()) search.set('cover', params.cover.trim());
  return `${canonicalUrl('/api/og')}?${search.toString()}`;
}

/** Resolve cover URL to absolute form for the OG renderer and crawlers. */
export function absoluteImageUrl(path?: string): string | undefined {
  if (!path?.trim()) return undefined;
  const trimmed = path.trim();
  if (trimmed.startsWith('http')) return trimmed;
  return ogImageUrl(trimmed.startsWith('/') ? trimmed : `/${trimmed}`);
}

export const dynamicOgBrand = {
  siteName: siteConfig.name,
  background: '#F6F1EB',
  accent: '#C97C5D',
  text: '#6B4F3F',
  muted: '#8B6F5F',
} as const;
