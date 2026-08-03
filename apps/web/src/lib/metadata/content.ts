import { readTags, seoFieldsFromRaw } from '@/lib/contentFields';
import { contentModifiedTime, readContentPublishedAt } from '@/lib/contentFreshness';
import type { ContentKind, ContentResolveInput } from './types';
import { resolvePageMetadata, slugToLabel } from './resolve';
import { resolveSocialImageUrl } from './socialImage';

const KIND_DEFAULTS: Record<
  ContentKind,
  { pathPrefix: string; type: 'article' | 'profile'; titlePrefix: string; description: string; baseKeywords: string[] }
> = {
  review: {
    pathPrefix: '/blog',
    type: 'article',
    titlePrefix: 'Book Review',
    description:
      'Book review by Anshika Mishra, book blogger & content creator. Honest analysis, highlights, and whether it is worth your time. India & UAE.',
    baseKeywords: ['book review', 'book critic', 'Anshika Mishra'],
  },
  recommendation: {
    pathPrefix: '/recommendations',
    type: 'article',
    titlePrefix: 'Book Recommendations',
    description:
      'Curated book recommendations by Anshika Mishra, book blogger & content creator. Fiction, history & mythology for readers in India & UAE and worldwide.',
    baseKeywords: ['book recommendations', 'Anshika Mishra'],
  },
  musing: {
    pathPrefix: '/musings',
    type: 'article',
    titlePrefix: 'Her Musings Verse',
    description:
      'Short stories, reflections, and musings by Anshika Mishra, book blogger & content creator. Literary essays and thoughts from the heart. India & UAE.',
    baseKeywords: ['Her Musings Verse', 'Anshika Mishra'],
  },
  'author-spotlight': {
    pathPrefix: '/author-spotlight',
    type: 'profile',
    titlePrefix: 'Author Spotlight',
    description: 'Author spotlight on Chapters.aur.Chai — discover writers, their works, and where to start reading.',
    baseKeywords: ['author spotlight'],
  },
};

function contentTitle(raw: Record<string, unknown>, kind: ContentKind): string {
  if (kind === 'author-spotlight') return str(raw.name);
  return str(raw.title);
}

function excerpt(raw: Record<string, unknown>, kind: ContentKind): string {
  const ex = str(raw.excerpt);
  if (ex) return ex;
  if (kind === 'author-spotlight') {
    return str(raw.tagline) || (typeof raw.bio === 'string' ? raw.bio.slice(0, 160).trim() : '');
  }
  if (kind === 'recommendation') return str(raw.intro) || str(raw.quickAnswer);
  if (kind === 'musing') return str(raw.keyTakeaway);
  return ex;
}

function contentCategory(raw: Record<string, unknown>, kind: ContentKind): string | undefined {
  const category = str(raw.category);
  if (category) return category;
  if (kind === 'author-spotlight' && Array.isArray(raw.genres) && raw.genres.length) {
    return String(raw.genres[0]).trim();
  }
  if (kind === 'musing' && Array.isArray(raw.themes) && raw.themes.length) {
    return String(raw.themes[0]).trim();
  }
  return KIND_DEFAULTS[kind].titlePrefix;
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

/** Resolve metadata for a CMS content item (review, recommendation, musing, author spotlight). */
export function resolveContentItemMetadata(input: ContentResolveInput) {
  const { kind, slug, raw, staticFallback } = input;
  const defaults = KIND_DEFAULTS[kind];
  const seo = seoFieldsFromRaw(raw);
  const tags = readTags(raw);
  const label = slugToLabel(slug);
  const title = contentTitle(raw, kind);
  const ex = excerpt(raw, kind);

  const fallbackTitle =
    kind === 'author-spotlight'
      ? title || label
      : kind === 'musing'
        ? `${defaults.titlePrefix}: ${title || label}`
        : `${defaults.titlePrefix}: ${title || label}`;

  const fallbackDescription = staticFallback?.description?.trim() || defaults.description;

  const socialTitle = str(seo.seoTitle) || title || staticFallback?.title || fallbackTitle;
  const image = resolveSocialImageUrl({
    seo,
    raw,
    kind,
    staticCover: staticFallback?.image,
    socialTitle,
    category: contentCategory(raw, kind),
  });

  const author =
    kind === 'author-spotlight'
      ? title || 'Anshika Mishra'
      : str(raw.author) || staticFallback?.author || 'Anshika Mishra';

  const extraKeywords =
    kind === 'author-spotlight' && Array.isArray(raw.genres)
      ? (raw.genres as unknown[]).map((g) => String(g).trim()).filter(Boolean)
      : [];

  return resolvePageMetadata({
    path: `${defaults.pathPrefix}/${slug}`,
    seoTitle: seo.seoTitle,
    contentTitle: title || staticFallback?.title,
    fallbackTitle,
    seoDescription: seo.seoDescription,
    excerpt: ex || staticFallback?.description,
    fallbackDescription,
    image,
    keywords: [...defaults.baseKeywords, label, ...extraKeywords, ...tags, ...(staticFallback?.keywords ?? [])],
    canonicalOverride: seo.canonicalUrl,
    type: defaults.type,
    publishedTime: readContentPublishedAt(raw) || staticFallback?.publishedTime,
    modifiedTime: contentModifiedTime(raw),
    author,
  });
}

/** Not-found / draft guard metadata — unique per slug, noindex. */
export function resolveContentNotFoundMetadata(kind: ContentKind, slug: string) {
  const defaults = KIND_DEFAULTS[kind];
  const label = slugToLabel(slug);
  return resolvePageMetadata({
    path: `${defaults.pathPrefix}/${slug}`,
    fallbackTitle: `${defaults.titlePrefix}: ${label}`,
    fallbackDescription: defaults.description,
    type: defaults.type,
    noIndex: true,
    keywords: [...defaults.baseKeywords, label],
  });
}
