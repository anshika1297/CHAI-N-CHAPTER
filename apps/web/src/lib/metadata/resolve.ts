import { canonicalUrl, mergeKeywords, ogImageUrl, siteConfig } from '@/lib/seo';
import type { MetadataBuildInput, ResolvedPageMetadata } from './types';

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

/**
 * Core resolver — applies fallback chain and emits every metadata field explicitly.
 *
 * Title:     seoTitle → contentTitle → fallbackTitle
 * Description: seoDescription → excerpt → fallbackDescription
 */
export function resolvePageMetadata(input: {
  path: string;
  seoTitle?: string;
  contentTitle?: string;
  fallbackTitle: string;
  seoDescription?: string;
  excerpt?: string;
  fallbackDescription: string;
  image?: string;
  keywords?: string[];
  canonicalOverride?: string;
  type?: 'website' | 'article' | 'profile';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  noIndex?: boolean;
  /** Distinct social titles when a page variant must differ (e.g. shop vs editorial). */
  socialTitle?: string;
  socialDescription?: string;
}): MetadataBuildInput {
  const title = str(input.seoTitle) || str(input.contentTitle) || input.fallbackTitle;
  const description =
    str(input.seoDescription) || str(input.excerpt) || input.fallbackDescription || siteConfig.description;

  const socialTitle = str(input.socialTitle) || title;
  const socialDescription = str(input.socialDescription) || description;

  const canonical = input.canonicalOverride?.trim()
    ? input.canonicalOverride.startsWith('http')
      ? input.canonicalOverride
      : canonicalUrl(input.canonicalOverride.startsWith('/') ? input.canonicalOverride : `/${input.canonicalOverride}`)
    : undefined;

  return {
    title,
    description,
    path: input.path,
    type: input.type ?? 'website',
    image: input.image,
    keywords: mergeKeywords(input.keywords ?? []),
    canonicalOverride: canonical,
    publishedTime: input.publishedTime,
    modifiedTime: input.modifiedTime,
    author: input.author,
    noIndex: input.noIndex,
    ogTitle: socialTitle,
    ogDescription: socialDescription,
    twitterTitle: socialTitle,
    twitterDescription: socialDescription,
  };
}

/** Expand build input into a fully enumerated ResolvedPageMetadata (for audits / docs). */
export function toResolvedPageMetadata(params: MetadataBuildInput): ResolvedPageMetadata {
  const title = params.title?.trim() || '';
  const description = params.description?.trim() || siteConfig.description;
  const canonical = params.canonicalOverride?.trim() || canonicalUrl(params.path ?? '');
  const ogTitle = params.ogTitle || title;
  const ogDescription = params.ogDescription || description;
  const twitterTitle = params.twitterTitle || params.ogTitle || title;
  const twitterDescription = params.twitterDescription || params.ogDescription || description;
  const image = ogImageUrl(params.image);

  return {
    title,
    description,
    canonical,
    openGraphTitle: ogTitle,
    openGraphDescription: ogDescription,
    openGraphImage: image,
    twitterTitle,
    twitterDescription,
    twitterImage: image,
    keywords: params.keywords ?? [],
    type: params.type ?? 'website',
    publishedTime: params.publishedTime,
    modifiedTime: params.modifiedTime,
    author: params.author,
    noIndex: params.noIndex,
  };
}

export function slugToLabel(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function tagToSlug(tag: string): string {
  return tag.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function slugToTagLabel(slug: string): string {
  return slugToLabel(slug);
}
