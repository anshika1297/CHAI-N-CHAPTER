import { Book, type BookContentType, type IBook } from '../models/Book.js';
import { serializeBook } from './bookCatalogSync.js';

export type BookDirectorySort = 'az' | 'recent' | 'referenced';

export type BookDirectoryFacets = {
  authors: string[];
  genres: string[];
  contentTypes: BookContentType[];
};

export type BookDirectoryQuery = {
  q?: string;
  author?: string;
  genre?: string;
  /** Comma-separated — match any label on genre or genres[]. */
  genres?: string;
  contentType?: BookContentType;
  sort?: BookDirectorySort;
  page?: number;
  limit?: number;
  includeFacets?: boolean;
};

const CONTENT_TYPES: BookContentType[] = ['blog', 'recommendations', 'author-spotlight'];

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildFilter(query: BookDirectoryQuery): Record<string, unknown> {
  const and: Record<string, unknown>[] = [];

  const q = query.q?.trim();
  if (q) {
    const re = new RegExp(escapeRegex(q), 'i');
    and.push({
      $or: [{ title: re }, { author: re }, { genre: re }, { genres: re }, { tags: re }],
    });
  }

  const author = query.author?.trim();
  if (author) {
    and.push({ author: new RegExp(`^${escapeRegex(author)}$`, 'i') });
  }

  const genre = query.genre?.trim();
  if (genre) {
    const re = new RegExp(`^${escapeRegex(genre)}$`, 'i');
    and.push({ $or: [{ genre: re }, { genres: re }] });
  }

  const genresRaw = query.genres?.trim();
  if (genresRaw) {
    const labels = genresRaw.split(',').map((g) => g.trim()).filter(Boolean);
    if (labels.length) {
      and.push({
        $or: labels.flatMap((label) => {
          const re = new RegExp(`^${escapeRegex(label)}$`, 'i');
          return [{ genre: re }, { genres: re }];
        }),
      });
    }
  }

  const contentType = query.contentType?.trim() as BookContentType | undefined;
  if (contentType && CONTENT_TYPES.includes(contentType)) {
    and.push({ sourceRefs: { $elemMatch: { contentType } } });
  }

  if (and.length === 0) return {};
  if (and.length === 1) return and[0];
  return { $and: and };
}

function sortStage(sort: BookDirectorySort): Record<string, 1 | -1> {
  switch (sort) {
    case 'recent':
      return { createdAt: -1, title: 1 };
    case 'referenced':
      return { refCount: -1, title: 1 };
    default:
      return { title: 1 };
  }
}

async function collectFacets(): Promise<BookDirectoryFacets> {
  const [authors, genreDocs] = await Promise.all([
    Book.distinct('author', { author: { $nin: ['', null] } }),
    Book.find({}, { genre: 1, genres: 1 }).lean(),
  ]);
  const genreSet = new Set<string>();
  for (const doc of genreDocs) {
    if (typeof doc.genre === 'string' && doc.genre.trim()) genreSet.add(doc.genre.trim());
    if (Array.isArray(doc.genres)) {
      for (const g of doc.genres) {
        const label = String(g).trim();
        if (label) genreSet.add(label);
      }
    }
  }
  return {
    authors: authors.map(String).filter(Boolean).sort((a, b) => a.localeCompare(b)),
    genres: [...genreSet].sort((a, b) => a.localeCompare(b)),
    contentTypes: CONTENT_TYPES,
  };
}

export async function listBookDirectory(query: BookDirectoryQuery) {
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(500, Math.max(1, query.limit ?? 100));
  const skip = (page - 1) * limit;
  const sort = query.sort ?? 'az';
  const filter = buildFilter(query);

  const [total, facets, docs] = await Promise.all([
    Book.countDocuments(filter),
    query.includeFacets ? collectFacets() : Promise.resolve(undefined),
    sort === 'referenced'
      ? Book.aggregate([
          { $match: filter },
          { $addFields: { refCount: { $size: { $ifNull: ['$sourceRefs', []] } } } },
          { $sort: sortStage(sort) },
          { $skip: skip },
          { $limit: limit },
        ])
      : Book.find(filter)
          .sort(sortStage(sort))
          .skip(skip)
          .limit(limit)
          .lean(),
  ]);

  const books = docs.map((doc) => serializeBook(doc as unknown as IBook));

  return {
    books,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    facets,
  };
}
