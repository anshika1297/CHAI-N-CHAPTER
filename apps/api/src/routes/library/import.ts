import { Router, Request, Response } from 'express';
import { LibraryBook } from '../../models/LibraryBook.js';
import { LibraryAuthor } from '../../models/LibraryAuthor.js';
import { requireAuth } from '../../middlewares/auth.js';
import { mapGoodreadsCsv, MappedImportBook } from '../../services/libraryImport.js';
import { mapBulkTemplateCsv, createFieldsFromTemplateBook, upsertFieldsFromTemplateBook, missingBulkTemplateHeaders, validateTemplateBookRow, type BulkTemplateBook } from '../../services/libraryBulkTemplate.js';
import {
  mapSiteBooksForLibraryImport,
  markSiteImportDuplicates,
  type SiteImportBook,
} from '../../services/librarySiteImport.js';
import { normalizeTitleAuthor } from '../../services/libraryMerge.js';
import { librarySlugify } from '../../config/libraryEnums.js';
import { syncTaxonomyFromBooks } from '../../services/taxonomySync.js';

const router = Router();
router.use(requireAuth);

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function intOrUndef(v: unknown): number | undefined {
  const n = typeof v === 'number' ? v : parseInt(String(v ?? ''), 10);
  return Number.isFinite(n) ? n : undefined;
}

