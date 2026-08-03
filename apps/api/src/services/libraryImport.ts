import { librarySlugify } from '../config/libraryEnums.js';
import type { BookFormat, ReadingStatus } from '../config/libraryEnums.js';

/** Minimal RFC-4180-ish CSV parser (handles quotes, escaped quotes, CRLF). */
export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  const text = input.replace(/^\uFEFF/, ''); // strip BOM

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (c === '\r') {
      // ignore; handled by \n
    } else {
      field += c;
    }
  }
  // trailing field/row
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

/** Convert parsed CSV rows into keyed record objects using the header row. */
export function csvToRecords(rows: string[][]): Record<string, string>[] {
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const rec: Record<string, string> = {};
    header.forEach((key, i) => {
      rec[key] = (r[i] ?? '').trim();
    });
    return rec;
  });
}

/** Goodreads wraps ISBNs as `="0345339681"` to stop Excel mangling them. */
function cleanGoodreadsCell(v: string | undefined): string {
  if (!v) return '';
  return v.replace(/^="?/, '').replace(/"?$/, '').trim();
}

function toYearDate(v: string | undefined): Date | undefined {
  const cleaned = cleanGoodreadsCell(v);
  if (!cleaned) return undefined;
  const year = parseInt(cleaned, 10);
  if (Number.isNaN(year) || year < 0 || year > 3000) return undefined;
  return new Date(Date.UTC(year, 0, 1));
}

function toDate(v: string | undefined): Date | undefined {
  const cleaned = cleanGoodreadsCell(v);
  if (!cleaned) return undefined;
  const d = new Date(cleaned);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function toInt(v: string | undefined): number | undefined {
  const cleaned = cleanGoodreadsCell(v);
  if (!cleaned) return undefined;
  const n = parseInt(cleaned, 10);
  return Number.isNaN(n) ? undefined : n;
}

const BINDING_TO_FORMAT: Record<string, BookFormat> = {
  hardcover: 'hardcover',
  hardback: 'hardcover',
  paperback: 'paperback',
  'mass market paperback': 'paperback',
  kindle: 'ebook',
  'kindle edition': 'ebook',
  ebook: 'ebook',
  audiobook: 'audiobook',
  audio: 'audiobook',
  audible: 'audiobook',
};

function mapShelfToStatus(shelf: string): ReadingStatus {
  const s = shelf.trim().toLowerCase();
  if (s === 'read') return 'read';
  if (s === 'currently-reading') return 'currently-reading';
  if (s === 'to-read') return 'want-to-read';
  return 'want-to-read';
}

export interface MappedImportBook {
  title: string;
  slug: string;
  author: string;
  authorSlug: string;
  translator?: string;
  isbn?: string;
  format?: BookFormat;
  pages?: number;
  publisher?: string;
  publicationDate?: Date;
  originalPublicationDate?: Date;
  finishedDate?: Date;
  addedDate?: Date;
  status: ReadingStatus;
  rating?: number;
  rereadCount: number;
  ownership?: 'owned';
  copies?: { format?: BookFormat; location?: string }[];
  personalNotes?: string;
  tags: string[];
  contentLinks?: { goodreads?: string };
  _sourceRowIndex: number;
}

/** Map a single Goodreads CSV record to a LibraryBook-shaped object. */
export function mapGoodreadsRecord(rec: Record<string, string>, index: number): MappedImportBook | null {
  const title = cleanGoodreadsCell(rec['Title']);
  if (!title) return null;

  const author = cleanGoodreadsCell(rec['Author']);
  const additionalAuthors = cleanGoodreadsCell(rec['Additional Authors']);
  const isbn = cleanGoodreadsCell(rec['ISBN13']) || cleanGoodreadsCell(rec['ISBN']);
  const binding = cleanGoodreadsCell(rec['Binding']).toLowerCase();
  const rating = toInt(rec['My Rating']);
  const readCount = toInt(rec['Read Count']) ?? 0;
  const ownedCopies = toInt(rec['Owned Copies']) ?? 0;
  const bookId = cleanGoodreadsCell(rec['Book Id']);
  const shelves = cleanGoodreadsCell(rec['Bookshelves']);
  const review = cleanGoodreadsCell(rec['My Review']);
  const privateNotes = cleanGoodreadsCell(rec['Private Notes']);

  const notes = [review, privateNotes].filter(Boolean).join('\n\n');
  const tags = shelves
    .split(/[,;]/)
    .map((t) => t.trim())
    .filter((t) => t && !['read', 'currently-reading', 'to-read'].includes(t.toLowerCase()));

  const format = BINDING_TO_FORMAT[binding];
  const copies = ownedCopies > 0 ? [{ format, location: '' }] : undefined;

  return {
    title,
    slug: librarySlugify(`${title}-${author}`) || librarySlugify(title),
    author,
    authorSlug: author ? librarySlugify(author) : '',
    translator: additionalAuthors || undefined,
    isbn: isbn || undefined,
    format,
    pages: toInt(rec['Number of Pages']),
    publisher: cleanGoodreadsCell(rec['Publisher']) || undefined,
    publicationDate: toYearDate(rec['Year Published']),
    originalPublicationDate: toYearDate(rec['Original Publication Year']),
    finishedDate: toDate(rec['Date Read']),
    addedDate: toDate(rec['Date Added']),
    status: mapShelfToStatus(cleanGoodreadsCell(rec['Exclusive Shelf'])),
    rating: rating && rating > 0 ? rating : undefined,
    rereadCount: readCount > 1 ? readCount - 1 : 0,
    ownership: ownedCopies > 0 ? 'owned' : undefined,
    copies,
    personalNotes: notes || undefined,
    tags,
    contentLinks: bookId ? { goodreads: `https://www.goodreads.com/book/show/${bookId}` } : undefined,
    _sourceRowIndex: index,
  };
}

/** Parse a Goodreads CSV export into mapped books, skipping empty/invalid rows. */
export function mapGoodreadsCsv(csv: string): MappedImportBook[] {
  const records = csvToRecords(parseCsv(csv));
  const out: MappedImportBook[] = [];
  records.forEach((rec, i) => {
    const mapped = mapGoodreadsRecord(rec, i);
    if (mapped) out.push(mapped);
  });
  return out;
}
