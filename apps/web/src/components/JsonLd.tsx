/**
 * JSON-LD structured data for SEO (Schema.org)
 * Helps Google understand: Person, Blog, Organization → rich results & knowledge panel
 */
import { siteConfig, canonicalUrl } from '@/lib/seo';

const baseUrl = siteConfig.url;

export function PersonSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: siteConfig.author,
    url: canonicalUrl('/about'),
    description:
      'Book blogger and book critic. Reviews fiction, history & mythology from around the world. Indian blogger with global reach—open to authors who write in English.',
    jobTitle: 'Book Blogger & Book Critic',
    sameAs: Object.values(siteConfig.social),
    worksFor: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: baseUrl,
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function WebSiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: baseUrl,
    description: siteConfig.description,
    inLanguage: 'en-IN',
    publisher: {
      '@type': 'Person',
      name: siteConfig.author,
      url: canonicalUrl('/about'),
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${baseUrl}/blog?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function BlogSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: siteConfig.name,
    description: siteConfig.description,
    url: baseUrl,
    publisher: {
      '@type': 'Person',
      name: siteConfig.author,
      url: canonicalUrl('/about'),
    },
    inLanguage: 'en-IN',
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface ArticleSchemaProps {
  title: string;
  description: string;
  slug: string;
  path: '/blog' | '/recommendations' | '/musings';
  publishedTime?: string;
  modifiedTime?: string;
  image?: string;
}

export function ArticleSchema({
  title,
  description,
  slug,
  path,
  publishedTime,
  modifiedTime,
  image,
}: ArticleSchemaProps) {
  const url = canonicalUrl(`${path}/${slug}`);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url,
    datePublished: publishedTime,
    dateModified: modifiedTime || publishedTime,
    author: {
      '@type': 'Person',
      name: siteConfig.author,
      url: canonicalUrl('/about'),
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      logo: { '@type': 'ImageObject', url: `${baseUrl}/logo.png` },
    },
    ...(image && { image: image.startsWith('http') ? image : `${baseUrl}${image}` }),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
