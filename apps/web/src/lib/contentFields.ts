/**
 * Universal + per-type editorial fields for CMS content (reviews, recommendations, musings, author spotlights).
 * Stored in Page JSON blobs or AuthorSpotlight documents.
 */

import { isBookGenreCategory, normGenre } from '@/lib/genres/vocabulary';

export type { ContentFreshnessFields, ContentUpdateEntry } from '@/lib/contentFreshness';

export type ContentFaqItem = { question: string; answer: string };

export type SimilarBookRef = {
  title: string;
  author?: string;
  internalUrl?: string;
  note?: string;
};

export type SimilarAuthorRef = {
  name: string;
  reason?: string;
  url?: string;
};

/** Shared SEO / discovery fields on all publishable content types. */
export type UniversalSeoFields = {
  seoTitle?: string;
  seoDescription?: string;
  tags?: string[];
  /** Primary book genre(s) — powers /genres pillar pages and catalog matching. */
  genres?: string[];
  /** Dedicated social share image (Open Graph / Twitter / WhatsApp). Takes priority over cover. */
  socialShareImage?: string;
  /** @deprecated Legacy alias — reads/writes mirror socialShareImage for backward compatibility. */
  ogImage?: string;
  canonicalUrl?: string;
  /** Legacy alias — read merges into tags; save writes tags only. */
  seoKeywords?: string[];
};

export type ReviewEditorialFields = {
  recommendedFor?: string;
  notRecommendedFor?: string;
  verdict?: string;
  similarBooks?: SimilarBookRef[];
};

export type RecommendationEditorialFields = {
  whoIsThisListFor?: string;
  quickAnswer?: string;
  faq?: ContentFaqItem[];
};

export type MusingEditorialFields = {
  keyTakeaway?: string;
  themes?: string[];
};

export type AuthorSpotlightEditorialFields = {
  startHere?: string;
  whoIsHtml?: string;
  notableWorks?: string[];
  similarAuthors?: SimilarAuthorRef[];
};

export type ReviewContentFields = UniversalSeoFields & ReviewEditorialFields;
export type RecommendationContentFields = UniversalSeoFields & RecommendationEditorialFields;
export type MusingContentFields = UniversalSeoFields & MusingEditorialFields;
export type AuthorSpotlightContentFields = UniversalSeoFields & AuthorSpotlightEditorialFields;

function record(raw: unknown): Record<string, unknown> | null {
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null;
}

function str(raw: unknown): string {
  return typeof raw === 'string' ? raw.trim() : '';
}

export function parseTagsInput(input: string): string[] {
  return input
    .split(/[\n,]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function formatTagsForInput(tags: string[] | undefined): string {
  return (tags ?? []).join('\n');
}

export function readTags(raw: unknown): string[] {
  const o = record(raw);
  if (!o) return [];
  const fromTags = Array.isArray(o.tags)
    ? (o.tags as unknown[]).map((t) => String(t).trim().toLowerCase()).filter(Boolean)
    : [];
  if (fromTags.length) return [...new Set(fromTags)];
  const legacy = Array.isArray(o.seoKeywords)
    ? (o.seoKeywords as unknown[]).map((t) => String(t).trim().toLowerCase()).filter(Boolean)
    : [];
  return [...new Set(legacy)];
}

export function readGenres(raw: unknown): string[] {
  const o = record(raw);
  if (!o) return [];

  const fromGenres = Array.isArray(o.genres)
    ? (o.genres as unknown[]).map((g) => String(g).trim()).filter(Boolean)
    : [];
  if (fromGenres.length) return [...new Set(fromGenres)];

  const category = str(o.category);
  if (category && isBookGenreCategory(category)) return [category];

  if (Array.isArray(o.themes)) {
    const themes = (o.themes as unknown[]).map((t) => String(t).trim()).filter(Boolean);
    if (themes.length) return themes;
  }

  return [];
}

export function genresForSave(genres: string[] | undefined): string[] {
  return [...new Set((genres ?? []).map((g) => g.trim()).filter(Boolean))];
}

export function formatGenresForInput(genres: string[] | undefined): string {
  return (genres ?? []).join(', ');
}

export function parseGenresInput(input: string): string[] {
  return genresForSave(
    input
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

export function genresMatchHub(itemGenres: string[], hubGenres: string[] | undefined): boolean {
  if (!hubGenres?.length || !itemGenres.length) return false;
  const set = new Set(itemGenres.map(normGenre));
  return hubGenres.some((g) => set.has(normGenre(g)));
}

export function seoFieldsFromRaw(raw: unknown): UniversalSeoFields {
  const o = record(raw);
  if (!o) return {};
  const socialShareImage = str(o.socialShareImage) || str(o.ogImage) || undefined;
  return {
    seoTitle: str(o.seoTitle) || undefined,
    seoDescription: str(o.seoDescription) || undefined,
    tags: readTags(o),
    genres: readGenres(o),
    socialShareImage,
    ogImage: socialShareImage,
    canonicalUrl: str(o.canonicalUrl) || undefined,
  };
}

export function seoFieldsForSave(fields: UniversalSeoFields): Record<string, unknown> {
  const tags = (fields.tags ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean);
  const genres = genresForSave(fields.genres);
  const out: Record<string, unknown> = {};
  if (fields.seoTitle?.trim()) out.seoTitle = fields.seoTitle.trim();
  if (fields.seoDescription?.trim()) out.seoDescription = fields.seoDescription.trim();
  if (tags.length) out.tags = tags;
  if (genres.length) out.genres = genres;
  const shareImage = (fields.socialShareImage ?? fields.ogImage)?.trim();
  if (shareImage) {
    out.socialShareImage = shareImage;
    out.ogImage = shareImage;
  }
  if (fields.canonicalUrl?.trim()) out.canonicalUrl = fields.canonicalUrl.trim();
  return out;
}

function parseSimilarBooks(raw: unknown): SimilarBookRef[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const o = record(item);
    if (!o || !str(o.title)) return [];
    const ref: SimilarBookRef = { title: str(o.title) };
    const author = str(o.author);
    const internalUrl = str(o.internalUrl);
    const note = str(o.note);
    if (author) ref.author = author;
    if (internalUrl) ref.internalUrl = internalUrl;
    if (note) ref.note = note;
    return [ref];
  });
}

function parseSimilarAuthors(raw: unknown): SimilarAuthorRef[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const o = record(item);
    if (!o || !str(o.name)) return [];
    const ref: SimilarAuthorRef = { name: str(o.name) };
    const reason = str(o.reason);
    const url = str(o.url);
    if (reason) ref.reason = reason;
    if (url) ref.url = url;
    return [ref];
  });
}

