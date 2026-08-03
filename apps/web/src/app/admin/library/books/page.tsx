'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit, Trash2, Sparkles, Loader2, Eye, Download, Tags } from 'lucide-react';
import {
  applyBookEnrichment,
  bulkUpdateLibraryBooks,
  deleteLibraryBook,
  downloadLibraryBooksCsv,
  listLibraryBooks,
  suggestBooksEnrichment,
} from '@/lib/library/api';
import {
  BOOK_FORMATS,
  OWNERSHIP_STATUSES,
  READING_STATUSES,
  RECOMMENDATION_CONFIDENCE,
  STATUS_LABELS,
  type BookEnrichSuggestion,
  type LibraryBookDto,
  type LibraryBookFacets,
} from '@/lib/library/types';

const PAGE_SIZE = 24;
/** Matches API BOOK_ENRICH_MAX — keep UI honest about how many we process. */
const AI_MAX = 5;

type EnrichRow = BookEnrichSuggestion & { include: boolean };

type BulkForm = {
  mode: 'add' | 'replace';
  genres: string;
  themes: string;
  tropes: string;
  moods: string;
  tags: string;
  seasonal: string;
  collections: string;
  status: string;
  ownership: string;
  location: string;
  recommendationConfidence: string;
};

const EMPTY_BULK: BulkForm = {
  mode: 'add',
  genres: '',
  themes: '',
  tropes: '',
  moods: '',
  tags: '',
  seasonal: '',
  collections: '',
  status: '',
  ownership: '',
  location: '',
  recommendationConfidence: '',
};

const inputClass =
  'w-full px-2 py-1.5 border border-chai-brown/20 rounded-md focus:outline-none focus:ring-2 focus:ring-terracotta font-body text-sm';

function listToText(v: string[] | undefined): string {
  return (v ?? []).join(', ');
}

