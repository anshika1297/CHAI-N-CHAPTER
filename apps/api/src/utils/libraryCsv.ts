/** Minimal RFC 4180-ish CSV helpers for Library OS exports. */

import { BULK_TEMPLATE_HEADERS } from '../config/libraryExcelSchema.js';

export function csvCell(value: unknown): string {
  if (value == null) return '';
  const s = Array.isArray(value)
    ? value.map((v) => String(v ?? '').trim()).filter(Boolean).join('; ')
    : value instanceof Date
      ? value.toISOString().slice(0, 10)
      : String(value);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(csvCell).join(',')];
  for (const row of rows) {
    lines.push(row.map(csvCell).join(','));
  }
  // BOM helps Excel open UTF-8 accents correctly.
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

export type LibraryBookCsvSource = {
  title?: string;
  subtitle?: string;
  author?: string;
  authorGender?: string;
  country?: string;
  originalLanguage?: string;
  translator?: string;
  publicationDate?: Date | string;
  pages?: number;
  isbn?: string;
  coverImage?: string;
  fictionType?: string;
  primaryGenre?: string;
  secondaryGenre?: string;
  subgenres?: string[];
  genres?: string[];
  audience?: string;
  inSeries?: boolean;
  series?: string;
  seriesNumber?: number;
  standalone?: boolean;
  themes?: string[];
  moods?: string[];
  tropes?: string[];
  tags?: string[];
  femaleAuthor?: boolean;
  femaleProtagonist?: boolean;
  womenFocus?: string;
  collections?: string[];
  seasonalRecommendation?: string[];
  readingLevel?: string;
  similarBooks?: string[];
  oneLineRecommendation?: string;
  description?: string;
  instagramHook?: string;
  instagramPostTopic?: string;
  bestPostingMonth?: string;
  rating?: number;
  status?: string;
  finishedDate?: Date | string;
  format?: string;
  owned?: boolean;
  wishlist?: string | boolean;
  ownership?: string;
  awards?: string[];
  bestseller?: string | boolean;
  adaptation?: string | boolean;
  bookTokPopular?: string | boolean;
  bookstagramPopular?: string | boolean;
};

function yesNo(v: boolean | undefined): string {
  if (v === true) return 'Yes';
  if (v === false) return 'No';
  return '';
}

function signalCell(v: string | boolean | undefined): string {
  if (v === true) return 'Yes';
  if (v === false) return 'No';
  if (v == null) return '';
  return String(v);
}

function yearOf(v: Date | string | undefined): string {
  if (!v) return '';
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) {
    const m = String(v).match(/^(\d{4})/);
    return m ? m[1] : '';
  }
  return String(d.getUTCFullYear());
}

function dateOnly(v: Date | string | undefined): string {
  if (!v) return '';
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function genderLabel(v: string | undefined): string {
  if (!v) return '';
  const t = v.toLowerCase();
  if (t === 'female') return 'Female';
  if (t === 'male') return 'Male';
  if (t === 'non-binary') return 'Non-binary';
  if (t === 'unknown') return 'Unknown';
  return v;
}

function fictionLabel(v: string | undefined): string {
  if (!v) return '';
  const t = v.toLowerCase();
  if (t === 'fiction') return 'Fiction';
  if (t === 'non-fiction') return 'Non-fiction';
  return v;
}

function womenFocusLabel(v: string | undefined): string {
  if (!v) return '';
  const t = v.toLowerCase();
  if (t === 'no') return 'No';
  if (t === 'yes') return 'Yes';
  if (t === 'primary') return 'Primary';
  if (t === 'secondary') return 'Secondary';
  return v;
}

function ownedFlag(b: LibraryBookCsvSource): boolean | undefined {
  if (typeof b.owned === 'boolean') return b.owned;
  if (b.ownership === 'owned') return true;
  return undefined;
}

/** Export uses the same mandatory Excel columns as the import template. */
export function libraryBooksToCsv(books: LibraryBookCsvSource[]): string {
  const rows = books.map((b) => {
    const primary = b.primaryGenre || (b.genres?.[0] ?? '');
    const secondary = b.secondaryGenre || (b.genres?.[1] ?? '');
    return [
      b.title ?? '',
      b.subtitle ?? '',
      b.author ?? '',
      genderLabel(b.authorGender),
      b.country ?? '',
      b.originalLanguage ?? '',
      b.translator ?? '',
      yearOf(b.publicationDate),
      b.pages ?? '',
      b.isbn ?? '',
      b.coverImage ?? '',
      fictionLabel(b.fictionType),
      primary,
      secondary,
      (b.subgenres ?? []).join('; '),
      b.audience ?? '',
      yesNo(b.inSeries),
      b.series ?? '',
      b.seriesNumber ?? '',
      yesNo(b.standalone),
      (b.themes ?? []).join('; '),
      (b.moods ?? []).join('; '),
      (b.tropes ?? []).join('; '),
      (b.tags ?? []).join('; '),
      yesNo(b.femaleAuthor),
      yesNo(b.femaleProtagonist),
      womenFocusLabel(b.womenFocus),
      (b.collections ?? []).join('; '),
      (b.seasonalRecommendation ?? []).join('; '),
      b.readingLevel ?? '',
      (b.similarBooks ?? []).join('; '),
      b.oneLineRecommendation ?? '',
      b.description ?? '',
      b.instagramHook ?? '',
      b.instagramPostTopic ?? '',
      b.bestPostingMonth ?? '',
      b.rating ?? '',
      b.status ?? '',
      dateOnly(b.finishedDate),
      b.format ?? '',
      yesNo(ownedFlag(b)),
      signalCell(b.wishlist),
      (b.awards ?? []).join('; '),
      signalCell(b.bestseller),
      signalCell(b.adaptation),
      signalCell(b.bookTokPopular),
      signalCell(b.bookstagramPopular),
    ];
  });
  return toCsv([...BULK_TEMPLATE_HEADERS], rows);
}
