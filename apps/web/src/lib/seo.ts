/**
 * Central SEO configuration for Chapters.aur.Chai (brand: chapters.aur.chai)
 * Domain: chaptersaurchai.com | Author: Anshika Mishra
 * Global presence, major focus on India. Fiction, History, Mythology. Open to authors worldwide (English).
 */

export const siteConfig = {
  /** Blog display name (logo, UI) */
  name: 'Chapters.aur.Chai',
  /** Legal/brand name */
  brand: 'chapters.aur.chai',
  /** Default meta title */
  title: 'Chapters.aur.Chai | Book Blogger & Book Critic by Anshika Mishra',
  /** Default meta description */
  description:
    'Book reviews, recommendations & literary reflections by Anshika Mishra. Fiction, history & mythology from around the world. Indian book blogger with a global reach—open to authors everywhere who write in English.',
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

/** Global + India SEO keywords (global presence, major focus India) */
export const primaryKeywords = [
  'book blogger',
  'book critic',
  'book reviews',
  'Anshika Mishra',
  'Chapters.aur.Chai',
  'fiction book reviews',
  'literary blogger',
  'reading blog',
  'Indian book blogger',
  'book blog India',
  'book reviewer',
  'mythology book reviews',
  'history book reviews',
  'author interviews',
  'beta reading',
] as const;

/** Long-tail and genre/audience keywords */
export const extendedKeywords = [
  'honest book reviews',
  'curated book recommendations',
  'literary fiction',
  'Indian authors',
  'global fiction',
  'English fiction reviews',
  'work with authors',
  'book recommendations',
  'reading wrap ups',
  'monthly book recommendations',
  'South Asian literature',
  'mythology books',
  'historical fiction reviews',
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
