import { Book } from '../models/Book.js';
import { serializeBook } from './bookCatalogSync.js';
import { suggestBookSlug } from '../utils/shopSlugify.js';
import type { IBook } from '../models/Book.js';

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Find a catalog book by title + author for admin autofill.
 * Prefer exact slug match, then case-insensitive title + fuzzy author.
 */
export async function lookupCatalogBook(titleRaw: string, authorRaw: string) {
  const title = titleRaw.trim();
  const author = authorRaw.trim();
  if (!title || !author) return null;

  const slug = suggestBookSlug(title, author);
  if (slug) {
    const bySlug = await Book.findOne({ bookSlug: slug }).lean();
    if (bySlug) return serializeBook(bySlug as unknown as IBook);
  }

  const titleRe = new RegExp(`^${escapeRegex(title)}$`, 'i');
  const authorRe = new RegExp(escapeRegex(author), 'i');
  const candidates = await Book.find({ title: titleRe, author: authorRe })
    .sort({ updatedAt: -1 })
    .limit(8)
    .lean();

  if (!candidates.length) {
    // Looser: title contains + author contains
    const loose = await Book.find({
      title: new RegExp(escapeRegex(title), 'i'),
      author: authorRe,
    })
      .sort({ updatedAt: -1 })
      .limit(8)
      .lean();
    if (!loose.length) return null;
    const wantTitle = norm(title);
    const wantAuthor = norm(author);
    const best =
      loose.find((b) => norm(b.title) === wantTitle && norm(b.author).includes(wantAuthor)) ||
      loose.find((b) => norm(b.title) === wantTitle) ||
      loose[0];
    return serializeBook(best as unknown as IBook);
  }

  const wantAuthor = norm(author);
  const exactAuthor =
    candidates.find((b) => norm(b.author) === wantAuthor) || candidates[0];
  return serializeBook(exactAuthor as unknown as IBook);
}