function parseFaq(raw: unknown): ContentFaqItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const o = record(item);
      if (!o || !str(o.question) || !str(o.answer)) return null;
      return { question: str(o.question), answer: str(o.answer) };
    })
    .filter((x): x is ContentFaqItem => x != null);
}

export function reviewFieldsFromRaw(raw: unknown): ReviewEditorialFields {
  const o = record(raw);
  if (!o) return {};
  return {
    recommendedFor: str(o.recommendedFor) || undefined,
    notRecommendedFor: str(o.notRecommendedFor) || undefined,
    verdict: str(o.verdict) || undefined,
    similarBooks: parseSimilarBooks(o.similarBooks),
  };
}

export function recommendationFieldsFromRaw(raw: unknown): RecommendationEditorialFields {
  const o = record(raw);
  if (!o) return {};
  return {
    whoIsThisListFor: str(o.whoIsThisListFor) || undefined,
    quickAnswer: str(o.quickAnswer) || undefined,
    faq: parseFaq(o.faq),
  };
}

export function musingFieldsFromRaw(raw: unknown): MusingEditorialFields {
  const o = record(raw);
  if (!o) return {};
  const themes = Array.isArray(o.themes)
    ? (o.themes as unknown[]).map((t) => String(t).trim()).filter(Boolean)
    : [];
  return {
    keyTakeaway: str(o.keyTakeaway) || undefined,
    themes: themes.length ? themes : undefined,
  };
}

export function spotlightFieldsFromRaw(raw: unknown): AuthorSpotlightEditorialFields {
  const o = record(raw);
  if (!o) return {};
  const notableWorks = Array.isArray(o.notableWorks)
    ? (o.notableWorks as unknown[]).map((t) => String(t).trim()).filter(Boolean)
    : [];
  return {
    startHere: str(o.startHere) || undefined,
    whoIsHtml: str(o.whoIsHtml) || undefined,
    notableWorks: notableWorks.length ? notableWorks : undefined,
    similarAuthors: parseSimilarAuthors(o.similarAuthors),
  };
}

export function reviewFieldsForSave(f: ReviewEditorialFields): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (f.recommendedFor?.trim()) out.recommendedFor = f.recommendedFor.trim();
  if (f.notRecommendedFor?.trim()) out.notRecommendedFor = f.notRecommendedFor.trim();
  if (f.verdict?.trim()) out.verdict = f.verdict.trim();
  const books = (f.similarBooks ?? []).filter((b) => b.title.trim());
  if (books.length) {
    out.similarBooks = books.map((b) => ({
      title: b.title.trim(),
      author: b.author?.trim() || '',
      internalUrl: b.internalUrl?.trim() || '',
      note: b.note?.trim() || '',
    }));
  }
  return out;
}