function textToList(v: string): string[] {
  return v
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function LibraryBooksPage() {
  const [books, setBooks] = useState<LibraryBookDto[]>([]);
  const [facets, setFacets] = useState<LibraryBookFacets | undefined>();
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [status, setStatus] = useState('');
  const [genre, setGenre] = useState('');
  const [author, setAuthor] = useState('');
  const [tag, setTag] = useState('');
  const [theme, setTheme] = useState('');
  const [mood, setMood] = useState('');
  const [format, setFormat] = useState('');
  const [location, setLocation] = useState('');
  const [authorCountry, setAuthorCountry] = useState('');
  const [maxPages, setMaxPages] = useState('');
  const [owned, setOwned] = useState(false);
  const [sort, setSort] = useState('recent');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [suggesting, setSuggesting] = useState(false);
  const [applying, setApplying] = useState(false);
  const [enrichRows, setEnrichRows] = useState<EnrichRow[] | null>(null);
  const [enrichProvider, setEnrichProvider] = useState('');
  const [enrichNote, setEnrichNote] = useState('');
  const [activeEnrichId, setActiveEnrichId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<LibraryBookDto | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [bulkForm, setBulkForm] = useState<BulkForm>(EMPTY_BULK);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkNote, setBulkNote] = useState<string | null>(null);

  const facetsLoaded = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const g = params.get('genre');
    if (g) setGenre(g);
    const t = params.get('tag');
    if (t) {
      setTag(t);
      setShowAdvanced(true);
    }
    const loc = params.get('location');
    if (loc) {
      setLocation(loc);
      setShowAdvanced(true);
    }
    const qParam = params.get('q');
    if (qParam) setQuery(qParam);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(t);
  }, [query]);

  const load = useCallback(
    (nextPage: number) => {
      setLoading(true);
      listLibraryBooks({
        page: nextPage,
        limit: PAGE_SIZE,
        sort,
        q: debouncedQuery || undefined,
        status: status || undefined,
        genre: genre || undefined,
        author: author || undefined,
        tag: tag || undefined,
        theme: theme || undefined,
        mood: mood || undefined,
        format: format || undefined,
        location: location || undefined,
        authorCountry: authorCountry || undefined,
        maxPages: maxPages || undefined,
        owned: owned ? 'true' : undefined,
        facets: facetsLoaded.current ? undefined : 'true',
      })
        .then((res) => {
          setBooks(res.books);
          setTotal(res.total);
          setPage(res.page);
          setTotalPages(res.totalPages);
          if (res.facets) {
            facetsLoaded.current = true;
            setFacets(res.facets);
          }
          setError(null);
        })
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load books'))
        .finally(() => setLoading(false));
    },
    [sort, debouncedQuery, status, genre, author, tag, theme, mood, format, location, authorCountry, maxPages, owned]
  );

  useEffect(() => {
    setSelected(new Set());
    load(1);
  }, [load]);

  const handleDelete = (book: LibraryBookDto) => {
    if (!confirm(`Delete "${book.title}" from your library?`)) return;
    deleteLibraryBook(book._id)
      .then(() => load(page))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to delete book'));
  };

  const pageIds = books.map((b) => b._id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const pageMissingTags = books.filter((b) => !(b.tags?.length) && !(b.genres?.length)).map((b) => b._id);
  const rangeFrom = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeTo = Math.min(page * PAGE_SIZE, total);

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleSelectPage = (checked: boolean) => {
    if (checked) setSelected(new Set(pageIds));
    else setSelected(new Set());
  };

  const goToPage = (nextPage: number) => {
    setSelected(new Set());
    load(nextPage);
  };

  const runSuggest = (ids: string[]) => {
    if (ids.length === 0) {
      setError('Select books on this page first (or use “Select untagged on this page”).');
      return;
    }
    const capped = ids.slice(0, AI_MAX);
    setSuggesting(true);
    setError(null);
    setEnrichNote('');
    suggestBooksEnrichment(capped)
      .then((res) => {
        setEnrichProvider(res.provider);
        const partialErr =
          res.errors && res.errors.length
            ? ` (some providers failed: ${res.errors.map((e) => `${e.provider}: ${e.message}`).join(' · ')})`
            : '';
        const leftover = Math.max(0, ids.length - capped.length);
        const remainingNote = leftover
          ? ` · ${leftover} more selected — run again after applying (max ${AI_MAX} at a time).`
          : '';
        if (res.suggestions.length === 0) {
          setEnrichRows([]);
          setEnrichNote((res.message || 'No suggestions returned.') + partialErr + remainingNote);
          return;
        }
        setEnrichNote(`${res.suggestions.length} book(s) enriched${partialErr}${remainingNote}`);
        setEnrichRows(res.suggestions.map((s) => ({ ...s, include: true })));
        setActiveEnrichId(res.suggestions[0]?.id ?? null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'AI suggestion failed'))
      .finally(() => setSuggesting(false));
  };

  const applyEnrich = () => {
    if (!enrichRows) return;
    const updates = enrichRows.filter((r) => r.include).map(({ include: _i, ...rest }) => rest);
    if (updates.length === 0) {
      setEnrichRows(null);
      return;
    }
    setApplying(true);
    setError(null);
    applyBookEnrichment(updates)
      .then(() => {
        setEnrichRows(null);
        setEnrichProvider('');
        setSelected(new Set());
        load(page);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to apply enrichment'))
      .finally(() => setApplying(false));
  };

  const openBulkEdit = () => {
    if (selected.size === 0) return;
    setBulkForm(EMPTY_BULK);
    setBulkNote(null);
    setShowBulkEdit(true);
  };

  const runBulkUpdate = () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    const payload = {
      ids,
      mode: bulkForm.mode,
      genres: textToList(bulkForm.genres),
      themes: textToList(bulkForm.themes),
      tropes: textToList(bulkForm.tropes),
      moods: textToList(bulkForm.moods),
      tags: textToList(bulkForm.tags),
      seasonalRecommendation: textToList(bulkForm.seasonal),
      collections: textToList(bulkForm.collections),
      status: bulkForm.status || undefined,
      ownership: bulkForm.ownership || undefined,
      location: bulkForm.location.trim() || undefined,
      recommendationConfidence: bulkForm.recommendationConfidence || undefined,
    };
    const hasLists = [
      payload.genres,
      payload.themes,
      payload.tropes,
      payload.moods,
      payload.tags,
      payload.seasonalRecommendation,
      payload.collections,
    ].some((a) => a.length > 0);
    if (
      !hasLists &&
      !payload.status &&
      !payload.ownership &&
      !payload.location &&
      !payload.recommendationConfidence
    ) {
      setBulkNote('Add at least one tag/trope/mood/genre (or a status) before applying.');
      return;
    }

    setBulkSaving(true);
    setBulkNote(null);
    setError(null);
    bulkUpdateLibraryBooks(payload)
      .then((res) => {
        const failNote = res.failed.length ? ` · ${res.failed.length} failed` : '';
        setBulkNote(
          `Updated ${res.updated} of ${res.total} book(s) (${res.mode === 'replace' ? 'replaced' : 'added to'} lists)${failNote}.`
        );
        setShowBulkEdit(false);
        setBulkForm(EMPTY_BULK);
        load(page);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Bulk update failed'))
      .finally(() => setBulkSaving(false));
  };

  const patchEnrich = (id: string, patch: Partial<EnrichRow>) =>
    setEnrichRows((rows) => rows!.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const activeRow = enrichRows?.find((r) => r.id === activeEnrichId) ?? enrichRows?.[0] ?? null;

  const selectedCount = selected.size;
  const suggestIds = selectedCount ? [...selected] : pageMissingTags;

  const exportCsv = () => {
    setExporting(true);
    setError(null);
    downloadLibraryBooksCsv({
      sort,
      q: debouncedQuery || undefined,
      status: status || undefined,
      genre: genre || undefined,
      author: author || undefined,
      tag: tag || undefined,
      theme: theme || undefined,
      mood: mood || undefined,
      format: format || undefined,
      location: location || undefined,
      authorCountry: authorCountry || undefined,
      maxPages: maxPages || undefined,
      owned: owned || undefined,
    })
      .catch((e) => setError(e instanceof Error ? e.message : 'Export failed'))
      .finally(() => setExporting(false));
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown mb-2">My Books</h1>
          <p className="font-body text-chai-brown-light">
            {total} books in your library
            {total > 0 ? ` · showing ${rangeFrom}–${rangeTo}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/admin/library/import"
            className="inline-flex items-center gap-2 border border-chai-brown/20 text-chai-brown px-4 py-2 rounded-lg hover:bg-cream transition-colors font-body text-sm"
            title="Import from public /books, Excel, or Goodreads"
          >
            Import
          </Link>
          <Link
            href="/admin/library/books/duplicates"
            className="inline-flex items-center gap-2 border border-chai-brown/20 text-chai-brown px-4 py-2 rounded-lg hover:bg-cream transition-colors font-body text-sm"
          >
            Duplicates
          </Link>
          <button
            type="button"
            onClick={exportCsv}
            disabled={exporting || total === 0}
            className="inline-flex items-center gap-2 border border-chai-brown/20 text-chai-brown px-4 py-2 rounded-lg hover:bg-cream transition-colors font-body text-sm disabled:opacity-50"
            title="Download all books matching current filters as CSV"
          >
            {exporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => runSuggest(suggestIds)}
            disabled={suggesting || suggestIds.length === 0}
            className="inline-flex items-center gap-2 border border-terracotta/40 text-terracotta px-4 py-2 rounded-lg hover:bg-terracotta/10 transition-colors font-body text-sm disabled:opacity-50"
            title={
              selectedCount
                ? `AI enrich up to ${AI_MAX} of ${selectedCount} selected book(s)`
                : pageMissingTags.length
                  ? `AI enrich untagged books on this page (max ${AI_MAX})`
                  : 'Select books on this page to enrich'
            }
          >
            {suggesting ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            {selectedCount
              ? `AI: enrich selected (${Math.min(selectedCount, AI_MAX)})`
              : pageMissingTags.length
                ? `AI: enrich this page (${Math.min(pageMissingTags.length, AI_MAX)})`
                : 'AI: enrich books'}
          </button>
          <Link
            href="/admin/library/books/new"
            className="inline-flex items-center gap-2 bg-terracotta text-white px-4 py-2 rounded-lg hover:bg-terracotta/90 transition-colors font-body text-sm"
          >
            <Plus size={20} />
            Add Book
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-body text-sm">
          {error}
        </div>
      )}

      {enrichNote && !enrichRows?.length && (
        <div className="mb-4 p-4 bg-cream/60 border border-chai-brown/10 rounded-lg text-chai-brown font-body text-sm">
          {enrichNote}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm font-body">
        <span className="text-chai-brown-light">
          {selectedCount
            ? `${selectedCount} selected`
            : 'Select books to bulk-edit tags or AI-enrich (max 5 per AI run)'}
        </span>
        <button
          type="button"
          onClick={() => toggleSelectPage(true)}
          disabled={books.length === 0}
          className="text-terracotta hover:underline disabled:opacity-40"
        >
          Select this page
        </button>
        <button
          type="button"
          onClick={() => setSelected(new Set(pageMissingTags))}
          disabled={pageMissingTags.length === 0}
          className="text-terracotta hover:underline disabled:opacity-40"
        >
          Select untagged on this page ({pageMissingTags.length})
        </button>
        {selectedCount > 0 && (
          <>
            <button
              type="button"
              onClick={openBulkEdit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-terracotta text-white hover:bg-terracotta/90"
            >
              <Tags size={14} />
              Bulk edit ({selectedCount})
            </button>
            <button type="button" onClick={() => setSelected(new Set())} className="text-chai-brown-light hover:underline">
              Clear selection
            </button>
          </>
        )}
      </div>

      {bulkNote && (
        <div className="mb-4 p-3 bg-cream border border-chai-brown/10 rounded-lg font-body text-sm text-chai-brown">
          {bulkNote}
        </div>
      )}

      {showBulkEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-xl max-h-[92vh] overflow-y-auto">
            <div className="p-5 border-b border-chai-brown/10">
              <h2 className="font-serif text-2xl text-chai-brown">Bulk edit {selectedCount} books</h2>
              <p className="font-body text-sm text-chai-brown-light mt-1">
                Add tags, tropes, moods, genres, and more to every selected book. Separate values with
                commas or semicolons.
              </p>
            </div>
            <div className="p-5 space-y-4">
              <fieldset className="space-y-2">
                <legend className="font-body text-sm font-medium text-chai-brown mb-1">List fields</legend>
                <div className="flex flex-wrap gap-4 mb-2">
                  <label className="inline-flex items-center gap-2 font-body text-sm text-chai-brown">
                    <input
                      type="radio"
                      name="bulk-mode"
                      checked={bulkForm.mode === 'add'}
                      onChange={() => setBulkForm((f) => ({ ...f, mode: 'add' }))}
                    />
                    Add to existing (keep current values)
                  </label>
                  <label className="inline-flex items-center gap-2 font-body text-sm text-chai-brown">
                    <input
                      type="radio"
                      name="bulk-mode"
                      checked={bulkForm.mode === 'replace'}
                      onChange={() => setBulkForm((f) => ({ ...f, mode: 'replace' }))}
                    />
                    Replace lists (overwrite those fields)
                  </label>
                </div>
                {(
                  [
                    ['tags', 'Tags'],
                    ['tropes', 'Tropes'],
                    ['moods', 'Moods'],
                    ['themes', 'Themes'],
                    ['genres', 'Genres'],
                    ['seasonal', 'Seasonal'],
                    ['collections', 'Collections'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="block">
                    <span className="block font-body text-xs text-chai-brown-light mb-1">{label}</span>
                    <input
                      className={inputClass}
                      value={bulkForm[key]}
                      onChange={(e) => setBulkForm((f) => ({ ...f, [key]: e.target.value }))}
                      placeholder={key === 'tags' ? 'e.g. comfort read, eldest daughters' : undefined}
                    />
                  </label>
                ))}
              </fieldset>

              <fieldset className="grid sm:grid-cols-2 gap-3">
                <legend className="font-body text-sm font-medium text-chai-brown mb-1 sm:col-span-2">
                  Optional shared fields
                </legend>
                <label className="block">
                  <span className="block font-body text-xs text-chai-brown-light mb-1">Status</span>
                  <select
                    className={inputClass}
                    value={bulkForm.status}
                    onChange={(e) => setBulkForm((f) => ({ ...f, status: e.target.value }))}
                  >
                    <option value="">— no change —</option>
                    {READING_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="block font-body text-xs text-chai-brown-light mb-1">Ownership</span>
                  <select
                    className={inputClass}
                    value={bulkForm.ownership}
                    onChange={(e) => setBulkForm((f) => ({ ...f, ownership: e.target.value }))}
                  >
                    <option value="">— no change —</option>
                    {OWNERSHIP_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="block font-body text-xs text-chai-brown-light mb-1">Location</span>
                  <input
                    className={inputClass}
                    value={bulkForm.location}
                    onChange={(e) => setBulkForm((f) => ({ ...f, location: e.target.value }))}
                    placeholder="e.g. India"
                  />
                </label>
                <label className="block">
                  <span className="block font-body text-xs text-chai-brown-light mb-1">
                    Recommendation confidence
                  </span>
                  <select
                    className={inputClass}
                    value={bulkForm.recommendationConfidence}
                    onChange={(e) =>
                      setBulkForm((f) => ({ ...f, recommendationConfidence: e.target.value }))
                    }
                  >
                    <option value="">— no change —</option>
                    {RECOMMENDATION_CONFIDENCE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
              </fieldset>
            </div>
            <div className="p-5 border-t border-chai-brown/10 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowBulkEdit(false)}
                disabled={bulkSaving}
                className="px-4 py-2 rounded-lg border border-chai-brown/20 font-body text-sm text-chai-brown hover:bg-cream disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={runBulkUpdate}
                disabled={bulkSaving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-terracotta text-white font-body text-sm hover:bg-terracotta/90 disabled:opacity-50"
              >
                {bulkSaving ? <Loader2 size={16} className="animate-spin" /> : <Tags size={16} />}
                {bulkSaving ? 'Updating…' : `Apply to ${selectedCount} books`}
              </button>
            </div>
          </div>
        </div>
      )}

      {enrichRows && enrichRows.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[92vh] flex flex-col">
            <div className="p-5 border-b border-chai-brown/10">
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-terracotta" />
                <h2 className="font-serif text-2xl text-chai-brown">Review AI book tags</h2>
              </div>
              <p className="font-body text-sm text-chai-brown-light mt-1">
                {enrichProvider && <>via {enrichProvider} · </>}
                Edit fields, untick to skip, then apply. Arrays merge with existing values; empty metadata fields get filled.
              </p>
              {enrichNote && <p className="font-body text-xs text-chai-brown-light mt-1">{enrichNote}</p>}
            </div>

            <div className="flex-1 overflow-hidden flex flex-col sm:flex-row min-h-0">
              <div className="sm:w-56 border-b sm:border-b-0 sm:border-r border-chai-brown/10 overflow-y-auto shrink-0">
                {enrichRows.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => setActiveEnrichId(row.id)}
                    className={`w-full text-left px-4 py-3 font-body text-sm border-b border-chai-brown/5 ${
                      activeRow?.id === row.id ? 'bg-terracotta/10 text-chai-brown' : 'hover:bg-cream/50 text-chai-brown-light'
                    }`}
                  >
                    <span className="inline-flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={row.include}
                        onChange={(e) => {
                          e.stopPropagation();
                          patchEnrich(row.id, { include: e.target.checked });
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-0.5"
                      />
                      <span>
                        <span className="block font-medium text-chai-brown line-clamp-2">{row.title}</span>
                        <span className="block text-xs opacity-70">{row.author || '—'}</span>
                      </span>
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {activeRow ? (
                  <>
                    <div>
                      <h3 className="font-serif text-xl text-chai-brown">{activeRow.title}</h3>
                      <p className="font-body text-sm text-chai-brown-light">{activeRow.author}</p>
                    </div>
                    <label className="block font-body text-xs text-chai-brown-light">
                      Genres
                      <input
                        className={`${inputClass} mt-1`}
                        value={listToText(activeRow.genres)}
                        onChange={(e) => patchEnrich(activeRow.id, { genres: textToList(e.target.value) })}
                      />
                    </label>
                    <label className="block font-body text-xs text-chai-brown-light">
                      Subgenres
                      <input
                        className={`${inputClass} mt-1`}
                        value={listToText(activeRow.subgenres)}
                        onChange={(e) => patchEnrich(activeRow.id, { subgenres: textToList(e.target.value) })}
                      />
                    </label>
                    <label className="block font-body text-xs text-chai-brown-light">
                      Themes
                      <input
                        className={`${inputClass} mt-1`}
                        value={listToText(activeRow.themes)}
                        onChange={(e) => patchEnrich(activeRow.id, { themes: textToList(e.target.value) })}
                      />
                    </label>
                    <label className="block font-body text-xs text-chai-brown-light">
                      Moods
                      <input
                        className={`${inputClass} mt-1`}
                        value={listToText(activeRow.moods)}
                        onChange={(e) => patchEnrich(activeRow.id, { moods: textToList(e.target.value) })}
                      />
                    </label>
                    <label className="block font-body text-xs text-chai-brown-light">
                      Tropes
                      <input
                        className={`${inputClass} mt-1`}
                        value={listToText(activeRow.tropes)}
                        onChange={(e) => patchEnrich(activeRow.id, { tropes: textToList(e.target.value) })}
                      />
                    </label>
                    <label className="block font-body text-xs text-chai-brown-light">
                      Tags (occasions / hooks)
                      <input
                        className={`${inputClass} mt-1`}
                        value={listToText(activeRow.tags)}
                        onChange={(e) => patchEnrich(activeRow.id, { tags: textToList(e.target.value) })}
                      />
                    </label>
                    <label className="block font-body text-xs text-chai-brown-light">
                      Keywords
                      <input
                        className={`${inputClass} mt-1`}
                        value={listToText(activeRow.keywords)}
                        onChange={(e) => patchEnrich(activeRow.id, { keywords: textToList(e.target.value) })}
                      />
                    </label>
                    <label className="block font-body text-xs text-chai-brown-light">
                      Seasonal / occasions
                      <input
                        className={`${inputClass} mt-1`}
                        value={listToText(activeRow.seasonalRecommendation)}
                        onChange={(e) =>
                          patchEnrich(activeRow.id, { seasonalRecommendation: textToList(e.target.value) })
                        }
                      />
                    </label>
                    <label className="block font-body text-xs text-chai-brown-light">
                      Similar books
                      <input
                        className={`${inputClass} mt-1`}
                        value={listToText(activeRow.similarBooks)}
                        onChange={(e) => patchEnrich(activeRow.id, { similarBooks: textToList(e.target.value) })}
                      />
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block font-body text-xs text-chai-brown-light">
                        Audience
                        <input
                          className={`${inputClass} mt-1`}
                          value={activeRow.audience}
                          onChange={(e) => patchEnrich(activeRow.id, { audience: e.target.value })}
                        />
                      </label>
                      <label className="block font-body text-xs text-chai-brown-light">
                        Reading level
                        <input
                          className={`${inputClass} mt-1`}
                          value={activeRow.readingLevel}
                          onChange={(e) => patchEnrich(activeRow.id, { readingLevel: e.target.value })}
                        />
                      </label>
                      <label className="block font-body text-xs text-chai-brown-light">
                        Writing style
                        <input
                          className={`${inputClass} mt-1`}
                          value={activeRow.writingStyle}
                          onChange={(e) => patchEnrich(activeRow.id, { writingStyle: e.target.value })}
                        />
                      </label>
                      <label className="block font-body text-xs text-chai-brown-light">
                        Pages
                        <input
                          type="number"
                          className={`${inputClass} mt-1`}
                          value={activeRow.pages ?? ''}
                          onChange={(e) =>
                            patchEnrich(activeRow.id, {
                              pages: e.target.value ? Number(e.target.value) : undefined,
                            })
                          }
                        />
                      </label>
                      <label className="block font-body text-xs text-chai-brown-light">
                        Series
                        <input
                          className={`${inputClass} mt-1`}
                          value={activeRow.series}
                          onChange={(e) => patchEnrich(activeRow.id, { series: e.target.value })}
                        />
                      </label>
                      <label className="block font-body text-xs text-chai-brown-light">
                        Publisher
                        <input
                          className={`${inputClass} mt-1`}
                          value={activeRow.publisher}
                          onChange={(e) => patchEnrich(activeRow.id, { publisher: e.target.value })}
                        />
                      </label>
                      <label className="block font-body text-xs text-chai-brown-light">
                        Country / setting
                        <input
                          className={`${inputClass} mt-1`}
                          value={activeRow.country}
                          onChange={(e) => patchEnrich(activeRow.id, { country: e.target.value })}
                        />
                      </label>
                      <label className="block font-body text-xs text-chai-brown-light">
                        Original language
                        <input
                          className={`${inputClass} mt-1`}
                          value={activeRow.originalLanguage}
                          onChange={(e) => patchEnrich(activeRow.id, { originalLanguage: e.target.value })}
                        />
                      </label>
                    </div>
                    <label className="block font-body text-xs text-chai-brown-light">
                      One-line recommendation
                      <input
                        className={`${inputClass} mt-1`}
                        value={activeRow.oneLineRecommendation}
                        onChange={(e) => patchEnrich(activeRow.id, { oneLineRecommendation: e.target.value })}
                      />
                    </label>
                    <label className="block font-body text-xs text-chai-brown-light">
                      Description (fills only if empty)
                      <textarea
                        rows={3}
                        className={`${inputClass} mt-1`}
                        value={activeRow.description}
                        onChange={(e) => patchEnrich(activeRow.id, { description: e.target.value })}
                      />
                    </label>
                    <label className="block font-body text-xs text-chai-brown-light">
                      Trigger warnings
                      <input
                        className={`${inputClass} mt-1`}
                        value={listToText(activeRow.triggerWarnings)}
                        onChange={(e) => patchEnrich(activeRow.id, { triggerWarnings: textToList(e.target.value) })}
                      />
                    </label>
                  </>
                ) : (
                  <p className="font-body text-chai-brown-light">Pick a book on the left.</p>
                )}
              </div>
            </div>

            <div className="p-5 border-t border-chai-brown/10 flex gap-3">
              <button
                type="button"
                onClick={applyEnrich}
                disabled={applying}
                className="flex-1 bg-terracotta text-white py-2 rounded-lg hover:bg-terracotta/90 font-body disabled:opacity-50"
              >
                {applying
                  ? 'Applying…'
                  : `Apply ${enrichRows.filter((r) => r.include).length} book(s)`}
              </button>
              <button
                type="button"
                onClick={() => setEnrichRows(null)}
                disabled={applying}
                className="flex-1 bg-gray-200 text-chai-brown py-2 rounded-lg hover:bg-gray-300 font-body disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[92vh] flex flex-col">
            <div className="p-5 border-b border-chai-brown/10 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-serif text-2xl text-chai-brown">{viewing.title}</h2>
                {viewing.subtitle && (
                  <p className="font-body text-sm text-chai-brown-light mt-0.5">{viewing.subtitle}</p>
                )}
                <p className="font-body text-sm text-chai-brown mt-1">
                  {viewing.author || 'Unknown author'}
                  {viewing.rating ? ` · ${viewing.rating}★` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewing(null)}
                className="font-body text-sm text-chai-brown-light hover:text-chai-brown shrink-0"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5 font-body text-sm text-chai-brown">
              {viewing.coverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={viewing.coverImage}
                  alt=""
                  className="w-28 h-40 object-cover rounded-md border border-chai-brown/10"
                />
              )}

              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <dt className="text-xs text-chai-brown-light">Status</dt>
                  <dd>{STATUS_LABELS[viewing.status] ?? viewing.status}</dd>
                </div>
                <div>
                  <dt className="text-xs text-chai-brown-light">Pages</dt>
                  <dd>{viewing.pages || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-chai-brown-light">Format</dt>
                  <dd>{viewing.format || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-chai-brown-light">Series</dt>
                  <dd>
                    {viewing.series
                      ? `${viewing.series}${viewing.seriesNumber ? ` #${viewing.seriesNumber}` : ''}`
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-chai-brown-light">Publisher</dt>
                  <dd>{viewing.publisher || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-chai-brown-light">Country / setting</dt>
                  <dd>{viewing.country || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-chai-brown-light">Language</dt>
                  <dd>{viewing.originalLanguage || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-chai-brown-light">Audience</dt>
                  <dd>{viewing.audience || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-chai-brown-light">Ownership</dt>
                  <dd>{viewing.ownership || '—'}</dd>
                </div>
              </dl>

              {viewing.oneLineRecommendation && (
                <div>
                  <p className="text-xs text-chai-brown-light mb-1">Pitch</p>
                  <p className="italic">{viewing.oneLineRecommendation}</p>
                </div>
              )}
              {viewing.description && (
                <div>
                  <p className="text-xs text-chai-brown-light mb-1">Description</p>
                  <p className="whitespace-pre-wrap">{viewing.description}</p>
                </div>
              )}

              {(
                [
                  ['Genres', viewing.genres],
                  ['Subgenres', viewing.subgenres],
                  ['Themes', viewing.themes],
                  ['Moods', viewing.moods],
                  ['Tropes', viewing.tropes],
                  ['Tags', viewing.tags],
                  ['Keywords', viewing.keywords],
                  ['Seasonal / occasions', viewing.seasonalRecommendation],
                  ['Similar books', viewing.similarBooks],
                  ['Trigger warnings', viewing.triggerWarnings],
                ] as [string, string[] | undefined][]
              )
                .filter(([, vals]) => (vals?.length ?? 0) > 0)
                .map(([label, vals]) => (
                  <div key={label}>
                    <p className="text-xs text-chai-brown-light mb-1">{label}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(vals ?? []).map((v) => (
                        <span
                          key={`${label}-${v}`}
                          className="px-2 py-0.5 rounded-md bg-cream border border-chai-brown/10 text-xs"
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}

              {(viewing.copies?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs text-chai-brown-light mb-1">Copies</p>
                  <ul className="space-y-1">
                    {viewing.copies.map((c, i) => (
                      <li key={i}>
                        {[c.format, c.location, c.notes].filter(Boolean).join(' · ') || '—'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {viewing.personalNotes && (
                <div>
                  <p className="text-xs text-chai-brown-light mb-1">Personal notes</p>
                  <p className="whitespace-pre-wrap">{viewing.personalNotes}</p>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-chai-brown/10 flex gap-3">
              <Link
                href={`/admin/library/books/${viewing._id}`}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-terracotta text-white py-2 rounded-lg hover:bg-terracotta/90 font-body"
                onClick={() => setViewing(null)}
              >
                <Edit size={16} />
                Edit
              </Link>
              <button
                type="button"
                onClick={() => setViewing(null)}
                className="flex-1 bg-gray-200 text-chai-brown py-2 rounded-lg hover:bg-gray-300 font-body"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 space-y-3">
        <div>
          <label htmlFor="library-universal-search" className="block font-body text-sm font-medium text-chai-brown mb-1.5">
            Search all fields
          </label>
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-chai-brown/40 pointer-events-none"
            />
            <input
              id="library-universal-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Keywords across everything — e.g. partition kashmir, "women writers", romantasy…'
              className="w-full pl-10 pr-4 py-2.5 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body text-sm"
            />
          </div>
          <p className="mt-1 font-body text-xs text-chai-brown-light">
            Matches title, author, genres, themes, moods, tropes, tags, collections, notes, ISBN, and more.
            Multiple words = all must match (use quotes for an exact phrase).
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 border border-chai-brown/20 rounded-lg text-sm font-body text-chai-brown"
          >
            <option value="">All statuses</option>
            {READING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="px-3 py-2 border border-chai-brown/20 rounded-lg text-sm font-body text-chai-brown"
          >
            <option value="">All genres</option>
            {(facets?.genres ?? []).map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <select
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="px-3 py-2 border border-chai-brown/20 rounded-lg text-sm font-body text-chai-brown"
          >
            <option value="">All authors</option>
            {(facets?.authors ?? []).map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-2 border border-chai-brown/20 rounded-lg text-sm font-body text-chai-brown"
          >
            <option value="recent">Recently added</option>
            <option value="title">Title A–Z</option>
            <option value="rating">Highest rated</option>
            <option value="finished">Recently finished</option>
          </select>
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="px-3 py-2 font-body text-sm text-chai-brown border border-chai-brown/20 rounded-lg hover:bg-cream"
          >
            {showAdvanced ? 'Fewer filters' : 'More filters'}
          </button>
          {(status || genre || author || query || tag || theme || mood || format || location || authorCountry || maxPages || owned) && (
            <button
              type="button"
              onClick={() => {
                setStatus('');
                setGenre('');
                setAuthor('');
                setQuery('');
                setDebouncedQuery('');
                setTag('');
                setTheme('');
                setMood('');
                setFormat('');
                setLocation('');
                setAuthorCountry('');
                setMaxPages('');
                setOwned(false);
              }}
              className="px-3 py-2 font-body text-sm text-terracotta hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {showAdvanced && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4 rounded-lg border border-chai-brown/10 bg-cream/40">
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="px-3 py-2 border border-chai-brown/20 rounded-lg text-sm font-body text-chai-brown bg-white"
            >
              <option value="">Any tag</option>
              {(facets?.tags ?? []).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="px-3 py-2 border border-chai-brown/20 rounded-lg text-sm font-body text-chai-brown bg-white"
            >
              <option value="">Any theme</option>
              {(facets?.themes ?? []).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="px-3 py-2 border border-chai-brown/20 rounded-lg text-sm font-body text-chai-brown bg-white"
            >
              <option value="">Any mood</option>
              {(facets?.moods ?? []).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="px-3 py-2 border border-chai-brown/20 rounded-lg text-sm font-body text-chai-brown bg-white"
            >
              <option value="">Any location</option>
              {(facets?.locations ?? []).map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="px-3 py-2 border border-chai-brown/20 rounded-lg text-sm font-body text-chai-brown bg-white"
            >
              <option value="">Any format</option>
              {BOOK_FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <select
              value={authorCountry}
              onChange={(e) => setAuthorCountry(e.target.value)}
              className="px-3 py-2 border border-chai-brown/20 rounded-lg text-sm font-body text-chai-brown bg-white"
            >
              <option value="">Any author nationality</option>
              {(facets?.authorCountries ?? []).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={maxPages}
              onChange={(e) => setMaxPages(e.target.value)}
              placeholder="Max pages"
              className="px-3 py-2 border border-chai-brown/20 rounded-lg text-sm font-body text-chai-brown bg-white"
            />
            <label className="inline-flex items-center gap-2 font-body text-sm text-chai-brown px-1">
              <input type="checkbox" checked={owned} onChange={(e) => setOwned(e.target.checked)} />
              Owned only
            </label>
          </div>
        )}
      </div>

      {loading && books.length === 0 ? (
        <p className="font-body text-chai-brown-light">Loading books…</p>
      ) : books.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-chai-brown/15 bg-cream/40">
          <p className="font-serif text-xl text-chai-brown mb-2">No books found</p>
          <p className="font-body text-sm text-chai-brown-light">
            Add a book manually or import your Goodreads library.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-chai-brown/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream/50">
                <tr>
                  <th className="px-4 py-3 w-8">
                    <input
                      type="checkbox"
                      aria-label="Select all on this page"
                      checked={allPageSelected}
                      onChange={(e) => toggleSelectPage(e.target.checked)}
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">Title</th>
                  <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">Author</th>
                  <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">Status</th>
                  <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">Rating</th>
                  <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">Genres</th>
                  <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">Tags</th>
                  <th className="px-4 py-3 text-right font-body text-sm font-medium text-chai-brown">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-chai-brown/10">
                {books.map((b) => (
                  <tr
                    key={b._id}
                    className={`hover:bg-cream/40 ${selected.has(b._id) ? 'bg-terracotta/5' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Select ${b.title}`}
                        checked={selected.has(b._id)}
                        onChange={() => toggleSelect(b._id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setViewing(b)}
                        className="font-body text-left text-chai-brown hover:text-terracotta"
                      >
                        {b.title}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-chai-brown-light">{b.author || '—'}</td>
                    <td className="px-4 py-3 font-body text-sm text-chai-brown-light">
                      {STATUS_LABELS[b.status] ?? b.status}
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-chai-brown-light">
                      {b.rating ? `${b.rating}★` : '—'}
                    </td>
                    <td className="px-4 py-3 font-body text-xs text-chai-brown-light">
                      {b.genres.slice(0, 3).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3 font-body text-xs text-chai-brown-light">
                      {(b.tags ?? []).slice(0, 2).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setViewing(b)}
                          className="p-2 text-chai-brown hover:bg-cream rounded"
                          title="View details"
                        >
                          <Eye size={18} />
                        </button>
                        <Link
                          href={`/admin/library/books/${b._id}`}
                          className="p-2 text-terracotta hover:bg-terracotta/10 rounded"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          onClick={() => handleDelete(b)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {total > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => goToPage(page - 1)}
            className="px-3 py-2 rounded-lg border border-chai-brown/20 font-body text-sm text-chai-brown disabled:opacity-40 hover:bg-cream"
          >
            Previous
          </button>
          <span className="font-body text-sm text-chai-brown-light">
            Page {page} of {totalPages} · {PAGE_SIZE} per page · {rangeFrom}–{rangeTo} of {total}
          </span>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => goToPage(page + 1)}
            className="px-3 py-2 rounded-lg border border-chai-brown/20 font-body text-sm text-chai-brown disabled:opacity-40 hover:bg-cream"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
