import { getFetchBaseUrl } from '@/lib/apiBase';
import { isContentPublished } from '@/lib/contentPublish';
import { buildBreadcrumbSchema, buildWebPageSchema } from '@/lib/schema/webPage';

export const START_HERE_FEATURED_LIMIT = 3;

export type StartHereReview = {
  title: string;
  excerpt: string;
  image: string;
  category: string;
  slug: string;
  readingTime: number;
  author?: string;
  bookTitle?: string;
  rating?: number;
};

export type StartHereRecommendation = {
  title: string;
  excerpt: string;
  image: string;
  category: string;
  slug: string;
  readingTime: number;
  bookCount?: number;
};

export type StartHereMusing = {
  title: string;
  excerpt: string;
  image: string;
  category: string;
  slug: string;
  readingTime: number;
};

export type StartHereAuthor = {
  slug: string;
  name: string;
  tagline?: string;
  coverImage?: string;
  profileImage: string;
  genres: string[];
};

export type StartHereContent = {
  reviews: StartHereReview[];
  recommendations: StartHereRecommendation[];
  musings: StartHereMusing[];
  authors: StartHereAuthor[];
};

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function num(v: unknown, fallback: number): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string') {
    const n = parseInt(v, 10);
    if (!Number.isNaN(n)) return n;
  }
  return fallback;
}

function toReview(raw: Record<string, unknown>): StartHereReview | null {
  const slug = str(raw.slug);
  const title = str(raw.title);
  if (!slug || !title || !isContentPublished(raw as { isPublished?: boolean })) return null;
  const rating = typeof raw.rating === 'number' && raw.rating >= 1 && raw.rating <= 5 ? raw.rating : undefined;
  return {
    title,
    excerpt: str(raw.excerpt),
    image: str(raw.image),
    category: str(raw.category) || 'Book Review',
    slug,
    readingTime: num(raw.readingTime, 5),
    author: str(raw.author) || undefined,
    bookTitle: str(raw.bookTitle) || undefined,
    rating,
  };
}

function toRecommendation(raw: Record<string, unknown>): StartHereRecommendation | null {
  const slug = str(raw.slug);
  const title = str(raw.title);
  if (!slug || !title || !isContentPublished(raw as { isPublished?: boolean })) return null;
  const books = Array.isArray(raw.books) ? raw.books.length : undefined;
  return {
    title,
    excerpt: str(raw.excerpt) || str(raw.intro),
    image: str(raw.image),
    category: str(raw.category) || 'Recommendations',
    slug,
    readingTime: num(raw.readingTime, 6),
    bookCount: books,
  };
}

function toMusing(raw: Record<string, unknown>): StartHereMusing | null {
  const slug = str(raw.slug);
  const title = str(raw.title);
  if (!slug || !title || !isContentPublished(raw as { isPublished?: boolean })) return null;
  return {
    title,
    excerpt: str(raw.excerpt) || str(raw.keyTakeaway),
    image: str(raw.image),
    category: str(raw.category) || 'Musing',
    slug,
    readingTime: num(raw.readingTime, 4),
  };
}

function toAuthor(raw: Record<string, unknown>): StartHereAuthor | null {
  const slug = str(raw.slug);
  const name = str(raw.name);
  const profileImage = str(raw.profileImage);
  const coverImage = str(raw.coverImage);
  if (!slug || !name || !profileImage) return null;
  return {
    slug,
    name,
    tagline: str(raw.tagline) || undefined,
    coverImage: coverImage || undefined,
    profileImage,
    genres: Array.isArray(raw.genres) ? raw.genres.map((g) => String(g).trim()).filter(Boolean) : [],
  };
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Server-side featured content for /start-here (newest published items). */
export async function fetchStartHereContent(): Promise<StartHereContent> {
  const base = getFetchBaseUrl();

  const [blogData, recData, musingData, spotlightData] = await Promise.all([
    fetchJson<{ posts?: unknown[] }>(`${base}/api/blog/posts?limit=24&sort=newest`),
    fetchJson<{ items?: unknown[] }>(`${base}/api/recommendations?limit=24&sort=newest`),
    fetchJson<{ items?: unknown[] }>(`${base}/api/musings?limit=24&sort=newest`),
    fetchJson<{ spotlights?: unknown[] }>(`${base}/api/author-spotlight`),
  ]);

  const reviews = (blogData?.posts ?? [])
    .flatMap((p) => {
      const r = p && typeof p === 'object' && !Array.isArray(p) ? (p as Record<string, unknown>) : null;
      return r ? [toReview(r)] : [];
    })
    .filter((x): x is StartHereReview => x != null)
    .slice(0, START_HERE_FEATURED_LIMIT);

  const recommendations = (recData?.items ?? [])
    .flatMap((p) => {
      const r = p && typeof p === 'object' && !Array.isArray(p) ? (p as Record<string, unknown>) : null;
      return r ? [toRecommendation(r)] : [];
    })
    .filter((x): x is StartHereRecommendation => x != null)
    .slice(0, START_HERE_FEATURED_LIMIT);

  const musings = (musingData?.items ?? [])
    .flatMap((p) => {
      const r = p && typeof p === 'object' && !Array.isArray(p) ? (p as Record<string, unknown>) : null;
      return r ? [toMusing(r)] : [];
    })
    .filter((x): x is StartHereMusing => x != null)
    .slice(0, START_HERE_FEATURED_LIMIT);

  const authors = (spotlightData?.spotlights ?? [])
    .flatMap((p) => {
      const r = p && typeof p === 'object' && !Array.isArray(p) ? (p as Record<string, unknown>) : null;
      return r ? [toAuthor(r)] : [];
    })
    .filter((x): x is StartHereAuthor => x != null)
    .slice(0, START_HERE_FEATURED_LIMIT);

  return { reviews, recommendations, musings, authors };
}

export function buildStartHereSchemas(content: StartHereContent) {
  const relatedLinks = [
    { name: 'Book Reviews', path: '/blog' },
    { name: 'Book Recommendations', path: '/recommendations' },
    { name: 'Literary Musings', path: '/musings' },
    { name: 'Author Spotlights', path: '/author-spotlight' },
    { name: 'Book Clubs', path: '/book-clubs' },
    { name: 'Subscribe', path: '/subscribe' },
    ...content.reviews.map((r) => ({ name: r.title, path: `/blog/${r.slug}` })),
    ...content.recommendations.map((r) => ({ name: r.title, path: `/recommendations/${r.slug}` })),
    ...content.musings.map((m) => ({ name: m.title, path: `/musings/${m.slug}` })),
    ...content.authors.map((a) => ({ name: a.name, path: `/author-spotlight/${a.slug}` })),
  ];

  return [
    buildWebPageSchema({
      path: '/start-here',
      name: 'Start Here — Welcome to Chapters.Aur.Chai',
      description:
        'Your reading map for Chapters.Aur.Chai — book reviews, curated recommendations, literary musings, author spotlights, and book clubs for readers in India, UAE, and worldwide.',
      relatedLinks,
    }),
    buildBreadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Start Here', path: '/start-here' },
    ]),
  ];
}
