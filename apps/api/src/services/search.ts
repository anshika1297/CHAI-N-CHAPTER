import type {
  GroupedSearchResults,
  SearchGroup,
  SearchResponse,
  SearchResultItem,
  SearchTagHit,
} from '../types/search.js';
import {
  fuzzySimilarity,
  normalizeQuery,
  scoreField,
  scoreTokenList,
  tokenize,
} from '../utils/searchMatch.js';
import { buildSearchIndex, type SearchIndexDocument } from './searchIndex.js';

const EMPTY_GROUPS = (): GroupedSearchResults => ({
  reviews: [],
  recommendations: [],
  musings: [],
  'author-spotlight': [],
  shop: [],
});

function scoreDocument(doc: SearchIndexDocument, query: string): { score: number; reason?: string } {
  const q = normalizeQuery(query);
  if (!q) return { score: 0 };

  let total = 0;
  let reason: string | undefined;

  const apply = (field: { score: number; reason?: string }, label: string) => {
    if (field.score > 0 && field.score >= total) {
      if (field.score > total) reason = label;
      total = Math.max(total, field.score);
    }
    total += field.score * 0.15;
  };

  const title = scoreField(doc.title, q, { exact: 1000, prefix: 700, contains: 500, fuzzy: 350 });
  if (title.score) {
    total = title.score;
    reason = 'title';
  }

  for (const bt of doc.bookTitles) {
    const book = scoreField(bt, q, { exact: 900, prefix: 650, contains: 600, fuzzy: 280 });
    apply(book, 'book');
  }

  for (const author of [...doc.bookAuthors, ...doc.authorNames]) {
    const a = scoreField(author, q, { exact: 850, prefix: 600, contains: 550, fuzzy: 260 });
    apply(a, 'author');
  }

  const tagScore = scoreTokenList(doc.tags, q, { exact: 800, contains: 500, fuzzy: 240 });
  apply(tagScore, 'tag');

  const genreScore = scoreTokenList(doc.genres, q, { exact: 450, contains: 400, fuzzy: 200 });
  apply(genreScore, 'genre');

  if (doc.category) {
    const cat = scoreField(doc.category, q, { exact: 450, prefix: 400, contains: 380, fuzzy: 180 });
    apply(cat, 'genre');
  }

  const body = scoreField(doc.bodyText.slice(0, 2000), q, {
    exact: 300,
    prefix: 280,
    contains: 300,
    fuzzy: 150,
  });
  if (body.score && total < 400) {
    total += body.score;
    if (!reason) reason = 'content';
  } else if (body.score) {
    total += body.score * 0.25;
  }

  if (doc.subtitle) {
    const sub = scoreField(doc.subtitle, q, { exact: 400, prefix: 350, contains: 320, fuzzy: 160 });
    total += sub.score * 0.2;
  }

  const qTokens = tokenize(q);
  if (qTokens.length > 1) {
    const blob = normalizeQuery(
      [doc.title, ...doc.bookTitles, ...doc.authorNames, ...doc.tags, doc.bodyText.slice(0, 500)].join(' ')
    );
    if (qTokens.every((t) => blob.includes(t))) total += 120;
  }

  if (total < 180) {
    const blobSim = fuzzySimilarity(doc.title, q);
    if (blobSim >= 0.6) {
      total = Math.max(total, Math.round(200 * blobSim));
      reason = reason || 'fuzzy';
    }
  }

  return { score: Math.round(total), reason };
}

function scoreTags(tagSlugs: Map<string, string>, query: string): SearchTagHit[] {
  const q = normalizeQuery(query);
  if (!q) return [];
  const hits: SearchTagHit[] = [];
  for (const [slug, label] of tagSlugs) {
    const labelScore = scoreField(label, q, { exact: 820, prefix: 600, contains: 520, fuzzy: 300 });
    const slugScore = scoreField(slug.replace(/-/g, ' '), q, {
      exact: 800,
      prefix: 580,
      contains: 500,
      fuzzy: 280,
    });
    const score = Math.max(labelScore.score, slugScore.score);
    if (score >= 200) {
      hits.push({ slug, label, href: `/tags/${slug}`, score });
    }
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, 8);
}

export async function runSearch(
  query: string,
  opts: { limitPerGroup?: number; minScore?: number } = {}
): Promise<SearchResponse> {
  const q = normalizeQuery(query);
  const limitPerGroup = Math.min(50, Math.max(1, opts.limitPerGroup ?? 8));
  const minScore = opts.minScore ?? 150;

  if (!q || q.length < 2) {
    return { query: q, total: 0, tags: [], groups: EMPTY_GROUPS() };
  }

  const { docs, tagSlugs } = await buildSearchIndex();
  const tags = scoreTags(tagSlugs, q);

  const scored: SearchResultItem[] = [];
  for (const doc of docs) {
    const { score, reason } = scoreDocument(doc, q);
    if (score < minScore) continue;
    scored.push({
      id: doc.id,
      group: doc.group,
      title: doc.title,
      subtitle: doc.subtitle,
      excerpt: doc.excerpt,
      href: doc.href,
      score,
      matchReason: reason,
    });
  }

  scored.sort((a, b) => b.score - a.score);

  const groups = EMPTY_GROUPS();
  const counts: Record<SearchGroup, number> = {
    reviews: 0,
    recommendations: 0,
    musings: 0,
    'author-spotlight': 0,
    shop: 0,
  };

  for (const item of scored) {
    if (counts[item.group] >= limitPerGroup) continue;
    groups[item.group].push(item);
    counts[item.group]++;
  }

  const total =
    groups.reviews.length +
    groups.recommendations.length +
    groups.musings.length +
    groups['author-spotlight'].length +
    groups.shop.length +
    tags.length;

  return { query: q, total, tags, groups };
}
