import { getFetchBaseUrl } from '@/lib/apiBase';
import { getAdminToken } from '@/lib/api';
import type {
  AuthorEnrichSuggestResult,
  BookClassificationSuggestResult,
  BookEnrichSuggestResult,
  BookEnrichSuggestion,
  ImportCommitResult,
  ImportPreviewResult,
  LibraryAuthorDto,
  LibraryBookDto,
  LibraryBookListResult,
  LibraryQueryResult,
  LibraryStats,
  RecommendBuilderResult,
  RecommendationEntry,
  HooksResult,
  AskHooksResult,
  HookToBooksResult,
  TaxonomyItemDto,
  TaxonomyType,
  LibraryAnalytics,
  DuplicateGroup,
} from './types';

const base = (): string => getFetchBaseUrl();

function authHeaders(json = true): Record<string, string> {
  const headers: Record<string, string> = {};
  if (json) headers['Content-Type'] = 'application/json';
  const token = getAdminToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function handle<T>(res: Response, label: string): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (body as { error?: string }).error || `${label} failed (${res.status})`;
    throw new Error(msg);
  }
  return body as T;
}

// ——— Books ———

export async function listLibraryBooks(
  params: Record<string, string | number | undefined> = {}
): Promise<LibraryBookListResult> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') qs.set(k, String(v));
  }
  const res = await fetch(`${base()}/api/library/books?${qs}`, { headers: authHeaders(false) });
  return handle<LibraryBookListResult>(res, 'Load books');
}

export async function getLibraryBook(id: string): Promise<{ book: LibraryBookDto }> {
  const res = await fetch(`${base()}/api/library/books/${encodeURIComponent(id)}`, {
    headers: authHeaders(false),
  });
  return handle<{ book: LibraryBookDto }>(res, 'Load book');
}

export async function createLibraryBook(data: Partial<LibraryBookDto>): Promise<{ book: LibraryBookDto }> {
  const res = await fetch(`${base()}/api/library/books`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handle<{ book: LibraryBookDto }>(res, 'Create book');
}

export async function updateLibraryBook(
  id: string,
  data: Partial<LibraryBookDto>
): Promise<{ book: LibraryBookDto }> {
  const res = await fetch(`${base()}/api/library/books/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handle<{ book: LibraryBookDto }>(res, 'Update book');
}

export async function deleteLibraryBook(id: string): Promise<{ message: string }> {
  const res = await fetch(`${base()}/api/library/books/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(false),
  });
  return handle<{ message: string }>(res, 'Delete book');
}

/** Bulk-update selected books (add/replace tags, tropes, moods, etc.). */
export async function bulkUpdateLibraryBooks(payload: {
  ids: string[];
  mode?: 'add' | 'replace';
  genres?: string[];
  subgenres?: string[];
  themes?: string[];
  tropes?: string[];
  moods?: string[];
  tags?: string[];
  keywords?: string[];
  seasonalRecommendation?: string[];
  collections?: string[];
  status?: string;
  ownership?: string;
  location?: string;
  recommendationConfidence?: string;
}): Promise<{ updated: number; failed: { id: string; reason: string }[]; mode: string; total: number }> {
  const res = await fetch(`${base()}/api/library/books/bulk-update`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handle(res, 'Bulk update');
}

// ——— Authors ———

export async function listLibraryAuthors(params: {
  page?: number;
  limit?: number;
  q?: string;
  missingCountry?: boolean;
} = {}): Promise<{ authors: LibraryAuthorDto[]; total: number; page: number; totalPages: number }> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.q) qs.set('q', params.q);
  if (params.missingCountry) qs.set('missingCountry', 'true');
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const res = await fetch(`${base()}/api/library/authors${suffix}`, { headers: authHeaders(false) });
  return handle<{ authors: LibraryAuthorDto[]; total: number; page: number; totalPages: number }>(
    res,
    'Load authors'
  );
}

export async function createLibraryAuthor(
  data: Partial<LibraryAuthorDto>
): Promise<{ author: LibraryAuthorDto }> {
  const res = await fetch(`${base()}/api/library/authors`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handle<{ author: LibraryAuthorDto }>(res, 'Create author');
}

export async function updateLibraryAuthor(
  id: string,
  data: Partial<LibraryAuthorDto>
): Promise<{ author: LibraryAuthorDto }> {
  const res = await fetch(`${base()}/api/library/authors/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handle<{ author: LibraryAuthorDto }>(res, 'Update author');
}

export async function deleteLibraryAuthor(id: string): Promise<{ message: string }> {
  const res = await fetch(`${base()}/api/library/authors/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(false),
  });
  return handle<{ message: string }>(res, 'Delete author');
}

