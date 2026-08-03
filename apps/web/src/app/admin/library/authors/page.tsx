'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Star, Sparkles, Loader2, Search, Eye } from 'lucide-react';
import {
  applyAuthorEnrichment,
  createLibraryAuthor,
  deleteLibraryAuthor,
  listLibraryAuthors,
  suggestAuthorNationalities,
  updateLibraryAuthor,
} from '@/lib/library/api';
import type { AuthorEnrichSuggestion, LibraryAuthorDto } from '@/lib/library/types';

type EnrichRow = AuthorEnrichSuggestion & { include: boolean };

type FormState = {
  name: string;
  country: string;
  primaryLanguage: string;
  website: string;
  goodreads: string;
  instagram: string;
  shortBio: string;
  awards: string;
  priorityAuthor: boolean;
};

const EMPTY: FormState = {
  name: '',
  country: '',
  primaryLanguage: '',
  website: '',
  goodreads: '',
  instagram: '',
  shortBio: '',
  awards: '',
  priorityAuthor: false,
};

const inputClass =
  'w-full px-3 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body text-sm';

const PAGE_SIZE = 25;

export default function LibraryAuthorsPage() {
  const [authors, setAuthors] = useState<LibraryAuthorDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<LibraryAuthorDto | null>(null);
  const [viewing, setViewing] = useState<LibraryAuthorDto | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);

  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [missingOnly, setMissingOnly] = useState(false);

  const [suggesting, setSuggesting] = useState(false);
  const [applying, setApplying] = useState(false);
  const [enrichRows, setEnrichRows] = useState<EnrichRow[] | null>(null);
  const [enrichProvider, setEnrichProvider] = useState('');
  const [enrichNote, setEnrichNote] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(t);
  }, [query]);

  const load = useCallback(
    (nextPage: number) => {
      setLoading(true);
      listLibraryAuthors({
        page: nextPage,
        limit: PAGE_SIZE,
        q: debouncedQuery || undefined,
        missingCountry: missingOnly || undefined,
      })
        .then((res) => {
          setAuthors(res.authors);
          setTotal(res.total);
          setPage(res.page);
          setTotalPages(res.totalPages);
          setError(null);
        })
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load authors'))
        .finally(() => setLoading(false));
    },
    [debouncedQuery, missingOnly]
  );

  useEffect(() => {
    setSelected(new Set());
    load(1);
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setShowForm(true);
  };

  const openEdit = (a: LibraryAuthorDto) => {
    setEditing(a);
    setForm({
      name: a.name,
      country: a.country ?? '',
      primaryLanguage: a.primaryLanguage ?? '',
      website: a.website ?? '',
      goodreads: a.goodreads ?? '',
      instagram: a.instagram ?? '',
      shortBio: a.shortBio ?? '',
      awards: (a.awards ?? []).join(', '),
      priorityAuthor: a.priorityAuthor,
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      country: form.country.trim(),
      primaryLanguage: form.primaryLanguage.trim(),
      website: form.website.trim(),
      goodreads: form.goodreads.trim(),
      instagram: form.instagram.trim(),
      shortBio: form.shortBio.trim(),
      awards: form.awards.split(',').map((s) => s.trim()).filter(Boolean),
      priorityAuthor: form.priorityAuthor,
    };
    (editing ? updateLibraryAuthor(editing._id, payload) : createLibraryAuthor(payload))
      .then(() => {
        setShowForm(false);
        setEditing(null);
        setForm(EMPTY);
        load(page);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to save author'))
      .finally(() => setSaving(false));
  };

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectPageMissing = () =>
    setSelected(new Set(authors.filter((a) => !a.country).map((a) => a._id)));

  const clearSelection = () => setSelected(new Set());

  const pageIds = authors.map((a) => a._id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const pageMissingIds = authors.filter((a) => !a.country).map((a) => a._id);
  const rangeFrom = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeTo = Math.min(page * PAGE_SIZE, total);

  const toggleSelectPage = (checked: boolean) => {
    // Select-all only covers the visible page — never the whole library.
    if (checked) setSelected(new Set(pageIds));
    else setSelected(new Set());
  };

  const goToPage = (nextPage: number) => {
    setSelected(new Set());
    load(nextPage);
  };

  const runSuggest = (opts: { ids: string[] }) => {
    if (opts.ids.length === 0) {
      setError('Select authors on this page first (or use “Select missing on this page”).');
      return;
    }
    setSuggesting(true);
    setError(null);
    setEnrichNote('');
    suggestAuthorNationalities(opts)
      .then((res) => {
        setEnrichProvider(res.provider);
        const partialErr =
          res.errors && res.errors.length
            ? ` (some providers failed: ${res.errors.map((e) => `${e.provider}: ${e.message}`).join(' · ')})`
            : '';
        const remainingNote = res.remaining ? ` · ${res.remaining} more still need enrichment — run again.` : '';
        if (res.suggestions.length === 0) {
          setEnrichRows([]);
          setEnrichNote((res.message || 'No suggestions returned.') + partialErr + remainingNote);
          return;
        }
        setEnrichNote(
          `${res.suggestions.length} suggestion(s)${partialErr}${remainingNote}`
        );
        setEnrichRows(res.suggestions.map((s) => ({ ...s, include: true })));
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'AI suggestion failed'))
      .finally(() => setSuggesting(false));
  };

  const applyEnrich = () => {
    if (!enrichRows) return;
    const updates = enrichRows
      .filter((r) => r.include)
      .map((r) => ({ id: r.id, country: r.country, primaryLanguage: r.primaryLanguage }));
    if (updates.length === 0) {
      setEnrichRows(null);
      return;
    }
    setApplying(true);
    setError(null);
    applyAuthorEnrichment(updates)
      .then(() => {
        setEnrichRows(null);
        setEnrichProvider('');
        clearSelection();
        load(page);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to apply enrichment'))
      .finally(() => setApplying(false));
  };

  const handleDelete = (a: LibraryAuthorDto) => {
    if (!confirm(`Delete author "${a.name}"? (Books stay in your library.)`)) return;
    deleteLibraryAuthor(a._id)
      .then(() => load(page))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to delete author'));
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown mb-2">Authors</h1>
          <p className="font-body text-chai-brown-light">
            {total} authors
            {total > 0 ? ` · showing ${rangeFrom}–${rangeTo}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              runSuggest({
                ids: selected.size ? [...selected] : pageMissingIds,
              })
            }
            disabled={suggesting || (selected.size === 0 && pageMissingIds.length === 0)}
            className="inline-flex items-center gap-2 border border-terracotta/40 text-terracotta px-4 py-2 rounded-lg hover:bg-terracotta/10 transition-colors font-body text-sm disabled:opacity-50"
            title={
              selected.size
                ? `Use AI on the ${selected.size} selected author(s) on this page`
                : pageMissingIds.length
                  ? `Use AI on ${pageMissingIds.length} author(s) missing a country on this page`
                  : 'No authors on this page need a nationality'
            }
          >
            {suggesting ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            {selected.size
              ? `AI: fill selected (${selected.size})`
              : pageMissingIds.length
                ? `AI: fill this page (${pageMissingIds.length})`
                : 'AI: fill this page'}
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-terracotta text-white px-4 py-2 rounded-lg hover:bg-terracotta/90 transition-colors font-body text-sm"
          >
            <Plus size={20} />
            Add Author
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-chai-brown/40 pointer-events-none"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search authors by name…"
            className="w-full pl-10 pr-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body text-sm"
          />
        </div>
        <label className="inline-flex items-center gap-2 font-body text-sm text-chai-brown whitespace-nowrap">
          <input
            type="checkbox"
            checked={missingOnly}
            onChange={(e) => setMissingOnly(e.target.checked)}
          />
          Missing country only
        </label>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm font-body">
        <span className="text-chai-brown-light">
          {total > 0 ? `Showing ${rangeFrom}–${rangeTo} of ${total}` : 'No authors'}
          {selected.size ? ` · ${selected.size} selected on this page` : ''}
        </span>
        <button
          type="button"
          onClick={() => toggleSelectPage(true)}
          disabled={authors.length === 0}
          className="text-terracotta hover:underline disabled:opacity-40"
        >
          Select this page
        </button>
        <button
          type="button"
          onClick={selectPageMissing}
          disabled={pageMissingIds.length === 0}
          className="text-terracotta hover:underline disabled:opacity-40"
        >
          Select missing on this page ({pageMissingIds.length})
        </button>
        {selected.size > 0 && (
          <button type="button" onClick={clearSelection} className="text-chai-brown-light hover:underline">
            Clear selection
          </button>
        )}
      </div>

      {enrichNote && !enrichRows?.length && (
        <div className="mb-4 p-4 bg-cream/60 border border-chai-brown/10 rounded-lg text-chai-brown font-body text-sm">
          {enrichNote}
        </div>
      )}

      {enrichRows && enrichRows.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-chai-brown/10">
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-terracotta" />
                <h2 className="font-serif text-2xl text-chai-brown">Review AI nationalities</h2>
              </div>
              <p className="font-body text-sm text-chai-brown-light mt-1">
                {enrichProvider && <>via {enrichProvider} · </>}Edit any value, untick to skip, then apply.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <table className="w-full">
                <thead>
                  <tr className="text-left font-body text-xs text-chai-brown-light">
                    <th className="pb-2 w-8"></th>
                    <th className="pb-2">Author</th>
                    <th className="pb-2">Country</th>
                    <th className="pb-2">Language</th>
                  </tr>
                </thead>
                <tbody>
                  {enrichRows.map((row, i) => (
                    <tr key={row.id} className="border-t border-chai-brown/10">
                      <td className="py-2">
                        <input
                          type="checkbox"
                          checked={row.include}
                          onChange={(e) =>
                            setEnrichRows((rows) =>
                              rows!.map((r, j) => (j === i ? { ...r, include: e.target.checked } : r))
                            )
                          }
                        />
                      </td>
                      <td className="py-2 pr-2 font-body text-sm text-chai-brown">{row.name}</td>
                      <td className="py-2 pr-2">
                        <input
                          className={inputClass}
                          value={row.country}
                          onChange={(e) =>
                            setEnrichRows((rows) =>
                              rows!.map((r, j) => (j === i ? { ...r, country: e.target.value } : r))
                            )
                          }
                        />
                      </td>
                      <td className="py-2">
                        <input
                          className={inputClass}
                          value={row.primaryLanguage}
                          onChange={(e) =>
                            setEnrichRows((rows) =>
                              rows!.map((r, j) =>
                                j === i ? { ...r, primaryLanguage: e.target.value } : r
                              )
                            )
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-5 border-t border-chai-brown/10 flex gap-3">
              <button
                onClick={applyEnrich}
                disabled={applying}
                className="flex-1 bg-terracotta text-white py-2 rounded-lg hover:bg-terracotta/90 font-body disabled:opacity-50"
              >
                {applying
                  ? 'Applying…'
                  : `Apply ${enrichRows.filter((r) => r.include).length} update(s)`}
              </button>
              <button
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

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-body text-sm">
          {error}
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-chai-brown/10 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-serif text-2xl text-chai-brown inline-flex items-center gap-2">
                  {viewing.priorityAuthor && <Star size={18} className="text-terracotta fill-terracotta" />}
                  {viewing.name}
                </h2>
                <p className="font-body text-sm text-chai-brown-light mt-1">Read-only author profile</p>
              </div>
              <button
                type="button"
                onClick={() => setViewing(null)}
                className="font-body text-sm text-chai-brown-light hover:text-chai-brown"
              >
                Close
              </button>
            </div>
            <div className="p-5 space-y-4 font-body text-sm text-chai-brown">
              <dl className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-xs text-chai-brown-light">Country</dt>
                  <dd>{viewing.country || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-chai-brown-light">Language</dt>
                  <dd>{viewing.primaryLanguage || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-chai-brown-light">Books</dt>
                  <dd>{viewing.stats?.totalBooks ?? 0}</dd>
                </div>
                <div>
                  <dt className="text-xs text-chai-brown-light">Read</dt>
                  <dd>{viewing.stats?.booksRead ?? 0}</dd>
                </div>
                <div>
                  <dt className="text-xs text-chai-brown-light">Owned</dt>
                  <dd>{viewing.stats?.booksOwned ?? 0}</dd>
                </div>
                <div>
                  <dt className="text-xs text-chai-brown-light">Avg rating</dt>
                  <dd>{viewing.stats?.averageRating ? `${viewing.stats.averageRating}★` : '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-chai-brown-light">Times recommended</dt>
                  <dd>{viewing.stats?.recommendationCount ?? 0}</dd>
                </div>
                <div>
                  <dt className="text-xs text-chai-brown-light">Last recommended</dt>
                  <dd>
                    {viewing.stats?.lastRecommendedAt
                      ? new Date(viewing.stats.lastRecommendedAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : '—'}
                  </dd>
                </div>
              </dl>
              {viewing.shortBio && (
                <div>
                  <p className="text-xs text-chai-brown-light mb-1">Bio</p>
                  <p className="whitespace-pre-wrap">{viewing.shortBio}</p>
                </div>
              )}
              {(viewing.awards?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs text-chai-brown-light mb-1">Awards</p>
                  <p>{viewing.awards.join(', ')}</p>
                </div>
              )}
              <div className="space-y-1">
                {viewing.website && (
                  <p>
                    <span className="text-xs text-chai-brown-light">Website · </span>
                    <a href={viewing.website} target="_blank" rel="noreferrer" className="text-terracotta hover:underline break-all">
                      {viewing.website}
                    </a>
                  </p>
                )}
                {viewing.goodreads && (
                  <p>
                    <span className="text-xs text-chai-brown-light">Goodreads · </span>
                    <a href={viewing.goodreads} target="_blank" rel="noreferrer" className="text-terracotta hover:underline break-all">
                      {viewing.goodreads}
                    </a>
                  </p>
                )}
                {viewing.instagram && (
                  <p>
                    <span className="text-xs text-chai-brown-light">Instagram · </span>
                    {viewing.instagram}
                  </p>
                )}
              </div>
            </div>
            <div className="p-5 border-t border-chai-brown/10 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  const a = viewing;
                  setViewing(null);
                  openEdit(a);
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-terracotta text-white py-2 rounded-lg hover:bg-terracotta/90 font-body"
              >
                <Edit size={16} />
                Edit
              </button>
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

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="font-serif text-2xl text-chai-brown mb-4">{editing ? 'Edit Author' : 'Add Author'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input className={inputClass} placeholder="Name *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <input className={inputClass} placeholder="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
                <input className={inputClass} placeholder="Primary language" value={form.primaryLanguage} onChange={(e) => setForm({ ...form, primaryLanguage: e.target.value })} />
              </div>
              <input className={inputClass} placeholder="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <input className={inputClass} placeholder="Goodreads URL" value={form.goodreads} onChange={(e) => setForm({ ...form, goodreads: e.target.value })} />
                <input className={inputClass} placeholder="Instagram" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
              </div>
              <textarea className={inputClass} rows={3} placeholder="Short bio" value={form.shortBio} onChange={(e) => setForm({ ...form, shortBio: e.target.value })} />
              <input className={inputClass} placeholder="Awards (comma-separated)" value={form.awards} onChange={(e) => setForm({ ...form, awards: e.target.value })} />
              <label className="flex items-center gap-2 font-body text-sm text-chai-brown">
                <input type="checkbox" checked={form.priorityAuthor} onChange={(e) => setForm({ ...form, priorityAuthor: e.target.checked })} />
                Priority author
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-terracotta text-white py-2 rounded-lg hover:bg-terracotta/90 font-body disabled:opacity-50">
                  {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
                </button>
                <button type="button" disabled={saving} onClick={() => setShowForm(false)} className="flex-1 bg-gray-200 text-chai-brown py-2 rounded-lg hover:bg-gray-300 font-body disabled:opacity-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading && authors.length === 0 ? (
        <p className="font-body text-chai-brown-light">Loading authors…</p>
      ) : authors.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-chai-brown/15 bg-cream/40">
          <p className="font-serif text-xl text-chai-brown mb-2">No authors yet</p>
          <p className="font-body text-sm text-chai-brown-light">Add authors or import books to auto-create them.</p>
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
                  <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">Name</th>
                  <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">Country</th>
                  <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">Books</th>
                  <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">Read</th>
                  <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">Avg rating</th>
                  <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">Recs</th>
                  <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">Last rec</th>
                  <th className="px-4 py-3 text-right font-body text-sm font-medium text-chai-brown">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-chai-brown/10">
                {authors.map((a) => (
                  <tr key={a._id} className={`hover:bg-cream/40 ${selected.has(a._id) ? 'bg-terracotta/5' : ''}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Select ${a.name}`}
                        checked={selected.has(a._id)}
                        onChange={() => toggleSelect(a._id)}
                      />
                    </td>
                    <td className="px-4 py-3 font-body text-chai-brown">
                      <button
                        type="button"
                        onClick={() => setViewing(a)}
                        className="inline-flex items-center gap-1.5 text-left hover:text-terracotta"
                      >
                        {a.priorityAuthor && <Star size={14} className="text-terracotta fill-terracotta" />}
                        {a.name}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-chai-brown-light">{a.country || '—'}</td>
                    <td className="px-4 py-3 font-body text-sm text-chai-brown-light">{a.stats?.totalBooks ?? 0}</td>
                    <td className="px-4 py-3 font-body text-sm text-chai-brown-light">{a.stats?.booksRead ?? 0}</td>
                    <td className="px-4 py-3 font-body text-sm text-chai-brown-light">
                      {a.stats?.averageRating ? `${a.stats.averageRating}★` : '—'}
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-chai-brown-light">
                      {a.stats?.recommendationCount ?? 0}
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-chai-brown-light">
                      {a.stats?.lastRecommendedAt
                        ? new Date(a.stats.lastRecommendedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            year: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setViewing(a)}
                          className="p-2 text-chai-brown hover:bg-cream rounded"
                          title="View details"
                        >
                          <Eye size={18} />
                        </button>
                        <button onClick={() => openEdit(a)} className="p-2 text-terracotta hover:bg-terracotta/10 rounded" title="Edit">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => handleDelete(a)} className="p-2 text-red-600 hover:bg-red-50 rounded" title="Delete">
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
            Page {page} of {totalPages} · {PAGE_SIZE} per page
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
