import type { Metadata } from 'next';
import {
  siteConfig,
  canonicalUrl,
  ogImageDimensions,
  ogImageUrl,
  type MetadataParams,
} from './seo';
import { toResolvedPageMetadata } from './metadata/resolve';
import type { MetadataBuildInput } from './metadata/types';

export type { ResolvedPageMetadata } from './metadata/types';
export { toResolvedPageMetadata } from './metadata/resolve';
export {
  resolveContentItemMetadata,
  resolveContentNotFoundMetadata,
  resolveShopMetadata,
  resolveShopHubMetadata,
  resolveTagMetadata,
  resolveTopicHubMetadata,
  resolveTagsIndexMetadata,
  resolveTopicsIndexMetadata,
  resolveAuthorDirectoryMetadata,
  resolveStartHereMetadata,
  resolveSocialImageUrl,
  buildDynamicOgImageUrl,
} from './metadata/index';

/**
 * Build Next.js Metadata for a page (SEO + Open Graph + Twitter).
 * All social fields are generated explicitly from title/description/image
 * unless ogTitle / twitterTitle overrides are supplied.
 */
export function buildMetadata(params: MetadataParams | MetadataBuildInput = {}): Metadata {
  const resolved = toResolvedPageMetadata(params as MetadataBuildInput);

  const fullTitle = resolved.title
    ? `${resolved.title} | ${siteConfig.name}`
    : siteConfig.title;
  const fullDescription = resolved.description || siteConfig.description;
  const canonical = resolved.canonical;
  const ogImage = resolved.openGraphImage;
  const twitterImage = resolved.twitterImage;
  const ogDims = ogImageDimensions(ogImage);

  const ogFullTitle = resolved.openGraphTitle
    ? `${resolved.openGraphTitle} | ${siteConfig.name}`
    : fullTitle;
  const ogFullDescription = resolved.openGraphDescription || fullDescription;

  const twitterFullTitle = resolved.twitterTitle
    ? `${resolved.twitterTitle} | ${siteConfig.name}`
    : ogFullTitle;
  const twitterFullDescription = resolved.twitterDescription || ogFullDescription;

  const type = params.type ?? 'website';
  const author = params.author ?? siteConfig.author;

  const metadata: Metadata = {
    title: fullTitle,
    description: fullDescription,
    keywords: resolved.keywords.length ? resolved.keywords : undefined,
    authors: [{ name: author, url: canonicalUrl('/about') }],
    creator: author,
    publisher: siteConfig.name,
    metadataBase: new URL(siteConfig.url),
    icons: { icon: '/favicon.png' },
    alternates: {
      canonical,
    },
    openGraph: {
      type,
      locale: siteConfig.locale,
      url: canonical,
      siteName: siteConfig.name,
      title: ogFullTitle,
      description: ogFullDescription,
      images: [
        {
          url: ogImage,
          width: ogDims.width,
          height: ogDims.height,
          alt: ogFullTitle,
        },
      ],
      ...(type === 'article' && {
        publishedTime: params.publishedTime,
        modifiedTime: params.modifiedTime,
        authors: [author],
      }),
      ...(type === 'profile' && {
        firstName: author?.split(/\s+/)[0],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: twitterFullTitle,
      description: twitterFullDescription,
      creator: (siteConfig as { threadsHandle?: string }).threadsHandle ?? undefined,
      images: [twitterImage],
    },
    robots: params.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: 'index, follow' },
  };

  return metadata;
}
