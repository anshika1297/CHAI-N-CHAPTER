'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ListChecks, Loader2, Copy, Check, Eye, Sparkles, Download, Search } from 'lucide-react';
import {
  askRecommendations,
  buildRecommendations,
  downloadRecommendShortlistCsv,
  generateHooks,
  markBooksRecommended,
} from '@/lib/library/api';
import {
  READING_STATUSES,
  RECOMMEND_CHANNELS,
  STATUS_LABELS,
  type LibraryBookFacets,
  type ListHooksResult,
  type RecommendBuilderBook,
} from '@/lib/library/types';

const PRESETS = [
  {
    label: 'Independence Day · Indian hist-fic',
    filters: { genre: 'Historical Fiction', authorCountry: 'India', tag: 'Independence Day' },
  },
  {
    label: 'Signature · Around the World',
    filters: { collection: 'Around the World in 52 Books', neverRecommended: true, status: 'read' },
  },
  {
    label: 'Signature · States Through Stories',
    filters: { collection: 'States Through Stories', neverRecommended: true, status: 'read' },
  },
  {
    label: 'Signature · Epic Project',
    filters: { collection: 'The Epic Project', neverRecommended: true, status: 'read' },
  },
  {
    label: 'Roots of Bharat',
    filters: { collection: 'Roots of Bharat', neverRecommended: true, status: 'read' },
  },
  {
    label: 'Under 300 pages · unread owned',
    filters: { maxPages: '300', owned: true, status: 'want-to-read', neverRecommended: true },
  },
  {
    label: 'Heartbreaking · never recommended',
    filters: { mood: 'heartbreaking', neverRecommended: true, status: 'read' },
  },
  {
    label: 'Read · not rec’d in 90 days',
    filters: { status: 'read', notRecommendedDays: '90' },
  },
];

const selectClass =
  'px-3 py-2 border border-chai-brown/20 rounded-lg text-sm font-body text-chai-brown bg-white';
const inputClass =
  'px-3 py-2 border border-chai-brown/20 rounded-lg text-sm font-body text-chai-brown bg-white';

function formatLastRec(book: RecommendBuilderBook): string {
  if (!book.lastRecommendedAt) return 'Never recommended';
  if (book.daysSinceRecommended == null) return 'Recommended before';
  if (book.daysSinceRecommended === 0) return 'Recommended today';
  if (book.daysSinceRecommended === 1) return 'Recommended yesterday';
  return `${book.daysSinceRecommended}d since last rec · ×${book.timesRecommended}`;
}