// ——— Taxonomy (master data) ———

export async function listTaxonomy(): Promise<{ grouped: Record<TaxonomyType, TaxonomyItemDto[]> }> {
  const res = await fetch(`${base()}/api/library/taxonomy`, { headers: authHeaders(false) });
  return handle<{ grouped: Record<TaxonomyType, TaxonomyItemDto[]> }>(res, 'Load taxonomy');
}

export async function listTaxonomyByType(type: TaxonomyType): Promise<{ items: TaxonomyItemDto[] }> {
  const res = await fetch(`${base()}/api/library/taxonomy?type=${encodeURIComponent(type)}`, {
    headers: authHeaders(false),
  });
  return handle<{ items: TaxonomyItemDto[] }>(res, 'Load taxonomy');
}

export async function createTaxonomy(data: {
  type: TaxonomyType;
  name: string;
  description?: string;
}): Promise<{ item: TaxonomyItemDto }> {
  const res = await fetch(`${base()}/api/library/taxonomy`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handle<{ item: TaxonomyItemDto }>(res, 'Create item');
}

export async function updateTaxonomy(
  id: string,
  data: { name?: string; description?: string }
): Promise<{ item: TaxonomyItemDto }> {
  const res = await fetch(`${base()}/api/library/taxonomy/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handle<{ item: TaxonomyItemDto }>(res, 'Update item');
}

export async function deleteTaxonomy(id: string): Promise<{ message: string }> {
  const res = await fetch(`${base()}/api/library/taxonomy/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(false),
  });
  return handle<{ message: string }>(res, 'Delete item');
}

/** Pull genres/themes/tags/etc. from all books into Master Data. */
export async function syncTaxonomyFromBooks(): Promise<{
  created: number;
  skipped: number;
  scanned: number;
}> {
  const res = await fetch(`${base()}/api/library/taxonomy/sync-from-books`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handle<{ created: number; skipped: number; scanned: number }>(res, 'Sync taxonomy');
}

// ——— Stats + Import ———

export async function getLibraryStats(): Promise<LibraryStats> {
  const res = await fetch(`${base()}/api/library/stats`, { headers: authHeaders(false) });
  return handle<LibraryStats>(res, 'Load stats');
}

export async function getLibraryAnalytics(): Promise<LibraryAnalytics> {
  const res = await fetch(`${base()}/api/library/analytics`, { headers: authHeaders(false) });
  return handle<LibraryAnalytics>(res, 'Load analytics');
}

export async function listDuplicateBooks(): Promise<{ groups: DuplicateGroup[]; totalGroups: number }> {
  const res = await fetch(`${base()}/api/library/books/duplicates`, {
    headers: authHeaders(false),
  });
  return handle<{ groups: DuplicateGroup[]; totalGroups: number }>(res, 'Find duplicates');
}

export async function mergeLibraryBooks(
  keepId: string,
  dropId: string
): Promise<{ book: LibraryBookDto }> {
  const res = await fetch(`${base()}/api/library/books/merge`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ keepId, dropId }),
  });
  return handle<{ book: LibraryBookDto }>(res, 'Merge books');
}

export async function queryLibrary(
  q: string,
  options: { sort?: string; limit?: number } = {}
): Promise<LibraryQueryResult> {
  const res = await fetch(`${base()}/api/library/query`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ q, ...options }),
  });
  return handle<LibraryQueryResult>(res, 'Query');
}

export async function suggestAuthorNationalities(options: {
  onlyMissing?: boolean;
  ids?: string[];
}): Promise<AuthorEnrichSuggestResult> {
  const res = await fetch(`${base()}/api/library/authors/enrich/suggest`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(options),
  });
  return handle<AuthorEnrichSuggestResult>(res, 'Suggest nationalities');
}

export async function applyAuthorEnrichment(
  updates: { id: string; country?: string; primaryLanguage?: string }[]
): Promise<{ updated: number }> {
  const res = await fetch(`${base()}/api/library/authors/enrich/apply`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ updates }),
  });
  return handle<{ updated: number }>(res, 'Apply enrichment');
}

export async function suggestBookClassification(
  id: string
): Promise<BookClassificationSuggestResult> {
  const res = await fetch(
    `${base()}/api/library/books/${encodeURIComponent(id)}/enrich/suggest`,
    { method: 'POST', headers: authHeaders() }
  );
  return handle<BookClassificationSuggestResult>(res, 'Suggest tags');
}

