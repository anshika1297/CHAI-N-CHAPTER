import { Router, Request, Response } from 'express';
import { LibraryBook } from '../../models/LibraryBook.js';
import { requireAuth } from '../../middlewares/auth.js';
import {
  buildLibraryBookFilter,
  sortSpecFor,
  type LibraryBookQueryParams,
} from '../../services/libraryBookFilter.js';
import { libraryBooksToCsv } from '../../utils/libraryCsv.js';
import { buildBulkImportTemplateCsv } from '../../services/libraryBulkTemplate.js';

const router = Router();
router.use(requireAuth);

const EXPORT_MAX = 5000;

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function numOrUndef(v: unknown): number | undefined {
  if (v === '' || v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function boolFromQuery(v: unknown): boolean | undefined {
  const s = str(v).toLowerCase();
  if (!s) return undefined;
  if (s === '1' || s === 'true' || s === 'yes') return true;
  if (s === '0' || s === 'false' || s === 'no') return false;
  return undefined;
}

function paramsFromQuery(q: Request['query']): LibraryBookQueryParams {
  const neverRecommended = boolFromQuery(q.neverRecommended);
  const notRecommendedDays = numOrUndef(q.notRecommendedDays);
  return {
    q: str(q.q) || undefined,
    status: str(q.status) || undefined,
    author: str(q.author) || undefined,
    series: str(q.series) || undefined,
    ownership: str(q.ownership) || undefined,
    format: str(q.format) || undefined,
    location: str(q.location) || undefined,
    discoveryStatus: str(q.discoveryStatus) || undefined,
    recommendationConfidence: str(q.recommendationConfidence) || undefined,
    genre: str(q.genre) || undefined,
    theme: str(q.theme) || undefined,
    mood: str(q.mood) || undefined,
    trope: str(q.trope) || undefined,
    tag: str(q.tag) || undefined,
    collection: str(q.collection) || undefined,
    season: str(q.season) || undefined,
    language: str(q.language) || undefined,
    authorCountry: str(q.authorCountry) || undefined,
    minRating: numOrUndef(q.minRating),
    minPages: numOrUndef(q.minPages),
    maxPages: numOrUndef(q.maxPages),
    owned: boolFromQuery(q.owned),
    neverRecommended: neverRecommended || undefined,
    notRecommendedDays: neverRecommended ? undefined : notRecommendedDays,
  };
}

function stampFilename(prefix: string): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${prefix}-${y}${m}${day}.csv`;
}

/**
 * GET /api/library/export/books
 * CSV of all books matching the current filters (same params as list / recommend).
 */
router.get('/books', async (req: Request, res: Response): Promise<void> => {
  try {
    const sort = str(req.query.sort) || 'title';
    const params = paramsFromQuery(req.query);
    const filter = await buildLibraryBookFilter(params);
    const sortSpec = sortSpecFor(sort);

    const total = await LibraryBook.countDocuments(filter);
    if (total > EXPORT_MAX) {
      res.status(400).json({
        error: `Too many matches (${total}). Narrow filters — export cap is ${EXPORT_MAX}.`,
      });
      return;
    }

    const books = await LibraryBook.find(filter)
      .sort(sortSpec)
      .limit(EXPORT_MAX)
      .select(
        'title subtitle author authorGender country originalLanguage translator publicationDate pages isbn coverImage ' +
          'fictionType primaryGenre secondaryGenre subgenres genres audience inSeries series seriesNumber standalone ' +
          'themes moods tropes tags femaleAuthor femaleProtagonist womenFocus collections seasonalRecommendation readingLevel ' +
          'similarBooks oneLineRecommendation description instagramHook instagramPostTopic bestPostingMonth rating status ' +
          'finishedDate format owned wishlist ownership awards bestseller adaptation bookTokPopular bookstagramPopular'
      )
      .lean();

    const csv = libraryBooksToCsv(books);
    const filename = stampFilename('library-books');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csv);
  } catch (err) {
    console.error('GET /api/library/export/books', err);
    res.status(500).json({ error: 'Failed to export books' });
  }
});

/**
 * GET /api/library/export/template
 * Excel-friendly CSV template for bulk book insert (open/edit in Excel, re-upload on Import).
 */
router.get('/template', (_req: Request, res: Response): void => {
  const csv = buildBulkImportTemplateCsv();
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    'attachment; filename="library-bulk-import-template.csv"'
  );
  res.status(200).send(csv);
});

export default router;
