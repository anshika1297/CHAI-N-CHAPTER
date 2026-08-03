import { Book, type IBook, type IBookSourceRef } from '../models/Book.js';
import type { ExtractedBook } from './bookExtract.js';
import { AuthorSpotlight } from '../models/AuthorSpotlight.js';
import { Page } from '../models/Page.js';
import {
  extractBookFromReview,
  extractBooksFromRecommendationList,
  extractBooksFromSpotlight,
  refKey,
} from './bookExtract.js';
import type { ShopPurchaseLink } from '../utils/shopParse.js';

type Accumulator = {
  bookSlug: string;
  title: string;
  author: string;
  coverImage?: string;
  genre?: string;
  description?: string;
  isbn?: string;
  purchaseLinks: ShopPurchaseLink[];
  goodreadsUrl?: string;
  sourceRefs: IBookSourceRef[];
  tags: Set<string>;
  genres: Set<string>;
};

function record(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function mergePurchaseLinks(existing: ShopPurchaseLink[], incoming: ShopPurchaseLink[]): ShopPurchaseLink[] {
  const byUrl = new Map<string, ShopPurchaseLink>();
  for (const link of [...existing, ...incoming]) {
    if (link.url) byUrl.set(link.url, link);
  }
  return [...byUrl.values()];
}

function upsertExtracted(map: Map<string, Accumulator>, extracted: ExtractedBook): void {
  const key = extracted.bookSlug.toLowerCase();
  const hit = map.get(key);
  if (!hit) {
    map.set(key, {
      bookSlug: key,
      title: extracted.title,
      author: extracted.author,
      coverImage: extracted.coverImage,
      genre: extracted.genre,
      description: extracted.description,
      isbn: extracted.isbn,
      purchaseLinks: [...extracted.purchaseLinks],
      goodreadsUrl: extracted.goodreadsUrl,
      sourceRefs: [extracted.sourceRef],
      tags: new Set(extracted.tags),
      genres: new Set(extracted.genres ?? (extracted.genre ? [extracted.genre] : [])),
    });
    return;
  }

  if (extracted.title) hit.title = extracted.title;
  if (extracted.author) hit.author = extracted.author;
  if (extracted.coverImage) hit.coverImage = extracted.coverImage;
  if (extracted.genre) hit.genre = extracted.genre;
  if (extracted.description) hit.description = extracted.description;
  if (extracted.isbn) hit.isbn = extracted.isbn;
  if (extracted.goodreadsUrl) hit.goodreadsUrl = extracted.goodreadsUrl;
  hit.purchaseLinks = mergePurchaseLinks(hit.purchaseLinks, extracted.purchaseLinks);
  for (const t of extracted.tags) hit.tags.add(t);
  for (const g of extracted.genres ?? (extracted.genre ? [extracted.genre] : [])) {
    if (g?.trim()) hit.genres.add(g.trim());
  }
  if (extracted.genre?.trim()) hit.genres.add(extracted.genre.trim());

  const rk = refKey(extracted.sourceRef);
  if (!hit.sourceRefs.some((r) => refKey(r) === rk)) {
    hit.sourceRefs.push(extracted.sourceRef);
  }
}

async function collectAllExtracted(): Promise<Map<string, Accumulator>> {
  const map = new Map<string, Accumulator>();

  const blogPage = await Page.findOne({ slug: 'blog' }).lean();
  const posts =
    blogPage?.content && typeof blogPage.content === 'object' && Array.isArray((blogPage.content as Record<string, unknown>).posts)
      ? ((blogPage.content as Record<string, unknown>).posts as unknown[])
      : [];
  for (const raw of posts) {
    const post = record(raw);
    if (!post) continue;
    const extracted = extractBookFromReview(post);
    if (extracted) upsertExtracted(map, extracted);
  }

  const recPage = await Page.findOne({ slug: 'recommendations' }).lean();
  const lists =
    recPage?.content &&
    typeof recPage.content === 'object' &&
    Array.isArray((recPage.content as Record<string, unknown>).items)
      ? ((recPage.content as Record<string, unknown>).items as unknown[])
      : [];
  for (const raw of lists) {
    const item = record(raw);
    if (!item) continue;
    for (const extracted of extractBooksFromRecommendationList(item)) {
      upsertExtracted(map, extracted);
    }
  }

  const spotlights = await AuthorSpotlight.find({}).lean();
  for (const raw of spotlights) {
    const extractedList = extractBooksFromSpotlight(raw as Parameters<typeof extractBooksFromSpotlight>[0]);
    for (const extracted of extractedList) {
      upsertExtracted(map, extracted);
    }
  }

  return map;
}

/** Full catalog rebuild from all CMS sources. Idempotent. */
export async function rebuildBookCatalog(): Promise<{ upserted: number; removed: number }> {
  const map = await collectAllExtracted();
  const activeSlugs = [...map.keys()];
  let upserted = 0;

  for (const acc of map.values()) {
    await Book.findOneAndUpdate(
      { bookSlug: acc.bookSlug },
      {
        bookSlug: acc.bookSlug,
        title: acc.title,
        author: acc.author,
        coverImage: acc.coverImage ?? '',
        genre: acc.genre ?? [...acc.genres][0] ?? '',
        genres: [...acc.genres],
        description: acc.description ?? '',
        isbn: acc.isbn ?? '',
        purchaseLinks: acc.purchaseLinks,
        goodreadsUrl: acc.goodreadsUrl ?? '',
        sourceRefs: acc.sourceRefs,
        tags: [...acc.tags],
      },
      { upsert: true, new: true }
    );
    upserted += 1;
  }

  const removed =
    activeSlugs.length > 0
      ? (await Book.deleteMany({ bookSlug: { $nin: activeSlugs } })).deletedCount ?? 0
      : (await Book.deleteMany({})).deletedCount ?? 0;

  return { upserted, removed };
}

export function serializeBook(doc: IBook) {
  return {
    bookSlug: doc.bookSlug,
    title: doc.title,
    author: doc.author,
    coverImage: doc.coverImage || undefined,
    genre: doc.genre || undefined,
    description: doc.description || undefined,
    isbn: doc.isbn || undefined,
    purchaseLinks: doc.purchaseLinks ?? [],
    goodreadsUrl: doc.goodreadsUrl || undefined,
    sourceRefs: doc.sourceRefs ?? [],
    tags: doc.tags ?? [],
    genres: doc.genres?.length ? doc.genres : doc.genre ? [doc.genre] : [],
    referenceCount: doc.sourceRefs?.length ?? 0,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