export async function suggestBooksEnrichment(ids: string[]): Promise<BookEnrichSuggestResult> {
  const res = await fetch(`${base()}/api/library/books/enrich/suggest`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ ids }),
  });
  return handle<BookEnrichSuggestResult>(res, 'Suggest book tags');
}

export async function applyBookEnrichment(
  updates: Partial<BookEnrichSuggestion>[]
): Promise<{ updated: number }> {
  const res = await fetch(`${base()}/api/library/books/enrich/apply`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ updates }),
  });
  return handle<{ updated: number }>(res, 'Apply book enrichment');
}

export async function buildRecommendations(
  params: Record<string, string | number | boolean | undefined> = {}
): Promise<RecommendBuilderResult> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') qs.set(k, String(v));
  }
  const res = await fetch(`${base()}/api/library/recommend?${qs}`, {
    headers: authHeaders(false),
  });
  return handle<RecommendBuilderResult>(res, 'Build recommendations');
}

/** Plain-English ask → AI judges fit (incomplete tags OK) → shortlist (+ optional hooks). */
export async function askRecommendations(payload: {
  q: string;
  limit?: number;
  status?: string;
  owned?: boolean;
  neverRecommended?: boolean;
  notRecommendedDays?: number | string;
  maxPages?: number | string;
  minRating?: number | string;
  collection?: string;
  aiFit?: boolean;
  generateHooks?: boolean;
  useWinningHooks?: boolean;
}): Promise<RecommendBuilderResult> {
  const res = await fetch(`${base()}/api/library/recommend/ask`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handle<RecommendBuilderResult>(res, 'Ask recommendations');
}

export type LibraryCollectionItem = {
  name: string;
  pillar: string;
  signature: boolean;
  count: number;
  neverRecommended: number;
  readCount: number;
  recommendHref: string;
  hooksHref: string;
  booksHref: string;
};

export async function listLibraryCollections(): Promise<{
  totalCollections: number;
  signature: string[];
  items: LibraryCollectionItem[];
  byPillar: Record<string, LibraryCollectionItem[]>;
}> {
  const res = await fetch(`${base()}/api/library/collections`, {
    headers: authHeaders(false),
  });
  return handle(res, 'List collections');
}

export async function getCollectionsCalendar(limit = 8): Promise<{
  weeks: {
    series: string;
    angle: string;
    books: { _id: string; title: string; author: string; country?: string }[];
  }[];
}> {
  const res = await fetch(`${base()}/api/library/collections/calendar?limit=${limit}`, {
    headers: authHeaders(false),
  });
  return handle(res, 'Collections calendar');
}

export async function seedLibraryCollections(): Promise<{ created: number; total: number }> {
  const res = await fetch(`${base()}/api/library/collections/seed`, {
    method: 'POST',
    headers: authHeaders(),
    body: '{}',
  });
  return handle(res, 'Seed collections');
}

export async function markBooksRecommended(payload: {
  ids: string[];
  channel?: string;
  note?: string;
  contentUrl?: string;
  date?: string;
}): Promise<{ updated: number; entry: RecommendationEntry }> {
  const res = await fetch(`${base()}/api/library/recommend/mark`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handle<{ updated: number; entry: RecommendationEntry }>(res, 'Mark recommended');
}

export async function generateHooks(payload: {
  ids?: string[];
  bookId?: string;
  occasion?: string;
  purpose?: 'review' | 'recommendation' | 'list';
  useWinningHooks?: boolean;
  stylePatterns?: string[];
}): Promise<HooksResult> {
  const res = await fetch(`${base()}/api/library/content/hooks`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handle<HooksResult>(res, 'Generate hooks');
}

export async function askHooks(payload: {
  q: string;
  limit?: number;
  useWinningHooks?: boolean;
  /** AI judges fit even when themes/moods/tags are incomplete (default on server: true). */
  aiFit?: boolean;
  status?: string;
  neverRecommended?: boolean;
}): Promise<AskHooksResult> {
  const res = await fetch(`${base()}/api/library/content/ask-hooks`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handle<AskHooksResult>(res, 'Ask hooks');
}

/** Winning hook (or pasted text) → matching library books (+ optional hooks). */
export async function hookToBooks(payload: {
  hookId?: string;
  hookText?: string;
  limit?: number;
  generateHooks?: boolean;
  useWinningHooks?: boolean;
  aiFit?: boolean;
}): Promise<HookToBooksResult> {
  const res = await fetch(`${base()}/api/library/content/hook-to-books`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handle<HookToBooksResult>(res, 'Hook to books');
}

export async function importGoodreads(
  csv: string,
  options: {
    commit?: boolean;
    autoCreateAuthors?: boolean;
    offset?: number;
    limit?: number;
  } = {}
): Promise<ImportPreviewResult | ImportCommitResult> {
  const res = await fetch(`${base()}/api/library/import/goodreads`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ csv, ...options }),
  });
  return handle<ImportPreviewResult | ImportCommitResult>(res, 'Import');
}

/** Bulk import using our Excel/CSV template. */
export async function importLibraryTemplate(
  csv: string,
  options: {
    commit?: boolean;
    autoCreateAuthors?: boolean;
    offset?: number;
    limit?: number;
    /** insert = skip existing (default). upsert = update enrichment fields on matches. */
    mode?: 'insert' | 'upsert';
  } = {}
): Promise<ImportPreviewResult | ImportCommitResult> {
  const res = await fetch(`${base()}/api/library/import/template`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ csv, ...options }),
  });
  return handle<ImportPreviewResult | ImportCommitResult>(res, 'Template import');
}

