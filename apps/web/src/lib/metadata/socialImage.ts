import { getImageUrl } from '@/lib/api';
import { seoFieldsFromRaw, type UniversalSeoFields } from '@/lib/contentFields';
import { ogImageUrl } from '@/lib/seo';
import type { ContentKind } from './types';
import { absoluteImageUrl, buildDynamicOgImageUrl } from './dynamicOg';

export type SocialImageInput = {
  seo?: UniversalSeoFields;
  raw?: Record<string, unknown>;
  kind?: ContentKind;
  /** Static fallback cover when API is unreachable */
  staticCover?: string;
  /** Title shown on dynamic OG card */
  socialTitle?: string;
  category?: string;
  /** When false, skip dynamic OG and use cover → default only */
  useDynamicOg?: boolean;
};

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

/** Pick the best cover image from a content record (editorial hero / profile). */
export function pickCoverImage(raw: Record<string, unknown>, kind?: ContentKind): string | undefined {
  const image = str(raw.image);
  if (image) return image;
  const cover = str(raw.coverImage);
  if (cover) return cover;
  if (kind === 'author-spotlight') {
    const profile = str(raw.profileImage);
    if (profile) return profile;
  }
  if (kind === 'review') {
    const bookCover = str((raw as { bookCover?: string }).bookCover);
    if (bookCover) return bookCover;
  }
  return undefined;
}

function explicitShareImage(seo?: UniversalSeoFields): string | undefined {
  if (!seo) return undefined;
  const share = str(seo.socialShareImage) || str(seo.ogImage);
  return share || undefined;
}

/**
 * Resolve social preview image URL with priority:
 * 1. Social Share Image (CMS) — also reads legacy ogImage
 * 2. Dynamic branded OG card (title + category + cover embedded)
 * 3. Cover / hero image
 * 4. Site default image
 */
export function resolveSocialImageUrl(input: SocialImageInput): string {
  const seo = input.seo ?? (input.raw ? seoFieldsFromRaw(input.raw) : {});
  const explicit = explicitShareImage(seo);
  if (explicit) return ogImageUrl(getImageUrl(explicit));

  const coverPath =
    input.staticCover?.trim() ||
    (input.raw ? pickCoverImage(input.raw, input.kind) : undefined);
  const coverAbsolute = coverPath ? absoluteImageUrl(getImageUrl(coverPath)) : undefined;

  const useDynamic = input.useDynamicOg !== false;
  const cardTitle = str(input.socialTitle);
  if (useDynamic && cardTitle) {
    return buildDynamicOgImageUrl({
      title: cardTitle,
      category: input.category,
      cover: coverAbsolute,
    });
  }

  if (coverAbsolute) return coverAbsolute;
  return ogImageUrl();
}

/** Listing / hub pages without a CMS record — dynamic card or default. */
export function resolveListingSocialImage(input: {
  title: string;
  category?: string;
  coverImage?: string;
}): string {
  const cover = input.coverImage ? absoluteImageUrl(getImageUrl(input.coverImage)) : undefined;
  if (input.title.trim()) {
    return buildDynamicOgImageUrl({
      title: input.title,
      category: input.category,
      cover,
    });
  }
  if (cover) return cover;
  return ogImageUrl();
}
