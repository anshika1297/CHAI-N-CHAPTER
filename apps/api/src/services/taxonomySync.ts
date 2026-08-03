import { LibraryTaxonomy } from '../models/LibraryTaxonomy.js';
import { librarySlugify, type TaxonomyType } from '../config/libraryEnums.js';

/** Book fields → Master Data taxonomy types (excludes hook-pattern — those are saved from Hook Studio). */
const FIELD_TO_TYPE: { field: string; type: TaxonomyType; isArray: boolean }[] = [
  { field: 'genres', type: 'genre', isArray: true },
  { field: 'subgenres', type: 'subgenre', isArray: true },
  { field: 'themes', type: 'theme', isArray: true },
  { field: 'tropes', type: 'trope', isArray: true },
  { field: 'moods', type: 'mood', isArray: true },
  { field: 'publisher', type: 'publisher', isArray: false },
  { field: 'country', type: 'country', isArray: false },
  { field: 'originalLanguage', type: 'language', isArray: false },
  { field: 'tags', type: 'tag', isArray: true },
  { field: 'collections', type: 'collection', isArray: true },
  { field: 'series', type: 'series', isArray: false },
];

function collectNames(source: Record<string, unknown>): Map<TaxonomyType, Set<string>> {
  const byType = new Map<TaxonomyType, Set<string>>();
  for (const { field, type, isArray } of FIELD_TO_TYPE) {
    const set = byType.get(type) ?? new Set<string>();
    const raw = source[field];
    if (isArray && Array.isArray(raw)) {
      for (const v of raw) {
        const name = String(v ?? '').trim();
        if (name) set.add(name);
      }
    } else if (!isArray && typeof raw === 'string') {
      const name = raw.trim();
      if (name) set.add(name);
    }
    if (set.size) byType.set(type, set);
  }
  return byType;
}

/**
 * Upsert Master Data entries from a book's classification fields.
 * Safe to call often — unique (type, slug) index; duplicates are skipped.
 */
export async function syncTaxonomyFromBook(
  book: Record<string, unknown>
): Promise<{ created: number; skipped: number }> {
  const byType = collectNames(book);
  let created = 0;
  let skipped = 0;

  for (const [type, names] of byType) {
    for (const name of names) {
      const slug = librarySlugify(name);
      if (!slug) {
        skipped++;
        continue;
      }
      try {
        // eslint-disable-next-line no-await-in-loop
        const result = await LibraryTaxonomy.updateOne(
          { type, slug },
          { $setOnInsert: { type, name, slug, description: '' } },
          { upsert: true }
        );
        if (result.upsertedCount > 0) created++;
        else skipped++;
      } catch {
        // Race on unique index — treat as already present.
        skipped++;
      }
    }
  }

  return { created, skipped };
}

/** Backfill Master Data from many books (import / sync-all). */
export async function syncTaxonomyFromBooks(
  books: Record<string, unknown>[]
): Promise<{ created: number; skipped: number; scanned: number }> {
  // Aggregate first to minimise DB writes.
  const merged = new Map<TaxonomyType, Set<string>>();
  for (const book of books) {
    const byType = collectNames(book);
    for (const [type, names] of byType) {
      const set = merged.get(type) ?? new Set<string>();
      for (const n of names) set.add(n);
      merged.set(type, set);
    }
  }

  let created = 0;
  let skipped = 0;
  for (const [type, names] of merged) {
    for (const name of names) {
      const slug = librarySlugify(name);
      if (!slug) {
        skipped++;
        continue;
      }
      try {
        // eslint-disable-next-line no-await-in-loop
        const result = await LibraryTaxonomy.updateOne(
          { type, slug },
          { $setOnInsert: { type, name, slug, description: '' } },
          { upsert: true }
        );
        if (result.upsertedCount > 0) created++;
        else skipped++;
      } catch {
        skipped++;
      }
    }
  }

  return { created, skipped, scanned: books.length };
}
