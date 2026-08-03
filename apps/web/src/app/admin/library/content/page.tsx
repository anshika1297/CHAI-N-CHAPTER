'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, Loader2, Copy, Check, Search, BookmarkPlus } from 'lucide-react';
import {
  askHooks,
  createTaxonomy,
  generateHooks,
  getLibraryBook,
  hookToBooks,
  listLibraryBooks,
  listTaxonomyByType,
} from '@/lib/library/api';
import type {
  AskHooksResult,
  BookHookItem,
  HookToBooksResult,
  LibraryBookDto,
  SingleHooksResult,
  TaxonomyItemDto,
} from '@/lib/library/types';

type StudioMode = 'list' | 'single' | 'from-hook';

const EXAMPLES = [
  'Independence Day books',
  'partition stories',
  'heartbreaking books under 300 pages',
  'Indian mythology I have read',
  'short thrillers for rainy day',
];

const MODES: { id: StudioMode; label: string; blurb: string }[] = [
  {
    id: 'list',
    label: 'Recommendation list',
    blurb: 'Ask in plain English → books + a hook for each',
  },
  {
    id: 'single',
    label: 'One book',
    blurb: '5 alternate hooks for a single title',
  },
  {
    id: 'from-hook',
    label: 'From winning hook',
    blurb: 'Pick a winner → matching books (+ hooks)',
  },
];

