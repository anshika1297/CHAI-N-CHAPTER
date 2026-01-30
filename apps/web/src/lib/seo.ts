/**
 * Central SEO configuration for Chapters.aur.Chai (brand: chapters.aur.chai)
 * Domain: chaptersaurchai.com | Author: Anshika Mishra
 * Global reach with focus on India & UAE (Abu Dhabi). Book blogger, content creator, literary services.
 * For readers, authors, publishers & lit fest committees in India & UAE.
 */

export const siteConfig = {
  /** Blog display name (logo, UI) */
  name: 'Chapters.aur.Chai',
  /** Legal/brand name */
  brand: 'chapters.aur.chai',
  /** Default meta title */
  title: 'Chapters.aur.Chai | Book Blogger, Content Creator & Literary Services | Anshika Mishra | India & UAE',
  /** Default meta description */
  description:
    'Book blogger & content creator Anshika Mishra—honest reviews, literary services & book recommendations for readers worldwide. Based in Abu Dhabi. For authors, publishers & lit fest committees in India & UAE. Fiction, history & mythology.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://chaptersaurchai.com',
  defaultImage: '/og-image.jpg',
  author: 'Anshika Mishra',
  locale: 'en_IN',
  threadsHandle: '@chaptersaurchai', // for Threads (used in share + meta when relevant)
  email: 'hello@chaptersaurchai.com',
  /** Social profile URLs – update with your real handles. Wishlink can be added later for books. */
  social: {
    instagram: 'https://instagram.com/chaptersaurchai',
    facebook: 'https://facebook.com/chaptersaurchai',
    goodreads: 'https://goodreads.com/chaptersaurchai',
    linkedin: 'https://linkedin.com/in/chaptersaurchai',
    threads: 'https://www.threads.net/@chaptersaurchai',
    youtube: 'https://youtube.com/@chaptersaurchai',
  },
} as const;

/** Core SEO keywords – book blogger, content creator, literary services, India & UAE */
export const primaryKeywords = [
  'book blogger',
  'book critic',
  'content creator',
  'literary services',
  'Anshika Mishra',
  'Chapters.aur.Chai',
  'India book blogger',
  'UAE book blogger',
  'Abu Dhabi book blogger',
  'book reviews',
  'book recommendations',
  'author services',
  'beta reading',
  'literary festival',
  'publishers India',
  'publishers UAE',
  'fiction book reviews',
  'literary blogger',
  'book reviewer',
] as const;

/** Long-tail & audience keywords – readers, authors, lit fests, publishers, India & UAE */
export const extendedKeywords = [
  'honest book reviews',
  'curated book recommendations',
  'Abu Dhabi book blogger',
  'Dubai book blogger',
  'UAE literary scene',
  'Indian book blogger',
  'South Asian literature',
  'book reviewer for authors',
  'work with publishers',
  'literary services for authors',
  'lit fest India',
  'lit fest UAE',
  'book publicity',
  'content creator for books',
  'mythology book reviews',
  'history book reviews',
  'author interviews',
  'reading wrap ups',
  'monthly book recommendations',
  'global fiction',
  'English fiction reviews',
] as const;

export type MetadataParams = {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  path?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  noIndex?: boolean;
};

export function canonicalUrl(path: string = ''): string {
  const base = siteConfig.url.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

export function ogImageUrl(path?: string): string {
  if (path?.startsWith('http')) return path;
  const base = siteConfig.url.replace(/\/$/, '');
  return path ? `${base}${path}` : `${base}${siteConfig.defaultImage}`;
}

export function mergeKeywords(extra: string[] = []): string[] {
  return [...primaryKeywords, ...extendedKeywords, ...extra].filter(
    (v, i, a) => a.indexOf(v) === i
  );
}