/** Flag books that already exist by slug, ISBN, or normalized title+author. */
async function markDuplicates(books: MappedImportBook[]): Promise<(MappedImportBook & { isDuplicate: boolean })[]> {
  const slugs = books.map((b) => b.slug);
  const isbns = books.map((b) => b.isbn).filter((x): x is string => Boolean(x));
  const [existingSlugs, existingIsbns, existingLean] = await Promise.all([
    LibraryBook.find({ slug: { $in: slugs } }).distinct('slug'),
    isbns.length ? LibraryBook.find({ isbn: { $in: isbns } }).distinct('isbn') : Promise.resolve([] as string[]),
    LibraryBook.find({}).select('title author slug isbn').lean(),
  ]);
  const slugSet = new Set(existingSlugs as string[]);
  const isbnSet = new Set(existingIsbns as string[]);
  const taSet = new Set(
    existingLean.map((b) => normalizeTitleAuthor(b.title || '', b.author || ''))
  );
  return books.map((b) => ({
    ...b,
    isDuplicate:
      slugSet.has(b.slug) ||
      (Boolean(b.isbn) && isbnSet.has(b.isbn as string)) ||
      taSet.has(normalizeTitleAuthor(b.title, b.author)),
  }));
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function findExistingLibraryBook(b: {
  slug: string;
  isbn?: string;
  title: string;
  author: string;
}): Promise<{ _id: unknown } | null> {
  if (b.isbn) {
    const byIsbn = await LibraryBook.findOne({ isbn: b.isbn }).select('_id').lean();
    if (byIsbn) return byIsbn;
  }
  const bySlug = await LibraryBook.findOne({ slug: b.slug }).select('_id').lean();
  if (bySlug) return bySlug;

  // Soft title+author match (casing / punctuation drift between export & sheet).
  if (b.title.trim()) {
    const titleRe = new RegExp(`^${escapeRegex(b.title.trim())}$`, 'i');
    const authorRe = b.author.trim()
      ? new RegExp(`^${escapeRegex(b.author.trim())}$`, 'i')
      : undefined;
    const byTitleAuthor = await LibraryBook.findOne({
      title: titleRe,
      ...(authorRe ? { author: authorRe } : {}),
    })
      .select('_id')
      .lean();
    if (byTitleAuthor) return byTitleAuthor;
  }

  // Normalized match (ignores punctuation / extra spaces) — catches Goodreads vs Excel drift.
  const want = normalizeTitleAuthor(b.title, b.author);
  if (want) {
    const candidates = await LibraryBook.find({
      title: new RegExp(escapeRegex(b.title.trim()).replace(/\\ /g, '.*'), 'i'),
    })
      .select('_id title author')
      .limit(25)
      .lean();
    for (const c of candidates) {
      if (normalizeTitleAuthor(c.title || '', c.author || '') === want) {
        return c;
      }
    }
  }
  return null;
}

/** Build an in-memory match index once per import batch (ISBN → slug → normalized title+author). */
async function buildLibraryMatchIndex(): Promise<{
  find: (b: { slug: string; isbn?: string; title: string; author: string }) => string | null;
  register: (id: string, b: { slug: string; isbn?: string; title: string; author: string }) => void;
}> {
  const books = await LibraryBook.find({})
    .select('_id slug isbn title author')
    .lean();
  const byIsbn = new Map<string, string>();
  const bySlug = new Map<string, string>();
  const byTa = new Map<string, string>();
  for (const doc of books) {
    const id = String(doc._id);
    if (doc.isbn) byIsbn.set(String(doc.isbn).trim(), id);
    if (doc.slug) bySlug.set(String(doc.slug).trim().toLowerCase(), id);
    byTa.set(normalizeTitleAuthor(doc.title || '', doc.author || ''), id);
  }
  return {
    find(b) {
      if (b.isbn && byIsbn.has(b.isbn)) return byIsbn.get(b.isbn)!;
      if (b.slug && bySlug.has(b.slug.toLowerCase())) return bySlug.get(b.slug.toLowerCase())!;
      const ta = normalizeTitleAuthor(b.title, b.author);
      if (ta && byTa.has(ta)) return byTa.get(ta)!;
      return null;
    },
    register(id, b) {
      if (b.isbn) byIsbn.set(b.isbn, id);
      if (b.slug) bySlug.set(b.slug.toLowerCase(), id);
      byTa.set(normalizeTitleAuthor(b.title, b.author), id);
    },
  };
}

/** Upsert merge: full Excel column sync (sheet is source of truth for those fields). */
function enrichmentUpdateFromTemplate(b: BulkTemplateBook): Record<string, unknown> {
  return upsertFieldsFromTemplateBook(b);
}

/**
 * POST /api/library/import/goodreads
 * Body: { csv, commit?, autoCreateAuthors?, offset?, limit? }
 *
 * - commit=false (default): parse + preview with duplicate flags (no writes).
 * - commit=true: insert non-duplicate rows one by one (a bad row never aborts
 *   the rest). Pass offset+limit to process the file in batches so the client
 *   can render a live progress bar and an accurate per-row outcome report.
 */
router.post('/goodreads', async (req: Request, res: Response): Promise<void> => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const csv = str(body.csv);
  if (!csv) {
    res.status(400).json({ error: 'CSV content is required' });
    return;
  }

  try {
    const mapped = mapGoodreadsCsv(csv);

    // ---- Preview mode: no writes ----
    if (!body.commit) {
      const withDupes = await markDuplicates(mapped);
      res.status(200).json({
        preview: true,
        total: withDupes.length,
        duplicates: withDupes.filter((b) => b.isDuplicate).length,
        books: withDupes.slice(0, 500),
      });
      return;
    }

    // ---- Commit mode (optionally batched via offset/limit) ----
    const total = mapped.length;
    const offset = Math.max(0, intOrUndef(body.offset) ?? 0);
    const limit = Math.max(1, intOrUndef(body.limit) ?? total);
    const slice = mapped.slice(offset, offset + limit);

    let inserted = 0;
    let skippedDuplicates = 0;
    let authorsCreated = 0;
    const failed: { title: string; reason: string }[] = [];
    const authorNames = new Set<string>();
    const insertedBooks: Record<string, unknown>[] = [];

    for (const b of slice) {
      try {
        // Re-check against the DB each time so duplicates created by earlier
        // batches (or earlier rows in this file) are correctly skipped.
        const dupeQuery = b.isbn
          ? { $or: [{ slug: b.slug }, { isbn: b.isbn }] }
          : { slug: b.slug };
        // eslint-disable-next-line no-await-in-loop
        const exists = await LibraryBook.exists(dupeQuery);
        if (exists) {
          skippedDuplicates++;
          continue;
        }
        // eslint-disable-next-line no-await-in-loop
        await LibraryBook.create({
          title: b.title,
          slug: b.slug,
          author: b.author,
          authorSlug: b.authorSlug,
          translator: b.translator,
          isbn: b.isbn,
          format: b.format,
          pages: b.pages,
          publisher: b.publisher,
          publicationDate: b.publicationDate,
          originalPublicationDate: b.originalPublicationDate,
          finishedDate: b.finishedDate,
          addedDate: b.addedDate,
          status: b.status,
          rating: b.rating,
          rereadCount: b.rereadCount,
          ownership: b.ownership,
          copies: b.copies ?? [],
          personalNotes: b.personalNotes,
          tags: b.tags,
          contentLinks: b.contentLinks,
        });
        inserted++;
        if (b.author) authorNames.add(b.author);
        insertedBooks.push(b as unknown as Record<string, unknown>);
      } catch (rowErr) {
        failed.push({
          title: b.title || '(untitled row)',
          reason: rowErr instanceof Error ? rowErr.message : 'Unknown error',
        });
      }
    }

    if (body.autoCreateAuthors) {
      for (const name of authorNames) {
        try {
          const slug = librarySlugify(name);
          // eslint-disable-next-line no-await-in-loop
          const exists = await LibraryAuthor.exists({ slug });
          if (!exists) {
            // eslint-disable-next-line no-await-in-loop
            await LibraryAuthor.create({ name, slug });
            authorsCreated++;
          }
        } catch {
          // A failed author record shouldn't fail the whole import.
        }
      }
    }

    let taxonomyCreated = 0;
    if (insertedBooks.length) {
      try {
        const sync = await syncTaxonomyFromBooks(insertedBooks);
        taxonomyCreated = sync.created;
      } catch (syncErr) {
        console.error('taxonomy sync after goodreads import', syncErr);
      }
    }

    const nextOffset = offset + slice.length;
    res.status(200).json({
      committed: true,
      total,
      offset,
      processed: slice.length,
      nextOffset,
      done: nextOffset >= total,
      inserted,
      skippedDuplicates,
      authorsCreated,
      taxonomyCreated,
      failed,
    });
  } catch (err) {
    console.error('POST /api/library/import/goodreads', err);
    res.status(500).json({ error: 'Failed to import CSV' });
  }
});

