import type { Metadata } from 'next';
import {
  siteConfig,
  canonicalUrl,
  ogImageUrl,
  mergeKeywords,
  type MetadataParams,
} from './seo';

/**
 * Build Next.js Metadata for a page (SEO + Open Graph + Twitter)
 */
export function buildMetadata(params: MetadataParams = {}): Metadata {
  const {
    title,
    description,
    keywords = [],
    image,
    path = '',
    type = 'website',
    publishedTime,
    modifiedTime,
    author = siteConfig.author,
    noIndex = false,
  } = params;

  const fullTitle = title
    ? `${title} | ${siteConfig.name}`
    : siteConfig.title;
  const fullDescription = description || siteConfig.description;
  const canonical = canonicalUrl(path);
  const allKeywords = mergeKeywords(keywords);

  const metadata: Metadata = {
    title: fullTitle,
    description: fullDescription,
    keywords: allKeywords,
    authors: [{ name: author, url: canonicalUrl('/about') }],
    creator: author,
    publisher: siteConfig.name,
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical,
    },
    openGraph: {
      type,
      locale: siteConfig.locale,
      url: canonical,
      siteName: siteConfig.name,
      title: fullTitle,
      description: fullDescription,
      images: [
        {
          url: ogImageUrl(image),
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
      ...(type === 'article' && {
        publishedTime,
        modifiedTime,
        authors: [author],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: fullDescription,
      creator: (siteConfig as { threadsHandle?: string }).threadsHandle ?? undefined,
      images: [ogImageUrl(image)],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: 'index, follow' },
  };

  return metadata;
}
