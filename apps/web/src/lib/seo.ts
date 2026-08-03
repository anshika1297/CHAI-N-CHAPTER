/**
 * Central SEO configuration for Chapters.aur.Chai (brand: chapters.aur.chai)
 * Domain: chaptersaurchai.com | Author: Anshika Mishra
 * Global reach with focus on India & UAE (Abu Dhabi). Book blogger, content creator, literary services.
 * For readers, authors, publishers & lit fest committees in India & UAE.
 */

function resolveSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const url = configured || 'https://chaptersaurchai.com';
  if (process.env.NODE_ENV === 'production') {
    const lower = url.toLowerCase();
    if (lower.includes('localhost') || lower.includes('127.0.0.1')) {
      console.warn(
        '[seo] NEXT_PUBLIC_SITE_URL looks like localhost in production — sitemap, canonical, and OG URLs will be wrong. Set NEXT_PUBLIC_SITE_URL=https://chaptersaurchai.com'
      );
    }
  }
  return url;
}

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
  url: resolveSiteUrl(),
  /** Default social card — dynamic OG route (1200×630). */
  defaultImage: '/api/og?title=Chapters.aur.Chai&category=Book+Blogger+%26+Literary+Services',
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
  'beta reader India',
  'book reviewer',
  'book reviewer India',
  'proofreader',
  'proofreader India',
  'author strategist',
  'author strategist India',
  'literary festival',
  'publishers India',
  'publishers UAE',
  'fiction book reviews',
  'literary blogger',
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
  type?: 'website' | 'article' | 'profile';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  noIndex?: boolean;
  /** Absolute or site-relative canonical override from CMS */
  canonicalOverride?: string;
  /** Explicit Open Graph overrides (default: title / description) */
  ogTitle?: string;
  ogDescription?: string;
  /** Explicit Twitter overrides (default: og* then title / description) */
  twitterTitle?: string;
  twitterDescription?: string;
};

export function canonicalUrl(path: string = ''): string {
  const base = siteConfig.url.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

export function ogImageUrl(path?: string): string {
  if (path?.startsWith('http')) return path;
  const base = siteConfig.url.replace(/\/$/, '');
  const rel = path || siteConfig.defaultImage;
  return rel.startsWith('/') ? `${base}${rel}` : `${base}/${rel}`;
}

/** OG image dimensions — square logo fallback vs standard social card. */
export function ogImageDimensions(imageUrl: string): { width: number; height: number } {
  const path = imageUrl.replace(siteConfig.url.replace(/\/$/, ''), '');
  if (path.includes('logo.png') || path.includes('favicon')) {
    return { width: 512, height: 512 };
  }
  if (path.includes('/api/og')) {
    return { width: 1200, height: 630 };
  }
  return { width: 1200, height: 630 };
}

export function mergeKeywords(extra: string[] = []): string[] {
  return [...primaryKeywords, ...extendedKeywords, ...extra].filter(
    (v, i, a) => a.indexOf(v) === i
  );
}