/**
 * POST /api/library/import/template
 * Body: { csv, commit?, autoCreateAuthors?, offset?, limit?, mode?: 'insert' | 'upsert' }
 * Bulk insert (default) or upsert enrichment using our Excel/CSV template.
 * Upsert matches ISBN → slug → title+author; non-empty CSV fields replace DB values.
 */
router.post('/template', async (req: Request, res: Response): Promise<void> => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const csv = str(body.csv);
  if (!csv) {
    res.status(400).json({ error: 'CSV content is required' });
    return;
  }
  const mode = str(body.mode) === 'upsert' ? 'upsert' : 'insert';

  try {
    const missing = missingBulkTemplateHeaders(csv);
    if (missing.length) {
      res.status(400).json({
        error: `CSV is missing mandatory Excel columns: ${missing.join(', ')}. Download the latest template and keep all headers (empty cells or — are fine).`,
        missingHeaders: missing,
      });
      return;
    }

    const mapped = mapBulkTemplateCsv(csv);
    const rowErrors = mapped
      .map((b, i) => {
        const err = validateTemplateBookRow(b);
        return err ? { row: i + 2, title: b.title, error: err } : null;
      })
      .filter(Boolean);
    if (rowErrors.length) {
      res.status(400).json({
        error: `Some rows are missing Title or Author (${rowErrors.length}). Fix those rows and re-upload.`,
        rowErrors: rowErrors.slice(0, 20),
      });
      return;
    }

    if (!body.commit) {
      const withDupes = await markDuplicates(
        mapped.map((b) => ({
          title: b.title,
          slug: b.slug,
          author: b.author,
          isbn: b.isbn,
          status: b.status,
          rating: b.rating,
        })) as MappedImportBook[]
      );
      res.status(200).json({
        preview: true,
        total: withDupes.length,
        duplicates: withDupes.filter((b) => b.isDuplicate).length,
        mode,
        books: withDupes.slice(0, 500),
        note:
          mode === 'upsert'
            ? 'Upsert mode: matched books get every Excel column from the sheet written in (blank reading-log cells leave status/rating alone). New titles are inserted.'
            : 'Insert mode: existing library books are skipped.',
      });
      return;
    }

    const total = mapped.length;
    const offset = Math.max(0, intOrUndef(body.offset) ?? 0);
    const limit = Math.max(1, intOrUndef(body.limit) ?? total);
    const slice = mapped.slice(offset, offset + limit);

    let inserted = 0;
    let updated = 0;
    let skippedDuplicates = 0;
    let authorsCreated = 0;
    const failed: { title: string; reason: string }[] = [];
    const authorNames = new Set<string>();
    const touchedBooks: BulkTemplateBook[] = [];

    // One index for the whole batch so title/author punctuation drift still matches.
    const matchIndex = await buildLibraryMatchIndex();
    // Track ids we insert/update in this run so later rows in the same CSV don't double-insert.
    const seenIds = new Set<string>();

    for (const b of slice) {
      try {
        let existingId = matchIndex.find(b);
        if (existingId && seenIds.has(existingId)) {
          // Already handled an earlier row that matched the same library book.
          skippedDuplicates++;
          continue;
        }

        if (existingId) {
          if (mode === 'insert') {
            skippedDuplicates++;
            continue;
          }
          // eslint-disable-next-line no-await-in-loop
          await LibraryBook.updateOne(
            { _id: existingId },
            { $set: enrichmentUpdateFromTemplate(b) }
          );
          updated++;
          seenIds.add(existingId);
          touchedBooks.push(b);
          if (b.author) authorNames.add(b.author);
          continue;
        }

        // Fallback to per-row lookup (covers races / edge cases the index missed).
        // eslint-disable-next-line no-await-in-loop
        const existing = await findExistingLibraryBook(b);
        if (existing) {
          const id = String(existing._id);
          if (mode === 'insert') {
            skippedDuplicates++;
            continue;
          }
          // eslint-disable-next-line no-await-in-loop
          await LibraryBook.updateOne(
            { _id: existing._id },
            { $set: enrichmentUpdateFromTemplate(b) }
          );
          updated++;
          seenIds.add(id);
          touchedBooks.push(b);
          if (b.author) authorNames.add(b.author);
          continue;
        }

        // eslint-disable-next-line no-await-in-loop
        const created = await LibraryBook.create(createFieldsFromTemplateBook(b));
        inserted++;
        const newId = String(created._id);
        seenIds.add(newId);
        matchIndex.register(newId, b);
        touchedBooks.push(b);
        if (b.author) authorNames.add(b.author);
      } catch (rowErr) {
        failed.push({
          title: b.title || '(untitled row)',
          reason: rowErr instanceof Error ? rowErr.message : 'Unknown error',
        });
      }
    }

    if (body.autoCreateAuthors) {
      for (const name of authorNames) {
        try {
          const slug = librarySlugify(name);
          // eslint-disable-next-line no-await-in-loop
          const exists = await LibraryAuthor.exists({ slug });
          if (!exists) {
            // eslint-disable-next-line no-await-in-loop
            await LibraryAuthor.create({ name, slug });
            authorsCreated++;
          } else if (mode === 'upsert') {
            // Keep author country in sync when sheet has country and author exists.
            /* authors updated via book country for now */
          }
        } catch {
          /* ignore */
        }
      }
    }

    let taxonomyCreated = 0;
    if (touchedBooks.length) {
      try {
        const sync = await syncTaxonomyFromBooks(touchedBooks as unknown as Record<string, unknown>[]);
        taxonomyCreated = sync.created;
      } catch (syncErr) {
        console.error('taxonomy sync after template import', syncErr);
      }
    }

    const nextOffset = offset + slice.length;
    res.status(200).json({
      committed: true,
      total,
      offset,
      processed: slice.length,
      nextOffset,
      done: nextOffset >= total,
      inserted,
      updated,
      skippedDuplicates,
      authorsCreated,
      taxonomyCreated,
      mode,
      failed,
    });
  } catch (err) {
    console.error('POST /api/library/import/template', err);
    res.status(500).json({ error: 'Failed to import template CSV' });
  }
});