export default function LibraryHooksPage() {
  const [mode, setMode] = useState<StudioMode>('list');
  const [ask, setAsk] = useState('');
  const [bookQuery, setBookQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LibraryBookDto[]>([]);
  const [searching, setSearching] = useState(false);
  const [bookId, setBookId] = useState('');
  const [bookLabel, setBookLabel] = useState('');
  const [purpose, setPurpose] = useState<'recommendation' | 'review' | 'list'>('recommendation');
  const [useWinningHooks, setUseWinningHooks] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [singleHooks, setSingleHooks] = useState<string[]>([]);
  const [listResult, setListResult] = useState<AskHooksResult | HookToBooksResult | null>(null);
  const [listHooks, setListHooks] = useState<BookHookItem[]>([]);
  const [provider, setProvider] = useState('');
  const [styleUsed, setStyleUsed] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [autoStarted, setAutoStarted] = useState(false);

  const [winners, setWinners] = useState<TaxonomyItemDto[]>([]);
  const [winnersLoading, setWinnersLoading] = useState(false);
  const [selectedHookId, setSelectedHookId] = useState('');
  const [customHookText, setCustomHookText] = useState('');
  const [generateHooksForMatch, setGenerateHooksForMatch] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('bookId') || '';
    const occ = params.get('occasion') || params.get('q') || '';
    const m = params.get('mode');
    if (m === 'single' || m === 'from-hook' || m === 'list') setMode(m);
    if (occ) setAsk(occ);
    if (!id) return;
    setMode('single');
    setBookId(id);
    getLibraryBook(id)
      .then(({ book }) => setBookLabel(`${book.title}${book.author ? ` — ${book.author}` : ''}`))
      .catch(() => setBookLabel('Selected book'));
  }, []);

  useEffect(() => {
    if (mode !== 'from-hook') return;
    setWinnersLoading(true);
    listTaxonomyByType('hook-pattern')
      .then((res) => setWinners(res.items ?? []))
      .catch(() => setWinners([]))
      .finally(() => setWinnersLoading(false));
  }, [mode]);

  useEffect(() => {
    if (mode !== 'single' || !bookQuery.trim()) {
      setSuggestions([]);
      return;
    }
    const t = window.setTimeout(() => {
      setSearching(true);
      listLibraryBooks({ q: bookQuery.trim(), limit: 8 })
        .then((res) => setSuggestions(res.books))
        .catch(() => setSuggestions([]))
        .finally(() => setSearching(false));
    }, 250);
    return () => window.clearTimeout(t);
  }, [bookQuery, mode]);

  const clearResults = () => {
    setError(null);
    setSingleHooks([]);
    setListResult(null);
    setListHooks([]);
    setProvider('');
    setStyleUsed(0);
  };

  const switchMode = (next: StudioMode) => {
    setMode(next);
    clearResults();
  };

  const pickBook = (b: LibraryBookDto) => {
    setBookId(b._id);
    setBookLabel(`${b.title}${b.author ? ` — ${b.author}` : ''}`);
    setBookQuery('');
    setSuggestions([]);
    setSingleHooks([]);
  };

  const clearBook = () => {
    setBookId('');
    setBookLabel('');
    setSingleHooks([]);
  };

  const runAsk = useCallback(() => {
    const q = ask.trim();
    if (!q) {
      setError('Try something like “Independence Day books” or “partition stories”.');
      return;
    }
    setGenerating(true);
    clearResults();
    askHooks({ q, limit: 10, useWinningHooks, aiFit: true })
      .then((res) => {
        setListResult(res);
        setListHooks(res.hooks ?? []);
        setProvider(res.provider);
        setStyleUsed(res.stylePatternsUsed ?? 0);
        if (res.message && (!res.hooks || res.hooks.length === 0)) {
          setError(res.message);
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Ask failed'))
      .finally(() => setGenerating(false));
  }, [ask, useWinningHooks]);

  const runSingle = useCallback(() => {
    if (!bookId) {
      setError('Pick a book first.');
      return;
    }
    setGenerating(true);
    clearResults();
    generateHooks({
      bookId,
      occasion: ask.trim() || undefined,
      purpose,
      useWinningHooks,
    })
      .then((res) => {
        const single = res as SingleHooksResult;
        setSingleHooks(single.hooks ?? []);
        setProvider(single.provider);
        setStyleUsed(single.stylePatternsUsed ?? 0);
        if (single.book) {
          setBookLabel(
            `${single.book.title}${single.book.author ? ` — ${single.book.author}` : ''}`
          );
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Hook generation failed'))
      .finally(() => setGenerating(false));
  }, [bookId, ask, purpose, useWinningHooks]);

  const runFromHook = useCallback(() => {
    const hookText = customHookText.trim();
    if (!selectedHookId && !hookText) {
      setError('Pick a winning hook, or paste hook text.');
      return;
    }
    setGenerating(true);
    clearResults();
    hookToBooks({
      hookId: selectedHookId || undefined,
      hookText: selectedHookId ? undefined : hookText,
      limit: 10,
      generateHooks: generateHooksForMatch,
      useWinningHooks,
    })
      .then((res) => {
        setListResult(res);
        setListHooks(res.hooks ?? []);
        setProvider(res.provider);
        setStyleUsed(res.stylePatternsUsed ?? 0);
        if (res.message && (!res.hooks || res.hooks.length === 0) && res.books.length === 0) {
          setError(res.message);
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not match books'))
      .finally(() => setGenerating(false));
  }, [selectedHookId, customHookText, generateHooksForMatch, useWinningHooks]);

  useEffect(() => {
    if (mode !== 'single' || !bookId || autoStarted || singleHooks.length || generating) return;
    const fromUrl = new URLSearchParams(window.location.search).get('bookId');
    if (!fromUrl || fromUrl !== bookId) return;
    setAutoStarted(true);
    runSingle();
  }, [mode, bookId, autoStarted, singleHooks.length, generating, runSingle]);

  useEffect(() => {
    if (mode !== 'list' || autoStarted || generating || listHooks.length || bookId) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('bookId')) return;
    const q = (params.get('q') || params.get('occasion') || '').trim();
    if (!q || ask.trim() !== q) return;
    setAutoStarted(true);
    runAsk();
  }, [mode, ask, autoStarted, generating, listHooks.length, bookId, runAsk]);

  const copyText = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setError('Could not copy');
    }
  };

  const saveWinning = async (key: string, hook: string) => {
    try {
      await createTaxonomy({ type: 'hook-pattern', name: hook });
      setSavedKey(key);
      window.setTimeout(() => setSavedKey(null), 1800);
      if (mode === 'from-hook') {
        listTaxonomyByType('hook-pattern')
          .then((res) => setWinners(res.items ?? []))
          .catch(() => undefined);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save winning hook');
    }
  };

  const copyListWithHooks = () => {
    if (listHooks.length > 0) {
      const lines = listHooks.map((row, i) => {
        const header = `${i + 1}. ${row.title}${row.author ? ` — ${row.author}` : ''}`;
        return row.hook ? `${header}\n   ${row.hook}` : header;
      });
      copyText('list', lines.join('\n\n'));
      return;
    }
    const booksOnly =
      listResult && 'books' in listResult
        ? listResult.books.map(
            (b, i) => `${i + 1}. ${b.title}${b.author ? ` — ${b.author}` : ''}`
          )
        : [];
    if (booksOnly.length) copyText('list', booksOnly.join('\n'));
  };

  const sourceHookText =
    listResult && 'sourceHook' in listResult ? listResult.sourceHook?.text : '';

  const booksOnlyFallback =
    listResult &&
    'books' in listResult &&
    listHooks.length === 0 &&
    listResult.books.length > 0
      ? listResult.books
      : [];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="text-terracotta" size={26} />
          <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown">Hook Studio</h1>
        </div>
        <p className="font-body text-chai-brown-light">
          Build lists with hooks from your shelf. Ask mode uses AI to include books that fit even
        when themes/tags are incomplete — then writes a hook for each.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-6">
        {MODES.map((m) => {
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => switchMode(m.id)}
              className={`text-left rounded-lg border px-3 py-3 transition-colors ${
                active
                  ? 'border-terracotta bg-terracotta/10'
                  : 'border-chai-brown/10 bg-white hover:border-terracotta/30'
              }`}
            >
              <p className="font-body text-sm font-medium text-chai-brown">{m.label}</p>
              <p className="font-body text-xs text-chai-brown-light mt-1">{m.blurb}</p>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-body text-sm">
          {error}
        </div>
      )}

      {mode === 'list' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runAsk();
          }}
          className="bg-white rounded-lg border border-chai-brown/10 p-4 mb-6 space-y-3"
        >
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-chai-brown/40 pointer-events-none"
            />
            <input
              autoFocus
              value={ask}
              onChange={(e) => setAsk(e.target.value)}
              placeholder="e.g. Independence Day books, partition stories, heartbreaking under 300 pages"
              className="w-full pl-10 pr-3 py-3 border border-chai-brown/20 rounded-lg font-body text-chai-brown focus:outline-none focus:border-terracotta"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => {
                  setAsk(ex);
                  setGenerating(true);
                  clearResults();
                  askHooks({ q: ex, limit: 10, useWinningHooks, aiFit: true })
                    .then((res) => {
                      setListResult(res);
                      setListHooks(res.hooks ?? []);
                      setProvider(res.provider);
                      setStyleUsed(res.stylePatternsUsed ?? 0);
                      if (res.message && (!res.hooks || res.hooks.length === 0)) {
                        setError(res.message);
                      }
                    })
                    .catch((e) => setError(e instanceof Error ? e.message : 'Ask failed'))
                    .finally(() => setGenerating(false));
                }}
                className="rounded-full border border-chai-brown/15 bg-cream/60 px-3 py-1.5 font-body text-xs text-chai-brown hover:border-terracotta/40 transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <label className="inline-flex items-center gap-2 font-body text-sm text-chai-brown">
              <input
                type="checkbox"
                checked={useWinningHooks}
                onChange={(e) => setUseWinningHooks(e.target.checked)}
              />
              Style from winning hooks
            </label>
            <button
              type="submit"
              disabled={generating || !ask.trim()}
              className="inline-flex items-center gap-2 bg-terracotta text-white px-5 py-2.5 rounded-lg hover:bg-terracotta/90 font-body text-sm disabled:opacity-50"
            >
              {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {generating ? 'Finding books + writing hooks…' : 'Get list + hooks'}
            </button>
          </div>
        </form>
      )}

      {mode === 'single' && (
        <div className="bg-white rounded-lg border border-chai-brown/10 p-4 mb-6 space-y-3">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-chai-brown/40 pointer-events-none"
            />
            <input
              type="search"
              autoFocus
              value={bookQuery}
              onChange={(e) => setBookQuery(e.target.value)}
              placeholder="Search a book title…"
              className="w-full pl-10 pr-4 py-2.5 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body text-sm"
            />
            {searching && (
              <Loader2
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-chai-brown-light"
              />
            )}
            {suggestions.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full bg-white border border-chai-brown/15 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {suggestions.map((b) => (
                  <li key={b._id}>
                    <button
                      type="button"
                      onClick={() => pickBook(b)}
                      className="w-full text-left px-4 py-2.5 hover:bg-cream/60 font-body text-sm text-chai-brown"
                    >
                      <span className="font-medium">{b.title}</span>
                      <span className="text-chai-brown-light"> — {b.author || 'Unknown'}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {bookId && (
            <p className="font-body text-sm text-chai-brown">
              Selected: <span className="font-medium">{bookLabel || bookId}</span>{' '}
              <button
                type="button"
                onClick={clearBook}
                className="text-xs text-chai-brown-light hover:underline ml-1"
              >
                clear
              </button>
            </p>
          )}

          <input
            value={ask}
            onChange={(e) => setAsk(e.target.value)}
            placeholder="Optional occasion / angle (e.g. rainy Sunday, Independence Day)"
            className="w-full px-3 py-2 border border-chai-brown/20 rounded-lg font-body text-sm text-chai-brown focus:outline-none focus:border-terracotta"
          />

          <div className="flex flex-wrap gap-3 items-center">
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value as typeof purpose)}
              className="px-3 py-2 border border-chai-brown/20 rounded-lg text-sm font-body text-chai-brown"
            >
              <option value="recommendation">Recommendation hooks</option>
              <option value="review">Review hooks</option>
              <option value="list">List / carousel style</option>
            </select>
            <label className="inline-flex items-center gap-2 font-body text-sm text-chai-brown">
              <input
                type="checkbox"
                checked={useWinningHooks}
                onChange={(e) => setUseWinningHooks(e.target.checked)}
              />
              Style from winning hooks
            </label>
            <button
              type="button"
              onClick={runSingle}
              disabled={generating || !bookId}
              className="inline-flex items-center gap-2 bg-terracotta text-white px-4 py-2 rounded-lg hover:bg-terracotta/90 font-body text-sm disabled:opacity-50"
            >
              {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Generate 5 hooks
            </button>
          </div>
        </div>
      )}

      {mode === 'from-hook' && (
        <div className="bg-white rounded-lg border border-chai-brown/10 p-4 mb-6 space-y-3">
          <p className="font-body text-sm text-chai-brown-light">
            Start from a saved winner (or paste a hook). We’ll find library books that match that vibe
            and optionally write a fresh hook for each.
          </p>

          {winnersLoading ? (
            <p className="font-body text-sm text-chai-brown-light inline-flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Loading winning hooks…
            </p>
          ) : winners.length === 0 ? (
            <p className="font-body text-sm text-chai-brown-light">
              No winning hooks saved yet. Generate some in another mode and hit “Save as winner”, or
              paste a hook below.
            </p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto border border-chai-brown/10 rounded-lg p-2">
              {winners.map((w) => {
                const active = selectedHookId === w._id;
                return (
                  <button
                    key={w._id}
                    type="button"
                    onClick={() => {
                      setSelectedHookId(active ? '' : w._id);
                      if (!active) setCustomHookText('');
                    }}
                    className={`w-full text-left rounded-md px-3 py-2 font-serif text-sm leading-snug transition-colors ${
                      active
                        ? 'bg-terracotta/15 text-chai-brown border border-terracotta/40'
                        : 'hover:bg-cream/70 text-chai-brown border border-transparent'
                    }`}
                  >
                    {w.name}
                  </button>
                );
              })}
            </div>
          )}

          <div>
            <label className="block font-body text-xs text-chai-brown-light mb-1">
              Or paste a hook
            </label>
            <textarea
              value={customHookText}
              onChange={(e) => {
                setCustomHookText(e.target.value);
                if (e.target.value.trim()) setSelectedHookId('');
              }}
              rows={3}
              placeholder="Paste a hook you want books for…"
              className="w-full px-3 py-2 border border-chai-brown/20 rounded-lg font-body text-sm text-chai-brown focus:outline-none focus:border-terracotta"
            />
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <label className="inline-flex items-center gap-2 font-body text-sm text-chai-brown">
              <input
                type="checkbox"
                checked={generateHooksForMatch}
                onChange={(e) => setGenerateHooksForMatch(e.target.checked)}
              />
              Also write a hook for each book
            </label>
            <label className="inline-flex items-center gap-2 font-body text-sm text-chai-brown">
              <input
                type="checkbox"
                checked={useWinningHooks}
                onChange={(e) => setUseWinningHooks(e.target.checked)}
              />
              Blend other winning styles
            </label>
            <button
              type="button"
              onClick={runFromHook}
              disabled={generating || (!selectedHookId && !customHookText.trim())}
              className="inline-flex items-center gap-2 bg-terracotta text-white px-4 py-2 rounded-lg hover:bg-terracotta/90 font-body text-sm disabled:opacity-50"
            >
              {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {generating ? 'Matching books…' : 'Find books from this hook'}
            </button>
          </div>
        </div>
      )}

      {listResult && (listHooks.length > 0 || booksOnlyFallback.length > 0) && (
        <div className="space-y-4 mb-8">
          {sourceHookText && (
            <div className="rounded-lg border border-terracotta/20 bg-terracotta/5 px-4 py-3">
              <p className="font-body text-xs uppercase tracking-wide text-chai-brown-light mb-1">
                Source hook
              </p>
              <p className="font-serif text-base text-chai-brown leading-snug">{sourceHookText}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-body text-sm text-chai-brown-light">
              {listResult.returned ??
                (listHooks.length || booksOnlyFallback.length)}{' '}
              of {listResult.total} matches
              {listResult.summary ? ` · ${listResult.summary}` : ''}
              {provider ? ` · hooks via ${provider}` : ''}
              {styleUsed > 0 ? ` · styled from ${styleUsed} winning hook(s)` : ''}
            </p>
            <button
              type="button"
              onClick={copyListWithHooks}
              className="inline-flex items-center gap-1.5 text-sm font-body text-terracotta hover:underline"
            >
              {copied === 'list' ? (
                <>
                  <Check size={14} /> Copied
                </>
              ) : (
                <>
                  <Copy size={14} /> Copy list{listHooks.length ? ' + hooks' : ''}
                </>
              )}
            </button>
          </div>

          {listHooks.length > 0
            ? listHooks.map((row, i) => (
                <div
                  key={row.id}
                  className="bg-white rounded-lg border border-chai-brown/10 p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-body text-xs text-chai-brown-light">
                        {i + 1}. {row.title}
                        {row.author ? ` — ${row.author}` : ''}
                      </p>
                      <p className="font-serif text-lg text-chai-brown leading-snug mt-1">
                        {row.hook}
                      </p>
                    </div>
                    <div className="shrink-0 flex flex-col gap-1.5 items-end">
                      <button
                        type="button"
                        onClick={() => copyText(row.id, `${row.title}\n${row.hook}`)}
                        className="inline-flex items-center gap-1 text-sm font-body text-terracotta hover:underline"
                      >
                        {copied === row.id ? (
                          <>
                            <Check size={14} /> Copied
                          </>
                        ) : (
                          <>
                            <Copy size={14} /> Copy
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => saveWinning(row.id, row.hook)}
                        className="inline-flex items-center gap-1 text-sm font-body text-chai-brown-light hover:text-terracotta"
                      >
                        {savedKey === row.id ? (
                          <>
                            <Check size={14} /> Saved
                          </>
                        ) : (
                          <>
                            <BookmarkPlus size={14} /> Save as winner
                          </>
                        )}
                      </button>
                      <Link
                        href={`/admin/library/content?mode=single&bookId=${row.id}&occasion=${encodeURIComponent(
                          ask.trim() || sourceHookText || ''
                        )}`}
                        className="text-xs font-body text-chai-brown-light hover:text-terracotta"
                      >
                        More hooks →
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            : booksOnlyFallback.map((b, i) => (
                <div
                  key={b._id}
                  className="bg-white rounded-lg border border-chai-brown/10 p-4 flex items-start justify-between gap-3"
                >
                  <div>
                    <p className="font-body text-sm text-chai-brown">
                      {i + 1}. <span className="font-medium">{b.title}</span>
                      {b.author ? ` — ${b.author}` : ''}
                    </p>
                    {(b.genres?.length || b.themes?.length) && (
                      <p className="font-body text-xs text-chai-brown-light mt-1">
                        {[...(b.genres ?? []).slice(0, 2), ...(b.themes ?? []).slice(0, 2)].join(
                          ' · '
                        )}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/admin/library/content?mode=single&bookId=${b._id}&occasion=${encodeURIComponent(
                      sourceHookText || ''
                    )}`}
                    className="text-xs font-body text-terracotta hover:underline shrink-0"
                  >
                    Hooks →
                  </Link>
                </div>
              ))}
        </div>
      )}

      {singleHooks.length > 0 && (
        <div className="space-y-3">
          <p className="font-body text-xs text-chai-brown-light">
            {bookLabel} · via {provider}
            {styleUsed > 0 ? ` · styled from ${styleUsed} winning hook(s)` : ''}
          </p>
          {singleHooks.map((hook, i) => (
            <div
              key={`${i}-${hook}`}
              className="bg-white rounded-lg border border-chai-brown/10 p-4 flex items-start justify-between gap-3"
            >
              <p className="font-serif text-lg text-chai-brown leading-snug">{hook}</p>
              <div className="shrink-0 flex flex-col gap-1.5 items-end">
                <button
                  type="button"
                  onClick={() => copyText(`s-${i}`, hook)}
                  className="inline-flex items-center gap-1 text-sm font-body text-terracotta hover:underline"
                >
                  {copied === `s-${i}` ? (
                    <>
                      <Check size={14} /> Copied
                    </>
                  ) : (
                    <>
                      <Copy size={14} /> Copy
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => saveWinning(`s-${i}`, hook)}
                  className="inline-flex items-center gap-1 text-sm font-body text-chai-brown-light hover:text-terracotta"
                >
                  {savedKey === `s-${i}` ? (
                    <>
                      <Check size={14} /> Saved
                    </>
                  ) : (
                    <>
                      <BookmarkPlus size={14} /> Save as winner
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
