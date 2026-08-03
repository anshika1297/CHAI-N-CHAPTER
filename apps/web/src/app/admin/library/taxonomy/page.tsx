'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, RefreshCw, Loader2 } from 'lucide-react';
import { createTaxonomy, deleteTaxonomy, listTaxonomy, syncTaxonomyFromBooks } from '@/lib/library/api';
import { TAXONOMY_LABELS, TAXONOMY_TYPES, type TaxonomyItemDto, type TaxonomyType } from '@/lib/library/types';

type Grouped = Record<TaxonomyType, TaxonomyItemDto[]>;

function emptyGrouped(): Grouped {
  return TAXONOMY_TYPES.reduce((acc, t) => {
    acc[t] = [];
    return acc;
  }, {} as Grouped);
}

export default function LibraryTaxonomyPage() {
  const [grouped, setGrouped] = useState<Grouped>(emptyGrouped());
  const [activeType, setActiveType] = useState<TaxonomyType>('genre');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    listTaxonomy()
      .then(({ grouped: g }) => {
        setGrouped({ ...emptyGrouped(), ...g });
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load master data'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    setError(null);
    createTaxonomy({ type: activeType, name })
      .then(() => {
        setNewName('');
        load();
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to add item'))
      .finally(() => setSaving(false));
  };

  const handleDelete = (item: TaxonomyItemDto) => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    deleteTaxonomy(item._id)
      .then(() => load())
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to delete item'));
  };

  const handleSyncFromBooks = () => {
    setSyncing(true);
    setError(null);
    setNote(null);
    syncTaxonomyFromBooks()
      .then((res) => {
        setNote(
          `Synced from ${res.scanned} books — ${res.created} new Master Data entries` +
            (res.skipped ? ` (${res.skipped} already present)` : '') +
            '.'
        );
        load();
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Sync failed'))
      .finally(() => setSyncing(false));
  };

  const items = grouped[activeType] ?? [];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown mb-2">Master Data</h1>
          <p className="font-body text-chai-brown-light max-w-2xl">
            Manage genres, themes, tropes, moods and more. Saving or importing books with these
            fields adds them here automatically. <strong>Winning hooks</strong> are only added from
            Hook Studio (not from books).
          </p>
        </div>
        <button
          type="button"
          onClick={handleSyncFromBooks}
          disabled={syncing}
          className="inline-flex items-center gap-2 border border-terracotta/40 text-terracotta px-4 py-2 rounded-lg hover:bg-terracotta/10 font-body text-sm disabled:opacity-50 shrink-0"
          title="Scan all books and add missing genres, themes, tags, etc."
        >
          {syncing ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
          Sync from books
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-body text-sm">
          {error}
        </div>
      )}
      {note && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 font-body text-sm">
          {note}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {TAXONOMY_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setActiveType(t)}
            className={`px-3 py-1.5 rounded-full font-body text-sm border transition-colors ${
              activeType === t
                ? 'bg-terracotta text-white border-terracotta'
                : 'bg-white text-chai-brown border-chai-brown/20 hover:border-terracotta/40'
            }`}
          >
            {TAXONOMY_LABELS[t]} ({grouped[t]?.length ?? 0})
          </button>
        ))}
      </div>

      <form onSubmit={handleAdd} className="mb-6 flex flex-col sm:flex-row gap-2 max-w-2xl">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={
            activeType === 'hook-pattern'
              ? 'Paste a hook that performed well on Instagram…'
              : `Add ${TAXONOMY_LABELS[activeType].replace(/s$/, '').toLowerCase()}…`
          }
          className="flex-1 px-3 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body text-sm"
        />
        <button
          type="submit"
          disabled={saving || !newName.trim()}
          className="inline-flex items-center justify-center gap-2 bg-terracotta text-white px-4 py-2 rounded-lg hover:bg-terracotta/90 font-body text-sm disabled:opacity-50"
        >
          <Plus size={18} />
          Add
        </button>
      </form>

      {activeType === 'hook-pattern' && (
        <p className="mb-4 font-body text-xs text-chai-brown-light max-w-2xl">
          Tip: paste one winning line per entry. When you generate hooks, AI matches their energy and
          structure for new books — it won&apos;t copy them verbatim.
        </p>
      )}

      {loading ? (
        <p className="font-body text-chai-brown-light">Loading…</p>
      ) : items.length === 0 ? (
        <p className="font-body text-sm text-chai-brown-light">
          No {TAXONOMY_LABELS[activeType].toLowerCase()} yet.
          {activeType === 'hook-pattern' &&
            ' Add 5–12 of your best Instagram openers to unlock style-matched generation.'}
        </p>
      ) : (
        <ul className={activeType === 'hook-pattern' ? 'space-y-2 max-w-2xl' : 'flex flex-wrap gap-2'}>
          {items.map((item) => (
            <li
              key={item._id}
              className={
                activeType === 'hook-pattern'
                  ? 'flex items-start gap-2 rounded-lg border border-chai-brown/15 bg-white px-4 py-3'
                  : 'inline-flex items-center gap-2 rounded-full border border-chai-brown/15 bg-white pl-4 pr-2 py-1.5'
              }
            >
              <span className="font-body text-sm text-chai-brown flex-1">{item.name}</span>
              <button
                onClick={() => handleDelete(item)}
                className="p-1 text-red-500 hover:bg-red-50 rounded-full shrink-0"
                aria-label={`Delete ${item.name}`}
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