/**
 * POST /api/library/import/site-books
 * Body: { commit?, autoCreateAuthors?, offset?, limit? }
 * Pull title / author / genres from the public Book catalog into Library OS.
 * Insert-only — never overwrites existing library rows.
 */
router.post('/site-books', async (req: Request, res: Response): Promise<void> => {
  const body = (req.body ?? {}) as Record<string, unknown>;

  try {
    const mapped = await mapSiteBooksForLibraryImport();

    if (!body.commit) {
      const withDupes = await markSiteImportDuplicates(mapped);
      res.status(200).json({
        preview: true,
        total: withDupes.length,
        duplicates: withDupes.filter((b) => b.isDuplicate).length,
        books: withDupes.slice(0, 500).map((b) => ({
          title: b.title,
          slug: b.slug,
          author: b.author,
          isbn: b.isbn,
          status: b.status,
          isDuplicate: b.isDuplicate,
          genres: b.genres,
        })),
      });
      return;
    }

    const total = mapped.length;
    const offset = Math.max(0, intOrUndef(body.offset) ?? 0);
    const limit = Math.max(1, intOrUndef(body.limit) ?? total);
    const slice = mapped.slice(offset, offset + limit);

    const existing = await LibraryBook.find({}).select('slug isbn title author').lean();
    const slugSet = new Set(existing.map((b) => b.slug).filter(Boolean));
    const isbnSet = new Set(
      existing.map((b) => String(b.isbn || '').replace(/\D/g, '')).filter((d) => d.length >= 10)
    );
    const taSet = new Set(
      existing.map((b) => normalizeTitleAuthor(b.title || '', b.author || ''))
    );

    let inserted = 0;
    let skippedDuplicates = 0;
    let authorsCreated = 0;
    const failed: { title: string; reason: string }[] = [];
    const authorNames = new Set<string>();
    const insertedBooks: SiteImportBook[] = [];

    for (const b of slice) {
      try {
        const isbnKey = String(b.isbn || '').replace(/\D/g, '');
        const taKey = normalizeTitleAuthor(b.title, b.author);
        const isDupe =
          slugSet.has(b.slug) ||
          taSet.has(taKey) ||
          (isbnKey.length >= 10 && isbnSet.has(isbnKey));
        if (isDupe) {
          skippedDuplicates++;
          continue;
        }

        // eslint-disable-next-line no-await-in-loop
        await LibraryBook.create({
          title: b.title,
          slug: b.slug,
          author: b.author,
          authorSlug: b.authorSlug,
          isbn: b.isbn || '',
          coverImage: b.coverImage || '',
          genres: b.genres,
          status: b.status,
          copies: [],
          contentLinks: b.contentLinks,
          addedDate: new Date(),
          discoverySource: 'manual',
          personalNotes: 'Imported from site book directory',
        });
        inserted++;
        insertedBooks.push(b);
        slugSet.add(b.slug);
        taSet.add(taKey);
        if (isbnKey.length >= 10) isbnSet.add(isbnKey);
        if (b.author) authorNames.add(b.author);
      } catch (rowErr) {
        failed.push({
          title: b.title || '(untitled)',
          reason: rowErr instanceof Error ? rowErr.message : 'Unknown error',
        });
      }
    }

    if (body.autoCreateAuthors) {
      for (const name of authorNames) {
        try {
          const slug = librarySlugify(name);
          // eslint-disable-next-line no-await-in-loop
          const exists = await LibraryAuthor.exists({ slug });
          if (!exists) {
            // eslint-disable-next-line no-await-in-loop
            await LibraryAuthor.create({ name, slug });
            authorsCreated++;
          }
        } catch {
          /* ignore */
        }
      }
    }

    let taxonomyCreated = 0;
    if (insertedBooks.length) {
      try {
        const sync = await syncTaxonomyFromBooks(
          insertedBooks.map((b) => ({ genres: b.genres })) as unknown as Record<string, unknown>[]
        );
        taxonomyCreated = sync.created;
      } catch (syncErr) {
        console.error('taxonomy sync after site-books import', syncErr);
      }
    }

    const nextOffset = offset + slice.length;
    res.status(200).json({
      committed: true,
      total,
      offset,
      processed: slice.length,
      nextOffset,
      done: nextOffset >= total,
      inserted,
      skippedDuplicates,
      authorsCreated,
      taxonomyCreated,
      failed,
    });
  } catch (err) {
    console.error('POST /api/library/import/site-books', err);
    res.status(500).json({ error: 'Failed to import site books' });
  }
});

export default router;