export function recommendationFieldsForSave(f: RecommendationEditorialFields): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (f.whoIsThisListFor?.trim()) out.whoIsThisListFor = f.whoIsThisListFor.trim();
  if (f.quickAnswer?.trim()) out.quickAnswer = f.quickAnswer.trim();
  const faq = (f.faq ?? []).filter((q) => q.question.trim() && q.answer.trim());
  if (faq.length) out.faq = faq;
  return out;
}

export function musingFieldsForSave(f: MusingEditorialFields): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (f.keyTakeaway?.trim()) out.keyTakeaway = f.keyTakeaway.trim();
  const themes = (f.themes ?? []).map((t) => t.trim()).filter(Boolean);
  if (themes.length) out.themes = themes;
  return out;
}

export function spotlightFieldsForSave(f: AuthorSpotlightEditorialFields): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (f.whoIsHtml?.trim()) out.whoIsHtml = f.whoIsHtml.trim();
  if (f.startHere?.trim()) out.startHere = f.startHere.trim();
  const works = (f.notableWorks ?? []).map((w) => w.trim()).filter(Boolean);
  if (works.length) out.notableWorks = works;
  const authors = (f.similarAuthors ?? []).filter((a) => a.name.trim());
  if (authors.length) {
    out.similarAuthors = authors.map((a) => ({
      name: a.name.trim(),
      reason: a.reason?.trim() || '',
      url: a.url?.trim() || '',
    }));
  }
  return out;
}

/** Build AEO summary Q&A pairs for AI-search-friendly `<dl>` blocks. */
export function buildReviewAeoPairs(fields: ReviewEditorialFields & { bookTitle?: string }): { question: string; answer: string }[] {
  const pairs: { question: string; answer: string }[] = [];
  if (fields.verdict?.trim()) {
    pairs.push({
      question: fields.bookTitle ? `What is the verdict on ${fields.bookTitle}?` : 'What is the verdict?',
      answer: fields.verdict.trim(),
    });
  }
  if (fields.recommendedFor?.trim()) {
    pairs.push({ question: 'Who is this book recommended for?', answer: fields.recommendedFor.trim() });
  }
  if (fields.notRecommendedFor?.trim()) {
    pairs.push({ question: 'Who should skip this book?', answer: fields.notRecommendedFor.trim() });
  }
  return pairs;
}

export function buildRecommendationAeoPairs(fields: RecommendationEditorialFields & { title?: string }): { question: string; answer: string }[] {
  const pairs: { question: string; answer: string }[] = [];
  if (fields.quickAnswer?.trim()) {
    pairs.push({
      question: fields.title ? `What books are in ${fields.title}?` : 'What is this list about?',
      answer: fields.quickAnswer.trim(),
    });
  }
  if (fields.whoIsThisListFor?.trim()) {
    pairs.push({ question: 'Who is this book list for?', answer: fields.whoIsThisListFor.trim() });
  }
  for (const item of fields.faq ?? []) {
    if (item.question.trim() && item.answer.trim()) pairs.push(item);
  }
  return pairs;
}

export function buildMusingAeoPairs(fields: MusingEditorialFields & { title?: string }): { question: string; answer: string }[] {
  const pairs: { question: string; answer: string }[] = [];
  if (fields.keyTakeaway?.trim()) {
    pairs.push({
      question: fields.title ? `What is the key takeaway from ${fields.title}?` : 'What is the key takeaway?',
      answer: fields.keyTakeaway.trim(),
    });
  }
  if (fields.themes?.length) {
    pairs.push({ question: 'What themes does this piece explore?', answer: fields.themes.join(', ') });
  }
  return pairs;
}

export function buildSpotlightAeoPairs(
  fields: AuthorSpotlightEditorialFields & { name?: string; tagline?: string }
): { question: string; answer: string }[] {
  const pairs: { question: string; answer: string }[] = [];
  if (fields.whoIsHtml?.trim()) {
    pairs.push({
      question: fields.name ? `Who is ${fields.name}?` : 'Who is this author?',
      answer: fields.whoIsHtml.trim(),
    });
  } else if (fields.tagline?.trim()) {
    pairs.push({
      question: fields.name ? `Who is ${fields.name}?` : 'Who is this author?',
      answer: fields.tagline.trim(),
    });
  }
  if (fields.startHere?.trim()) {
    pairs.push({
      question: fields.name ? `Where should I start with ${fields.name}?` : 'Where should I start?',
      answer: fields.startHere.trim(),
    });
  }
  if (fields.notableWorks?.length) {
    const items = fields.notableWorks.map((w) => `<li>${w.replace(/</g, '&lt;')}</li>`).join('');
    pairs.push({
      question: fields.name ? `What are notable works by ${fields.name}?` : 'What are their notable works?',
      answer: `<ul class="list-disc list-inside space-y-1">${items}</ul>`,
    });
  }
  return pairs;
}