export default function LibraryRecommendPage() {
  const [facets, setFacets] = useState<LibraryBookFacets | undefined>();
  const [books, setBooks] = useState<RecommendBuilderBook[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const [ask, setAsk] = useState('');
  const [asking, setAsking] = useState(false);
  const [aiFit, setAiFit] = useState(true);
  const [askWithHooks, setAskWithHooks] = useState(true);
  const [genre, setGenre] = useState('');
  const [theme, setTheme] = useState('');
  const [mood, setMood] = useState('');
  const [tag, setTag] = useState('');
  const [season, setSeason] = useState('');
  const [collection, setCollection] = useState('');
  const [authorCountry, setAuthorCountry] = useState('');
  const [language, setLanguage] = useState('');
  const [keywords, setKeywords] = useState('');
  const [status, setStatus] = useState('read');
  const [maxPages, setMaxPages] = useState('');
  const [minRating, setMinRating] = useState('');
  const [owned, setOwned] = useState(false);
  const [neverRecommended, setNeverRecommended] = useState(true);
  const [notRecommendedDays, setNotRecommendedDays] = useState('90');

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [channel, setChannel] = useState('instagram');
  const [markNote, setMarkNote] = useState('');
  const [contentUrl, setContentUrl] = useState('');
  const [marking, setMarking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewing, setViewing] = useState<RecommendBuilderBook | null>(null);
  const [hookOccasion, setHookOccasion] = useState('');
  const [useWinningHooks, setUseWinningHooks] = useState(true);
  const [hooking, setHooking] = useState(false);
  const [hooksById, setHooksById] = useState<Record<string, string>>({});
  const [hooksProvider, setHooksProvider] = useState('');

  const facetsLoaded = useRef(false);

  const runBuild = useCallback(
    (
      overrides?: Record<string, string | number | boolean | undefined>,
      extraNote?: string
    ) => {
      setLoading(true);
      setError(null);
      const params: Record<string, string | number | boolean | undefined> = {
        genre: genre || undefined,
        theme: theme || undefined,
        mood: mood || undefined,
        tag: tag || undefined,
        season: season || undefined,
        collection: collection || undefined,
        authorCountry: authorCountry || undefined,
        language: language || undefined,
        q: keywords || undefined,
        status: status || undefined,
        maxPages: maxPages || undefined,
        minRating: minRating || undefined,
        owned: owned || undefined,
        neverRecommended: neverRecommended || undefined,
        notRecommendedDays:
          !neverRecommended && notRecommendedDays ? notRecommendedDays : undefined,
        limit: 48,
        facets: facetsLoaded.current ? undefined : true,
        ...overrides,
      };

      return buildRecommendations(params)
        .then((res) => {
          setBooks(res.books);
          setTotal(res.total);
          setSelected(new Set());
          setHooksById({});
          setHooksProvider('');
          if (res.facets) {
            facetsLoaded.current = true;
            setFacets(res.facets);
          }
          const relax = (res.relaxed ?? []).filter(Boolean);
          const base =
            res.returned < res.total
              ? `Showing top ${res.returned} of ${res.total} matches (sorted: best vibe fit → never recommended → longest gap → rating).`
              : `${res.returned} match${res.returned === 1 ? '' : 'es'}.`;
          setNote(
            [extraNote, base, ...relax].filter(Boolean).join(' ')
          );
          return res;
        })
        .catch((e) => {
          setError(e instanceof Error ? e.message : 'Build failed');
          throw e;
        })
        .finally(() => setLoading(false));
    },
    [
      genre,
      theme,
      mood,
      tag,
      season,
      collection,
      authorCountry,
      language,
      keywords,
      status,
      maxPages,
      minRating,
      owned,
      neverRecommended,
      notRecommendedDays,
    ]
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hasQuery =
      params.has('genre') ||
      params.has('theme') ||
      params.has('mood') ||
      params.has('tag') ||
      params.has('season') ||
      params.has('collection') ||
      params.has('authorCountry') ||
      params.has('status') ||
      params.has('owned') ||
      params.has('neverRecommended') ||
      params.has('notRecommendedDays') ||
      params.has('maxPages') ||
      params.has('minRating');

    if (!hasQuery) {
      runBuild();
      return;
    }

    const next = {
      genre: params.get('genre') || '',
      theme: params.get('theme') || '',
      mood: params.get('mood') || '',
      tag: params.get('tag') || '',
      season: params.get('season') || '',
      collection: params.get('collection') || '',
      authorCountry: params.get('authorCountry') || '',
      language: params.get('language') || '',
      status: params.get('status') || '',
      maxPages: params.get('maxPages') || '',
      minRating: params.get('minRating') || '',
      owned: params.get('owned') === '1' || params.get('owned') === 'true',
      neverRecommended:
        params.get('neverRecommended') === '1' || params.get('neverRecommended') === 'true',
      notRecommendedDays: params.get('notRecommendedDays') || '90',
    };

    setGenre(next.genre);
    setTheme(next.theme);
    setMood(next.mood);
    setTag(next.tag);
    setSeason(next.season);
    setCollection(next.collection);
    setAuthorCountry(next.authorCountry);
    setLanguage(next.language);
    setStatus(next.status);
    setMaxPages(next.maxPages);
    setMinRating(next.minRating);
    setOwned(next.owned);
    setNeverRecommended(next.neverRecommended);
    setNotRecommendedDays(next.notRecommendedDays);

    runBuild({
      genre: next.genre || undefined,
      theme: next.theme || undefined,
      mood: next.mood || undefined,
      tag: next.tag || undefined,
      season: next.season || undefined,
      collection: next.collection || undefined,
      authorCountry: next.authorCountry || undefined,
      language: next.language || undefined,
      status: next.status || undefined,
      maxPages: next.maxPages || undefined,
      minRating: next.minRating || undefined,
      owned: next.owned || undefined,
      neverRecommended: next.neverRecommended || undefined,
      notRecommendedDays:
        !next.neverRecommended && next.notRecommendedDays
          ? next.notRecommendedDays
          : undefined,
    });
    // Initial load only — subsequent builds are explicit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyPreset = (filters: Record<string, string | boolean | undefined>) => {
    setGenre(typeof filters.genre === 'string' ? filters.genre : '');
    setTheme(typeof filters.theme === 'string' ? filters.theme : '');
    setMood(typeof filters.mood === 'string' ? filters.mood : '');
    setTag(typeof filters.tag === 'string' ? filters.tag : '');
    setSeason(typeof filters.season === 'string' ? filters.season : '');
    setCollection(typeof filters.collection === 'string' ? filters.collection : '');
    setAuthorCountry(typeof filters.authorCountry === 'string' ? filters.authorCountry : '');
    setLanguage(typeof filters.language === 'string' ? filters.language : '');
    setKeywords(typeof filters.q === 'string' ? filters.q : '');
    setStatus(typeof filters.status === 'string' ? filters.status : '');
    setMaxPages(filters.maxPages != null ? String(filters.maxPages) : '');
    setMinRating(filters.minRating != null ? String(filters.minRating) : '');
    setOwned(Boolean(filters.owned));
    setNeverRecommended(Boolean(filters.neverRecommended));
    setNotRecommendedDays(
      filters.notRecommendedDays != null ? String(filters.notRecommendedDays) : '90'
    );
    if (typeof filters.season === 'string' && filters.season) {
      setHookOccasion(filters.season);
    }
    // Run immediately with the preset values (state updates are async).
    runBuild({
      genre: typeof filters.genre === 'string' ? filters.genre : undefined,
      theme: typeof filters.theme === 'string' ? filters.theme : undefined,
      mood: typeof filters.mood === 'string' ? filters.mood : undefined,
      tag: typeof filters.tag === 'string' ? filters.tag : undefined,
      season: typeof filters.season === 'string' ? filters.season : undefined,
      collection: typeof filters.collection === 'string' ? filters.collection : undefined,
      authorCountry: typeof filters.authorCountry === 'string' ? filters.authorCountry : undefined,
      language: typeof filters.language === 'string' ? filters.language : undefined,
      q: typeof filters.q === 'string' ? filters.q : undefined,
      status: typeof filters.status === 'string' ? filters.status : undefined,
      maxPages: filters.maxPages != null ? String(filters.maxPages) : undefined,
      minRating: filters.minRating != null ? String(filters.minRating) : undefined,
      owned: Boolean(filters.owned) || undefined,
      neverRecommended: Boolean(filters.neverRecommended) || undefined,
      notRecommendedDays:
        !filters.neverRecommended && filters.notRecommendedDays != null
          ? String(filters.notRecommendedDays)
          : undefined,
    });
  };

  const runAsk = () => {
    const q = ask.trim();
    if (!q) {
      setError('Try something like “Independence Day Indian historical fiction”.');
      return;
    }
    setAsking(true);
    setError(null);
    setHookOccasion(q);
    askRecommendations({
      q,
      limit: 12,
      status: status || 'read',
      owned: owned || undefined,
      neverRecommended: neverRecommended || undefined,
      notRecommendedDays:
        !neverRecommended && notRecommendedDays ? notRecommendedDays : undefined,
      maxPages: maxPages || undefined,
      minRating: minRating || undefined,
      collection: collection || undefined,
      aiFit,
      generateHooks: askWithHooks,
      useWinningHooks,
    })
      .then((res) => {
        setBooks(res.books);
        setTotal(res.total);
        setSelected(new Set());
        if (res.facets) {
          facetsLoaded.current = true;
          setFacets(res.facets);
        }
        const p = res.filters ?? {};
        if (typeof p.genre === 'string') setGenre(p.genre);
        if (typeof p.theme === 'string') setTheme(p.theme);
        if (typeof p.mood === 'string') setMood(p.mood);
        if (typeof p.tag === 'string') setTag(p.tag);
        if (typeof p.season === 'string') setSeason(p.season);
        if (typeof p.authorCountry === 'string') setAuthorCountry(p.authorCountry);
        if (typeof p.language === 'string') setLanguage(p.language);
        if (typeof p.q === 'string') setKeywords(p.q);

        const hookMap: Record<string, string> = {};
        for (const row of res.hooks ?? []) hookMap[row.id] = row.hook;
        setHooksById(hookMap);
        setHooksProvider(res.hooksProvider || '');

        const fitNote =
          res.fitEngine === 'ai-fit'
            ? `AI picked ${res.returned} book(s) that fit — incomplete tags are OK${res.fitProvider ? ` (via ${res.fitProvider})` : ''}.`
            : `Filter shortlist (${res.returned}) — AI fit unavailable or found none, used soft filters.`;
        const hookNote = askWithHooks
          ? res.hooksProvider
            ? ` Hooks via ${res.hooksProvider}.`
            : ' Hooks skipped or failed.'
          : '';
        const relax = (res.relaxed ?? []).join(' ');
        setNote([fitNote + hookNote, relax].filter(Boolean).join(' '));
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Ask failed'))
      .finally(() => setAsking(false));
  };

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = (checked: boolean) => {
    if (checked) setSelected(new Set(books.map((b) => b._id)));
    else setSelected(new Set());
  };

  const copyList = async () => {
    const rows = books.filter((b) => selected.size === 0 || selected.has(b._id));
    const lines = rows.map((b, i) => {
      const hook = hooksById[b._id];
      const header = `${i + 1}. ${b.title}${b.author ? ` — ${b.author}` : ''}`;
      if (hook) return `${header}\n   ${hook}`;
      const bits = [
        header,
        b.oneLineRecommendation || '',
        b.pages ? `${b.pages} pages` : '',
        b.genres.slice(0, 2).join(', '),
      ].filter(Boolean);
      return bits.join('\n   ');
    });
    try {
      await navigator.clipboard.writeText(lines.join('\n\n'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy to clipboard');
    }
  };

  const runHooks = () => {
    const ids = selected.size ? [...selected] : books.map((b) => b._id);
    if (ids.length === 0) {
      setError('Build a list first, then generate hooks.');
      return;
    }
    setHooking(true);
    setError(null);
    generateHooks({
      ids,
      occasion: hookOccasion.trim() || undefined,
      useWinningHooks,
    })
      .then((res) => {
        const list = res as ListHooksResult;
        const map: Record<string, string> = {};
        for (const row of list.hooks ?? []) map[row.id] = row.hook;
        setHooksById(map);
        setHooksProvider(list.provider);
        const leftover = list.remaining
          ? ` · ${list.remaining} more selected — run again (max ${list.maxPerRequest}).`
          : '';
        const styleNote =
          typeof list.stylePatternsUsed === 'number' && list.stylePatternsUsed > 0
            ? ` · styled from ${list.stylePatternsUsed} winning hook(s)`
            : useWinningHooks
              ? ' · no winning hooks saved yet (Master Data → Winning hooks)'
              : '';
        setNote(
          `Hooks ready for ${list.hooks?.length ?? 0} book(s)${list.provider ? ` via ${list.provider}` : ''}${styleNote}.${leftover}`
        );
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Hook generation failed'))
      .finally(() => setHooking(false));
  };

  const markSelected = () => {
    const ids = [...selected];
    if (ids.length === 0) {
      setError('Select at least one book to mark as recommended.');
      return;
    }
    setMarking(true);
    setError(null);
    markBooksRecommended({
      ids,
      channel,
      note: markNote.trim() || undefined,
      contentUrl: contentUrl.trim() || undefined,
    })
      .then((res) => {
        setNote(`Marked ${res.updated} book(s) as recommended on ${channel}.`);
        setSelected(new Set());
        setMarkNote('');
        setContentUrl('');
        runBuild();
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to mark'))
      .finally(() => setMarking(false));
  };

  const allSelected = books.length > 0 && books.every((b) => selected.has(b._id));

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <ListChecks className="text-terracotta" size={26} />
          <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown">Recommendation Builder</h1>
        </div>
        <p className="font-body text-chai-brown-light">
          Ask in plain English — AI checks your shelf and can include books that fit even when
          themes/moods/tags are incomplete. Then copy, tweak hooks, and mark what you used.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-body text-sm">
          {error}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          runAsk();
        }}
        className="bg-white rounded-lg border border-chai-brown/10 p-4 mb-4 space-y-3"
      >
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-chai-brown/40 pointer-events-none"
          />
          <input
            value={ask}
            onChange={(e) => setAsk(e.target.value)}
            placeholder='e.g. Independence Day Indian historical fiction, heartbreaking under 300 pages'
            className="w-full pl-10 pr-3 py-3 border border-chai-brown/20 rounded-lg font-body text-chai-brown focus:outline-none focus:border-terracotta"
          />
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <label className="inline-flex items-center gap-2 font-body text-sm text-chai-brown">
            <input
              type="checkbox"
              checked={aiFit}
              onChange={(e) => setAiFit(e.target.checked)}
            />
            AI judge fit (include incomplete books)
          </label>
          <label className="inline-flex items-center gap-2 font-body text-sm text-chai-brown">
            <input
              type="checkbox"
              checked={askWithHooks}
              onChange={(e) => setAskWithHooks(e.target.checked)}
            />
            Also generate hooks
          </label>
          <button
            type="submit"
            disabled={asking || loading || !ask.trim()}
            className="inline-flex items-center gap-2 bg-terracotta text-white px-5 py-2.5 rounded-lg hover:bg-terracotta/90 font-body text-sm disabled:opacity-50"
          >
            {asking ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {asking
              ? askWithHooks
                ? 'AI picking books + writing hooks…'
                : 'AI picking books…'
              : 'Ask + build list'}
          </button>
        </div>
      </form>

      <div className="mb-4 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => applyPreset(p.filters)}
            className="rounded-full border border-chai-brown/15 bg-cream/60 px-3 py-1.5 font-body text-xs text-chai-brown hover:border-terracotta/40 transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-chai-brown/10 p-4 mb-6 space-y-3">
        <p className="font-body text-xs text-chai-brown-light">
          Type freely — suggestions appear as you type. Matching is partial across tags, moods,
          notes, and pitches (not exact spelling).
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <input
            className={inputClass}
            list="rec-genres"
            placeholder="Genre"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
          />
          <datalist id="rec-genres">
            {(facets?.genres ?? []).map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
          <input
            className={inputClass}
            list="rec-themes"
            placeholder="Theme"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          />
          <datalist id="rec-themes">
            {(facets?.themes ?? []).map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
          <input
            className={inputClass}
            list="rec-moods"
            placeholder="Mood"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
          />
          <datalist id="rec-moods">
            {(facets?.moods ?? []).map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
          <input
            className={inputClass}
            list="rec-tags"
            placeholder="Tag"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
          />
          <datalist id="rec-tags">
            {(facets?.tags ?? []).map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
          <input
            className={inputClass}
            list="rec-seasons"
            placeholder="Occasion / season"
            value={season}
            onChange={(e) => setSeason(e.target.value)}
          />
          <datalist id="rec-seasons">
            {(facets?.seasons ?? []).map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <input
            className={inputClass}
            list="rec-collections"
            placeholder="Collection / Signature series"
            value={collection}
            onChange={(e) => setCollection(e.target.value)}
          />
          <datalist id="rec-collections">
            {(facets?.collections ?? []).map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <input
            className={inputClass}
            list="rec-countries"
            placeholder="Author nationality"
            value={authorCountry}
            onChange={(e) => setAuthorCountry(e.target.value)}
          />
          <datalist id="rec-countries">
            {(facets?.authorCountries ?? []).map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <input
            className={inputClass}
            list="rec-languages"
            placeholder="Language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          />
          <datalist id="rec-languages">
            {(facets?.languages ?? []).map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
          <input
            className={inputClass}
            placeholder="Keywords (all fields)"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            title="Searches title, tags, themes, collections, notes, and more. Multiple words must all match."
          />
          <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Any status</option>
            {READING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <input
            className={inputClass}
            type="number"
            min={1}
            placeholder="Max pages"
            value={maxPages}
            onChange={(e) => setMaxPages(e.target.value)}
          />
          <input
            className={inputClass}
            type="number"
            min={1}
            max={5}
            step={0.5}
            placeholder="Min rating"
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
          />
          <input
            className={inputClass}
            type="number"
            min={1}
            placeholder="Not rec’d in N days"
            value={notRecommendedDays}
            disabled={neverRecommended}
            onChange={(e) => setNotRecommendedDays(e.target.value)}
          />
          <label className="inline-flex items-center gap-2 font-body text-sm text-chai-brown px-1">
            <input type="checkbox" checked={owned} onChange={(e) => setOwned(e.target.checked)} />
            Owned only
          </label>
          <label className="inline-flex items-center gap-2 font-body text-sm text-chai-brown px-1">
            <input
              type="checkbox"
              checked={neverRecommended}
              onChange={(e) => setNeverRecommended(e.target.checked)}
            />
            Never recommended
          </label>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <button
            type="button"
            onClick={() => runBuild()}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-terracotta text-white px-4 py-2 rounded-lg hover:bg-terracotta/90 font-body text-sm disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <ListChecks size={16} />}
            Build list
          </button>
          <input
            className={`${inputClass} min-w-[180px]`}
            placeholder="Hook angle (e.g. Independence Day)"
            value={hookOccasion}
            onChange={(e) => setHookOccasion(e.target.value)}
          />
          <label className="inline-flex items-center gap-2 font-body text-sm text-chai-brown px-1">
            <input
              type="checkbox"
              checked={useWinningHooks}
              onChange={(e) => setUseWinningHooks(e.target.checked)}
            />
            Style from my winning hooks
          </label>
          <button
            type="button"
            onClick={runHooks}
            disabled={hooking || books.length === 0}
            className="inline-flex items-center gap-2 border border-terracotta/40 text-terracotta px-4 py-2 rounded-lg hover:bg-terracotta/10 font-body text-sm disabled:opacity-50"
            title={
              selected.size
                ? `Generate one strong hook each for ${Math.min(selected.size, 10)} selected`
                : 'Generate hooks for the shortlist (max 10)'
            }
          >
            {hooking ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {hooking
              ? 'Writing hooks…'
              : selected.size
                ? `Generate hooks (${Math.min(selected.size, 10)})`
                : 'Generate hooks'}
          </button>
          <button
            type="button"
            onClick={copyList}
            disabled={books.length === 0}
            className="inline-flex items-center gap-2 border border-chai-brown/20 text-chai-brown px-4 py-2 rounded-lg hover:bg-cream font-body text-sm disabled:opacity-50"
          >
            {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
            {copied
              ? 'Copied'
              : Object.keys(hooksById).length
                ? 'Copy list + hooks'
                : selected.size
                  ? `Copy selected (${selected.size})`
                  : 'Copy all as list'}
          </button>
          <button
            type="button"
            onClick={() =>
              downloadRecommendShortlistCsv(
                books,
                hooksById,
                selected.size ? [...selected] : undefined
              )
            }
            disabled={books.length === 0}
            className="inline-flex items-center gap-2 border border-chai-brown/20 text-chai-brown px-4 py-2 rounded-lg hover:bg-cream font-body text-sm disabled:opacity-50"
            title={
              selected.size
                ? `Export ${selected.size} selected book(s) as CSV`
                : 'Export this shortlist as CSV'
            }
          >
            <Download size={16} />
            {selected.size ? `Export CSV (${selected.size})` : 'Export CSV'}
          </button>
          {hooksProvider && (
            <span className="font-body text-xs text-chai-brown-light">hooks via {hooksProvider}</span>
          )}
        </div>
      </div>

      {note && (
        <p className="mb-4 font-body text-sm text-chai-brown-light">
          {note} {total > 0 && !loading ? `· ${selected.size} selected` : ''}
        </p>
      )}

      {selected.size > 0 && (
        <div className="mb-6 p-4 rounded-lg border border-terracotta/30 bg-terracotta/5 space-y-3">
          <p className="font-body text-sm text-chai-brown font-medium">
            Mark {selected.size} book(s) as recommended
          </p>
          <div className="flex flex-wrap gap-3">
            <select
              className={selectClass}
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
            >
              {RECOMMEND_CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              className={`${inputClass} flex-1 min-w-[180px]`}
              placeholder="Optional note"
              value={markNote}
              onChange={(e) => setMarkNote(e.target.value)}
            />
            <input
              className={`${inputClass} flex-1 min-w-[180px]`}
              placeholder="Content URL (optional)"
              value={contentUrl}
              onChange={(e) => setContentUrl(e.target.value)}
            />
            <button
              type="button"
              onClick={markSelected}
              disabled={marking}
              className="inline-flex items-center gap-2 bg-terracotta text-white px-4 py-2 rounded-lg hover:bg-terracotta/90 font-body text-sm disabled:opacity-50"
            >
              {marking ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Mark recommended
            </button>
            {selected.size === 1 && (
              <Link
                href={`/admin/library/content?bookId=${[...selected][0]}${
                  hookOccasion ? `&occasion=${encodeURIComponent(hookOccasion)}` : ''
                }`}
                className="inline-flex items-center gap-2 border border-terracotta/40 text-terracotta px-4 py-2 rounded-lg hover:bg-terracotta/10 font-body text-sm"
              >
                <Sparkles size={16} />
                More hooks (single book)
              </Link>
            )}
          </div>
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-5">
            <h2 className="font-serif text-2xl text-chai-brown">{viewing.title}</h2>
            <p className="font-body text-sm text-chai-brown-light mt-1">
              {viewing.author || '—'} · {formatLastRec(viewing)}
            </p>
            {viewing.oneLineRecommendation && (
              <p className="mt-3 font-body text-sm italic text-chai-brown">{viewing.oneLineRecommendation}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {[...viewing.genres, ...viewing.tags, ...viewing.moods].slice(0, 12).map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded-md bg-cream border border-chai-brown/10 text-xs font-body"
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-5 flex gap-3">
              <Link
                href={`/admin/library/content?bookId=${viewing._id}${
                  hookOccasion ? `&occasion=${encodeURIComponent(hookOccasion)}` : ''
                }`}
                className="flex-1 inline-flex items-center justify-center gap-2 text-center border border-terracotta/40 text-terracotta py-2 rounded-lg font-body text-sm hover:bg-terracotta/10"
              >
                <Sparkles size={16} />
                More hooks
              </Link>
              <Link
                href={`/admin/library/books/${viewing._id}`}
                className="flex-1 text-center bg-terracotta text-white py-2 rounded-lg font-body text-sm"
              >
                Open book
              </Link>
              <button
                type="button"
                onClick={() => setViewing(null)}
                className="flex-1 bg-gray-200 text-chai-brown py-2 rounded-lg font-body text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && books.length === 0 ? (
        <p className="font-body text-chai-brown-light">Building shortlist…</p>
      ) : books.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-chai-brown/15 bg-cream/40">
          <p className="font-serif text-xl text-chai-brown mb-2">No matches</p>
          <p className="font-body text-sm text-chai-brown-light">
            Loosen filters, or enrich more books/authors so tags and nationalities match.
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
                      checked={allSelected}
                      onChange={(e) => toggleAll(e.target.checked)}
                      aria-label="Select all results"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">
                    Book
                  </th>
                  <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">
                    Fit
                  </th>
                  <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">
                    History
                  </th>
                  <th className="px-4 py-3 text-right font-body text-sm font-medium text-chai-brown">
                    Actions
                  </th>
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
                        checked={selected.has(b._id)}
                        onChange={() => toggle(b._id)}
                        aria-label={`Select ${b.title}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setViewing(b)}
                        className="text-left"
                      >
                        <span className="font-body text-chai-brown hover:text-terracotta block">
                          {b.title}
                        </span>
                        <span className="font-body text-xs text-chai-brown-light">
                          {b.author || '—'}
                          {b.rating ? ` · ${b.rating}★` : ''}
                          {b.pages ? ` · ${b.pages}p` : ''}
                          {b.owned ? ' · owned' : ''}
                        </span>
                      </button>
                      {b.fitReason && (
                        <p className="mt-1 font-body text-xs text-terracotta/90">
                          Fit{b.fitConfidence ? ` · ${b.fitConfidence}` : ''}: {b.fitReason}
                        </p>
                      )}
                      {b.oneLineRecommendation && !hooksById[b._id] && (
                        <p className="mt-1 font-body text-xs text-chai-brown-light italic line-clamp-2">
                          {b.oneLineRecommendation}
                        </p>
                      )}
                      {hooksById[b._id] && (
                        <p className="mt-1.5 font-serif text-sm text-chai-brown leading-snug">
                          {hooksById[b._id]}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-body text-xs text-chai-brown-light">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {[...b.genres, ...b.moods, ...b.tags, ...b.seasonalRecommendation]
                          .slice(0, 6)
                          .map((t) => (
                            <span
                              key={t}
                              className="px-1.5 py-0.5 rounded bg-cream border border-chai-brown/10"
                            >
                              {t}
                            </span>
                          ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-body text-xs text-chai-brown-light whitespace-nowrap">
                      {formatLastRec(b)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setViewing(b)}
                        className="p-2 text-chai-brown hover:bg-cream rounded"
                        title="View"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
