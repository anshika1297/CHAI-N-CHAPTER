import { Page } from '../models/Page.js';
import { AuthorSpotlight } from '../models/AuthorSpotlight.js';
import { Book } from '../models/Book.js';
import { filterPublishedPageItems } from '../utils/pageContentPublish.js';
import { readGenresFromContent } from '../utils/genres.js';

export type GenreIndexEntry = {
  slug: string;
  label: string;
  count: number;
};

function genreToSlug(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function bump(map: Map<string, GenreIndexEntry>, label: string, amount = 1): void {
  const trimmed = label.trim();
  if (!trimmed) return;
  const slug = genreToSlug(trimmed);
  if (!slug) return;
  const hit = map.get(slug);
  if (hit) {
    hit.count += amount;
  } else {
    map.set(slug, { slug, label: trimmed, count: amount });
  }
}

/** Distinct book genres from published CMS content + book catalog. */
export async function collectGenreIndex(): Promise<GenreIndexEntry[]> {
  const counts = new Map<string, GenreIndexEntry>();

  const addFromContent = (raw: Record<string, unknown>) => {
    for (const g of readGenresFromContent(raw)) {
      bump(counts, g);
    }
  };

  try {
    const blog = await Page.findOne({ slug: 'blog' }).lean();
    const posts =
      blog?.content && typeof blog.content === 'object' && Array.isArray((blog.content as { posts?: unknown[] }).posts)
        ? (blog.content as { posts: unknown[] }).posts
        : [];
    for (const p of filterPublishedPageItems(posts as Record<string, unknown>[])) {
      addFromContent(p);
    }
  } catch {
    /* skip */
  }

  try {
    const rec = await Page.findOne({ slug: 'recommendations' }).lean();
    const items =
      rec?.content && typeof rec.content === 'object' && Array.isArray((rec.content as { items?: unknown[] }).items)
        ? (rec.content as { items: unknown[] }).items
        : [];
    for (const p of filterPublishedPageItems(items as Record<string, unknown>[])) {
      addFromContent(p);
    }
  } catch {
    /* skip */
  }

  try {
    const mus = await Page.findOne({ slug: 'musings' }).lean();
    const items =
      mus?.content && typeof mus.content === 'object' && Array.isArray((mus.content as { items?: unknown[] }).items)
        ? (mus.content as { items: unknown[] }).items
        : [];
    for (const p of filterPublishedPageItems(items as Record<string, unknown>[])) {
      addFromContent(p);
    }
  } catch {
    /* skip */
  }

  try {
    const spotlights = await AuthorSpotlight.find({ isPublished: { $ne: false } }).lean();
    for (const s of spotlights) {
      if (Array.isArray(s.genres)) {
        for (const g of s.genres) bump(counts, String(g));
      }
      addFromContent(s as unknown as Record<string, unknown>);
    }
  } catch {
    /* skip */
  }

  try {
    const books = await Book.find({}).select('genre genres').lean();
    for (const b of books) {
      if (typeof b.genre === 'string' && b.genre.trim()) bump(counts, b.genre);
      if (Array.isArray(b.genres)) {
        for (const g of b.genres) bump(counts, String(g));
      }
    }
  } catch {
    /* skip */
  }

  return [...counts.values()].sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label)
  );
}