/** Import books from the public site catalog (/books) into Library OS. */
export async function importSiteBooks(
  options: {
    commit?: boolean;
    autoCreateAuthors?: boolean;
    offset?: number;
    limit?: number;
  } = {}
): Promise<ImportPreviewResult | ImportCommitResult> {
  const res = await fetch(`${base()}/api/library/import/site-books`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(options),
  });
  return handle<ImportPreviewResult | ImportCommitResult>(res, 'Site books import');
}

/** Download Excel-friendly CSV template for bulk book insert. */
export async function downloadBulkImportTemplate(): Promise<void> {
  const res = await fetch(`${base()}/api/library/export/template`, {
    headers: authHeaders(false),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `Download failed (${res.status})`);
  }
  const csv = await res.text();
  triggerCsvDownload(csv, 'library-bulk-import-template.csv');
}

// ——— Export ———

function stampFilename(prefix: string): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${prefix}-${y}${m}${day}.csv`;
}

function triggerCsvDownload(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Download filtered library books as CSV (server-side, respects current filters). */
export async function downloadLibraryBooksCsv(
  params: Record<string, string | number | boolean | undefined> = {}
): Promise<void> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '' || v === false) continue;
    qs.set(k, String(v));
  }
  const res = await fetch(`${base()}/api/library/export/books?${qs}`, {
    headers: authHeaders(false),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = (body as { error?: string }).error || `Export failed (${res.status})`;
    throw new Error(msg);
  }
  const csv = await res.text();
  const disposition = res.headers.get('Content-Disposition') || '';
  const match = /filename="([^"]+)"/.exec(disposition);
  triggerCsvDownload(csv, match?.[1] || stampFilename('library-books'));
}

function csvCell(value: unknown): string {
  if (value == null) return '';
  const s = Array.isArray(value)
    ? value.map((v) => String(v ?? '').trim()).filter(Boolean).join('; ')
    : String(value);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Client-side CSV for a recommendation shortlist (optional hooks column). */
export function downloadRecommendShortlistCsv(
  books: {
    _id: string;
    title: string;
    author?: string;
    status?: string;
    rating?: number;
    pages?: number;
    genres?: string[];
    oneLineRecommendation?: string;
    timesRecommended?: number;
    lastRecommendedAt?: string | null;
  }[],
  hooksById: Record<string, string> = {},
  ids?: string[]
): void {
  const headers = [
    'Title',
    'Author',
    'Status',
    'Rating',
    'Pages',
    'Genres',
    'One-line recommendation',
    'Times recommended',
    'Last recommended',
    'Hook',
  ];
  const lines = [`\uFEFF${headers.map(csvCell).join(',')}`];
  for (const b of books) {
    if (ids && !ids.includes(b._id)) continue;
    lines.push(
      [
        b.title,
        b.author ?? '',
        b.status ?? '',
        b.rating ?? '',
        b.pages ?? '',
        b.genres ?? [],
        b.oneLineRecommendation ?? '',
        b.timesRecommended ?? 0,
        b.lastRecommendedAt ? String(b.lastRecommendedAt).slice(0, 10) : '',
        hooksById[b._id] ?? '',
      ]
        .map(csvCell)
        .join(',')
    );
  }
  triggerCsvDownload(`${lines.join('\r\n')}\r\n`, stampFilename('library-recommend'));
}
