import { Book, type IBook, type IBookSourceRef } from '../models/Book.js';
import { serializeBook } from './bookCatalogSync.js';

export type RelatedBooksQuery = {
  /** Primary seed — loaded from catalog when present */
  bookSlug?: string;
  excludeSlugs?: string[];
  author?: string;
  genre?: string;
  tags?: string[];
  /** Recommendation list slug — boosts books from the same curated list */
  recommendationSlug?: string;
  limit?: number;
};

export type RelatedBookResult = ReturnType<typeof serializeBook> & {
  matchScore: number;
  matchReasons: string[];
};

function norm(s: string | undefined): string {
  return (s ?? '').trim().toLowerCase();
}

function normAuthor(s: string | undefined): string {
  return norm(s).replace(/\s+/g, ' ');
}

function listSlugs(refs: IBookSourceRef[]): string[] {
  return refs.filter((r) => r.contentType === 'recommendations').map((r) => norm(r.contentSlug));
}

type Seed = {
  bookSlug?: string;
  author: string;
  genre: string;
  tags: Set<string>;
  listSlugs: Set<string>;
  sourceRefs: IBookSourceRef[];
};

async function buildSeed(query: RelatedBooksQuery): Promise<Seed> {
  const seed: Seed = {
    bookSlug: query.bookSlug ? norm(query.bookSlug) : undefined,
    author: normAuthor(query.author),
    genre: norm(query.genre),
    tags: new Set((query.tags ?? []).map(norm).filter(Boolean)),
    listSlugs: new Set(query.recommendationSlug ? [norm(query.recommendationSlug)] : []),
    sourceRefs: [],
  };

  if (seed.bookSlug) {
    const doc = await Book.findOne({ bookSlug: seed.bookSlug }).lean();
    if (doc) {
      const book = doc as unknown as IBook;
      if (!seed.author && book.author) seed.author = normAuthor(book.author);
      if (!seed.genre && book.genre) seed.genre = norm(book.genre);
      for (const t of book.tags ?? []) seed.tags.add(norm(t));
      for (const ls of listSlugs(book.sourceRefs ?? [])) seed.listSlugs.add(ls);
      seed.sourceRefs = book.sourceRefs ?? [];
    }
  }

  return seed;
}

function scoreCandidate(seed: Seed, candidate: IBook): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  const candAuthor = normAuthor(candidate.author);
  if (seed.author && candAuthor && seed.author === candAuthor) {
    score += 100;
    reasons.push('same-author');
  }

  const candGenre = norm(candidate.genre);
  if (seed.genre && candGenre && seed.genre === candGenre) {
    score += 50;
    reasons.push('same-genre');
  }

  const candTags = (candidate.tags ?? []).map(norm).filter(Boolean);
  const sharedTags = candTags.filter((t) => seed.tags.has(t));
  if (sharedTags.length) {
    score += sharedTags.length * 15;
    reasons.push('shared-tags');
  }

  const candLists = listSlugs(candidate.sourceRefs ?? []);
  const sharedLists = candLists.filter((l) => seed.listSlugs.has(l));
  if (sharedLists.length) {
    score += sharedLists.length * 25;
    reasons.push('same-list');
  }

  // Tie-break: more inbound references (popular on site)
  score += Math.min((candidate.sourceRefs?.length ?? 0) * 2, 10);

  return { score, reasons };
}

/** Find related catalog books — priority: author → genre → tags → same recommendation list. */
export async function findRelatedBooks(query: RelatedBooksQuery): Promise<RelatedBookResult[]> {
  const limit = Math.min(12, Math.max(1, query.limit ?? 6));
  const exclude = new Set(
    [...(query.excludeSlugs ?? []), query.bookSlug]
      .map((s) => norm(s))
      .filter(Boolean)
  );

  const seed = await buildSeed(query);
  if (!seed.author && !seed.genre && !seed.tags.size && !seed.listSlugs.size && !seed.bookSlug) {
    return [];
  }

  const candidates = await Book.find({
    bookSlug: { $nin: [...exclude] },
  })
    .limit(300)
    .lean();

  const scored = (candidates as unknown as IBook[])
    .map((book) => {
      const { score, reasons } = scoreCandidate(seed, book);
      return { book, score, reasons };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ book, score, reasons }) => ({
    ...serializeBook(book),
    matchScore: score,
    matchReasons: reasons,
  }));
}
