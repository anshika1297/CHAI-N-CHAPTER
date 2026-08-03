'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Trash2, Sparkles, Loader2 } from 'lucide-react';
import {
  createLibraryBook,
  deleteLibraryBook,
  getLibraryBook,
  suggestBookClassification,
  updateLibraryBook,
} from '@/lib/library/api';
import {
  AUTHOR_GENDERS,
  BOOK_FORMATS,
  DISCOVERY_SOURCES,
  DISCOVERY_STATUSES,
  FICTION_TYPES,
  OWNERSHIP_STATUSES,
  READING_STATUSES,
  RECOMMENDATION_CONFIDENCE,
  STATUS_LABELS,
  WOMEN_FOCUS_VALUES,
  type BookCopy,
  type LibraryBookDto,
} from '@/lib/library/types';

type FormState = Partial<LibraryBookDto> & { title: string; author: string };

const EMPTY: FormState = {
  title: '',
  author: '',
  status: 'want-to-read',
  genres: [],
  subgenres: [],
  themes: [],
  tropes: [],
  moods: [],
  keywords: [],
  tags: [],
  triggerWarnings: [],
  similarBooks: [],
  seasonalRecommendation: [],
  collections: [],
  awards: [],
  copies: [],
  recommendationHistory: [],
};

const LOCATION_SUGGESTIONS = ['UAE', 'India', 'Kindle', 'Digital'];

function toList(v: string): string[] {
  return v
    .split(/[|;,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function fromList(v: string[] | undefined): string {
  return (v ?? []).join('; ');
}

function dateInput(v: string | undefined): string {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function yearInput(v: string | undefined): string {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) {
    const m = String(v).match(/^(\d{4})/);
    return m ? m[1] : '';
  }
  return String(d.getUTCFullYear());
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="block font-body text-sm font-medium text-chai-brown mb-1.5">{label}</span>
      {children}
      {hint ? <span className="mt-1 block font-body text-xs text-chai-brown-light">{hint}</span> : null}
    </label>
  );
}

const inputClass =
  'w-full px-3 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body text-sm';

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg border border-chai-brown/10 p-5">
      <h2 className="font-serif text-xl text-chai-brown mb-1">{title}</h2>
      {subtitle ? (
        <p className="font-body text-sm text-chai-brown-light mb-4">{subtitle}</p>
      ) : (
        <div className="mb-4" />
      )}
      <div className="grid sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function BoolSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | undefined;
  onChange: (v: boolean | undefined) => void;
}) {
  const selectValue = value === true ? 'yes' : value === false ? 'no' : '';
  return (
    <Field label={label}>
      <select
        className={inputClass}
        value={selectValue}
        onChange={(e) => {
          if (e.target.value === 'yes') onChange(true);
          else if (e.target.value === 'no') onChange(false);
          else onChange(undefined);
        }}
      >
        <option value="">—</option>
        <option value="yes">Yes</option>
        <option value="no">No</option>
      </select>
    </Field>
  );
}

export default function LibraryBookFormPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id ?? '');
  const isNew = id === 'new';

  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [aiNote, setAiNote] = useState('');

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    if (isNew) return;
    setLoading(true);
    getLibraryBook(id)
      .then(({ book }) => setForm({ ...EMPTY, ...book }))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load book'))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const contentLinks = useMemo(() => form.contentLinks ?? {}, [form.contentLinks]);
  const copies = useMemo(() => form.copies ?? [], [form.copies]);

  const updateCopy = (index: number, patch: Partial<BookCopy>) => {
    set(
      'copies',
      copies.map((c, i) => (i === index ? { ...c, ...patch } : c))
    );
  };
  const addCopy = () => set('copies', [...copies, { format: '', location: '' }]);
  const removeCopy = (index: number) => set('copies', copies.filter((_, i) => i !== index));

  const syncGenresFromPrimarySecondary = (primary: string, secondary: string) => {
    const synced = [primary, secondary].map((s) => s.trim()).filter(Boolean);
    set('genres', synced);
  };

  const runAiSuggest = () => {
    setSuggesting(true);
    setError(null);
    setAiNote('');
    suggestBookClassification(id)
      .then(({ suggestion, provider }) => {
        const merge = (existing: string[] | undefined, add: string[]): string[] => {
          const out = [...(existing ?? [])];
          const seen = new Set(out.map((v) => v.toLowerCase()));
          for (const v of add) {
            if (v && !seen.has(v.toLowerCase())) {
              out.push(v);
              seen.add(v.toLowerCase());
            }
          }
          return out;
        };
        const fill = (current: string | undefined, next: string | undefined) =>
          (current && current.trim()) || !next ? (current ?? '') : next;

        setForm((prev) => {
          const genres = merge(prev.genres, suggestion.genres);
          return {
            ...prev,
            genres,
            primaryGenre: fill(prev.primaryGenre, genres[0]),
            secondaryGenre: fill(prev.secondaryGenre, genres[1]),
            subgenres: merge(prev.subgenres, suggestion.subgenres ?? []),
            themes: merge(prev.themes, suggestion.themes),
            moods: merge(prev.moods, suggestion.moods),
            tropes: merge(prev.tropes, suggestion.tropes),
            tags: merge(prev.tags, suggestion.tags),
            keywords: merge(prev.keywords, suggestion.keywords ?? []),
            seasonalRecommendation: merge(
              prev.seasonalRecommendation,
              suggestion.seasonalRecommendation ?? []
            ),
            similarBooks: merge(prev.similarBooks, suggestion.similarBooks ?? []),
            triggerWarnings: merge(prev.triggerWarnings, suggestion.triggerWarnings ?? []),
            audience: fill(prev.audience, suggestion.audience),
            readingLevel: fill(prev.readingLevel, suggestion.readingLevel),
            writingStyle: fill(prev.writingStyle, suggestion.writingStyle),
            series: fill(prev.series, suggestion.series),
            publisher: fill(prev.publisher, suggestion.publisher),
            country: fill(prev.country, suggestion.country),
            originalLanguage: fill(prev.originalLanguage, suggestion.originalLanguage),
            description: fill(prev.description, suggestion.description),
            oneLineRecommendation: fill(prev.oneLineRecommendation, suggestion.oneLineRecommendation),
            pages:
              prev.pages && prev.pages > 0
                ? prev.pages
                : suggestion.pages && suggestion.pages > 0
                  ? suggestion.pages
                  : prev.pages,
          };
        });
        const added =
          suggestion.genres.length +
          (suggestion.subgenres?.length ?? 0) +
          suggestion.themes.length +
          suggestion.moods.length +
          suggestion.tropes.length +
          suggestion.tags.length +
          (suggestion.keywords?.length ?? 0) +
          (suggestion.seasonalRecommendation?.length ?? 0);
        setAiNote(
          `Merged ${added}+ fields via ${provider}. Review Excel fields below, then Save.`
        );
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'AI suggestion failed'))
      .finally(() => setSuggesting(false));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!form.author.trim()) {
      setError('Author is required');
      return;
    }
    setSaving(true);
    setError(null);
    const primary = form.primaryGenre?.trim() || '';
    const secondary = form.secondaryGenre?.trim() || '';
    const payload: FormState = {
      ...form,
      genres: [primary, secondary].filter(Boolean).length
        ? [primary, secondary].filter(Boolean)
        : form.genres ?? [],
      ownership:
        form.ownership ||
        (form.owned
          ? 'owned'
          : form.wishlist?.trim().toLowerCase() === 'yes'
            ? 'wishlist'
            : form.ownership),
    };
    (isNew ? createLibraryBook(payload) : updateLibraryBook(id, payload))
      .then(({ book }) => {
        if (isNew) router.push('/admin/library/books');
        else setForm({ ...EMPTY, ...book });
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to save book'))
      .finally(() => setSaving(false));
  };

  const handleDelete = () => {
    if (!confirm(`Delete "${form.title}" from your library?`)) return;
    deleteLibraryBook(id)
      .then(() => router.push('/admin/library/books'))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to delete book'));
  };

  if (loading) {
    return <p className="font-body text-chai-brown-light">Loading book…</p>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/library/books"
            className="p-2 rounded-lg text-chai-brown hover:bg-cream"
            aria-label="Back to books"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl text-chai-brown">
              {isNew ? 'Add Book' : form.title || 'Edit Book'}
            </h1>
            <p className="font-body text-sm text-chai-brown-light mt-0.5">
              Fields match the Library Excel template. Title + Author required; use — / blank for N/A.
            </p>
          </div>
        </div>
        {!isNew && (
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg font-body text-sm"
          >
            <Trash2 size={18} />
            Delete
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-body text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Section title="Identity" subtitle="Excel: Title → Cover URL">
          <Field label="Title *">
            <input
              className={inputClass}
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              required
            />
          </Field>
          <Field label="Subtitle">
            <input className={inputClass} value={form.subtitle ?? ''} onChange={(e) => set('subtitle', e.target.value)} />
          </Field>
          <Field label="Author *">
            <input
              className={inputClass}
              value={form.author}
              onChange={(e) => set('author', e.target.value)}
              required
            />
          </Field>
          <Field label="Author Gender">
            <select
              className={inputClass}
              value={form.authorGender ?? ''}
              onChange={(e) => set('authorGender', e.target.value)}
            >
              <option value="">—</option>
              {AUTHOR_GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Country">
            <input className={inputClass} value={form.country ?? ''} onChange={(e) => set('country', e.target.value)} />
          </Field>
          <Field label="Original Language">
            <input
              className={inputClass}
              value={form.originalLanguage ?? ''}
              onChange={(e) => set('originalLanguage', e.target.value)}
            />
          </Field>
          <Field label="Translator">
            <input className={inputClass} value={form.translator ?? ''} onChange={(e) => set('translator', e.target.value)} />
          </Field>
          <Field label="Publication Year">
            <input
              type="number"
              className={inputClass}
              placeholder="e.g. 2019"
              value={yearInput(form.publicationDate)}
              onChange={(e) => {
                const y = e.target.value.trim();
                set('publicationDate', y ? `${y}-01-01` : undefined);
              }}
            />
          </Field>
          <Field label="Pages">
            <input
              type="number"
              className={inputClass}
              value={form.pages ?? ''}
              onChange={(e) => set('pages', e.target.value ? Number(e.target.value) : undefined)}
            />
          </Field>
          <Field label="ISBN">
            <input className={inputClass} value={form.isbn ?? ''} onChange={(e) => set('isbn', e.target.value)} />
          </Field>
          <Field label="Cover URL">
            <input className={inputClass} value={form.coverImage ?? ''} onChange={(e) => set('coverImage', e.target.value)} />
          </Field>
        </Section>

        <Section title="Classification" subtitle="Excel: Fiction / Non-fiction → Search Tags">
          <Field label="Fiction / Non-fiction">
            <select
              className={inputClass}
              value={form.fictionType ?? ''}
              onChange={(e) => set('fictionType', e.target.value)}
            >
              <option value="">—</option>
              {FICTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t === 'non-fiction' ? 'Non-fiction' : 'Fiction'}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Audience">
            <input className={inputClass} value={form.audience ?? ''} onChange={(e) => set('audience', e.target.value)} />
          </Field>
          <Field label="Primary Genre">
            <input
              className={inputClass}
              value={form.primaryGenre ?? ''}
              onChange={(e) => {
                const primary = e.target.value;
                set('primaryGenre', primary);
                syncGenresFromPrimarySecondary(primary, form.secondaryGenre ?? '');
              }}
            />
          </Field>
          <Field label="Secondary Genre">
            <input
              className={inputClass}
              value={form.secondaryGenre ?? ''}
              onChange={(e) => {
                const secondary = e.target.value;
                set('secondaryGenre', secondary);
                syncGenresFromPrimarySecondary(form.primaryGenre ?? '', secondary);
              }}
            />
          </Field>
          <Field label="Subgenre" hint="Separate with ; or commas">
            <input
              className={inputClass}
              value={fromList(form.subgenres)}
              onChange={(e) => set('subgenres', toList(e.target.value))}
            />
          </Field>
          <Field label="Themes" hint="Separate with ; or commas">
            <input className={inputClass} value={fromList(form.themes)} onChange={(e) => set('themes', toList(e.target.value))} />
          </Field>
          <Field label="Mood / Reading Experience">
            <input className={inputClass} value={fromList(form.moods)} onChange={(e) => set('moods', toList(e.target.value))} />
          </Field>
          <Field label="Tropes">
            <input className={inputClass} value={fromList(form.tropes)} onChange={(e) => set('tropes', toList(e.target.value))} />
          </Field>
          <Field label="Search Tags">
            <input className={inputClass} value={fromList(form.tags)} onChange={(e) => set('tags', toList(e.target.value))} />
          </Field>
        </Section>

        <Section title="Series" subtitle="Excel: Series (Y/N), Series Name, Number, Standalone">
          <BoolSelect label="Series (Y/N)" value={form.inSeries} onChange={(v) => set('inSeries', v)} />
          <Field label="Series Name">
            <input className={inputClass} value={form.series ?? ''} onChange={(e) => set('series', e.target.value)} />
          </Field>
          <Field label="Series Number">
            <input
              type="number"
              className={inputClass}
              value={form.seriesNumber ?? ''}
              onChange={(e) => set('seriesNumber', e.target.value ? Number(e.target.value) : undefined)}
            />
          </Field>
          <BoolSelect label="Standalone" value={form.standalone} onChange={(v) => set('standalone', v)} />
        </Section>

        <Section title="Women &amp; shelves" subtitle="Excel: Female Author → Collections">
          <BoolSelect label="Female Author" value={form.femaleAuthor} onChange={(v) => set('femaleAuthor', v)} />
          <BoolSelect
            label="Female Protagonist"
            value={form.femaleProtagonist}
            onChange={(v) => set('femaleProtagonist', v)}
          />
          <Field label="Women Focus">
            <select
              className={inputClass}
              value={form.womenFocus ?? ''}
              onChange={(e) => set('womenFocus', e.target.value)}
            >
              <option value="">—</option>
              {WOMEN_FOCUS_VALUES.map((w) => (
                <option key={w} value={w}>
                  {w.charAt(0).toUpperCase() + w.slice(1)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Collections" hint="Separate with ; or commas">
            <input
              className={inputClass}
              value={fromList(form.collections)}
              onChange={(e) => set('collections', toList(e.target.value))}
            />
          </Field>
        </Section>

        <Section title="Recommend &amp; content" subtitle="Excel: Occasion → Instagram / description">
          <Field label="Recommendation Occasion">
            <input
              className={inputClass}
              value={fromList(form.seasonalRecommendation)}
              onChange={(e) => set('seasonalRecommendation', toList(e.target.value))}
            />
          </Field>
          <Field label="Reading Level">
            <input className={inputClass} value={form.readingLevel ?? ''} onChange={(e) => set('readingLevel', e.target.value)} />
          </Field>
          <Field label="Similar Books">
            <input
              className={inputClass}
              value={fromList(form.similarBooks)}
              onChange={(e) => set('similarBooks', toList(e.target.value))}
            />
          </Field>
          <Field label="One-line Recommendation">
            <input
              className={inputClass}
              value={form.oneLineRecommendation ?? ''}
              onChange={(e) => set('oneLineRecommendation', e.target.value)}
            />
          </Field>
          <Field label="Short Description">
            <textarea
              className={inputClass}
              rows={3}
              value={form.description ?? ''}
              onChange={(e) => set('description', e.target.value)}
            />
          </Field>
          <Field label="Instagram Hook">
            <input
              className={inputClass}
              value={form.instagramHook ?? ''}
              onChange={(e) => set('instagramHook', e.target.value)}
            />
          </Field>
          <Field label="Instagram Post Topic">
            <input
              className={inputClass}
              value={form.instagramPostTopic ?? ''}
              onChange={(e) => set('instagramPostTopic', e.target.value)}
            />
          </Field>
          <Field label="Best Posting Month">
            <input
              className={inputClass}
              value={form.bestPostingMonth ?? ''}
              onChange={(e) => set('bestPostingMonth', e.target.value)}
              placeholder="e.g. October"
            />
          </Field>
        </Section>

        <Section title="Reading log" subtitle="Excel: Rating → Wishlist">
          <Field label="Chapters.Aur.Chai Rating">
            <input
              type="number"
              min={0}
              max={5}
              step={0.5}
              className={inputClass}
              value={form.rating ?? ''}
              onChange={(e) => set('rating', e.target.value ? Number(e.target.value) : undefined)}
            />
          </Field>
          <Field label="Read Status">
            <select
              className={inputClass}
              value={form.status}
              onChange={(e) => set('status', e.target.value as FormState['status'])}
            >
              {READING_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date Read">
            <input
              type="date"
              className={inputClass}
              value={dateInput(form.finishedDate)}
              onChange={(e) => set('finishedDate', e.target.value)}
            />
          </Field>
          <Field label="Format Read">
            <select
              className={inputClass}
              value={form.format ?? ''}
              onChange={(e) => set('format', e.target.value as FormState['format'])}
            >
              <option value="">—</option>
              {BOOK_FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </Field>
          <BoolSelect
            label="Owned"
            value={form.owned}
            onChange={(v) => {
              set('owned', v);
              if (v === true) set('ownership', 'owned');
            }}
          />
          <Field label="Wishlist" hint="Yes, or shelf labels from the sheet">
            <input
              className={inputClass}
              value={form.wishlist ?? ''}
              onChange={(e) => {
                set('wishlist', e.target.value);
                if (e.target.value.trim().toLowerCase() === 'yes') set('ownership', 'wishlist');
              }}
            />
          </Field>
        </Section>

        <Section title="Signals" subtitle="Excel: Awards → Bookstagram Popular (free text OK)">
          <Field label="Awards" hint="Separate with ; or commas">
            <input className={inputClass} value={fromList(form.awards)} onChange={(e) => set('awards', toList(e.target.value))} />
          </Field>
          <Field label="Bestseller">
            <input
              className={inputClass}
              value={form.bestseller ?? ''}
              onChange={(e) => set('bestseller', e.target.value)}
              placeholder="Yes / No / High / Moderate…"
            />
          </Field>
          <Field label="Adaptation">
            <input
              className={inputClass}
              value={form.adaptation ?? ''}
              onChange={(e) => set('adaptation', e.target.value)}
            />
          </Field>
          <Field label="BookTok Popular">
            <input
              className={inputClass}
              value={form.bookTokPopular ?? ''}
              onChange={(e) => set('bookTokPopular', e.target.value)}
            />
          </Field>
          <Field label="Bookstagram Popular">
            <input
              className={inputClass}
              value={form.bookstagramPopular ?? ''}
              onChange={(e) => set('bookstagramPopular', e.target.value)}
            />
          </Field>
        </Section>

        <div className="bg-white rounded-lg border border-chai-brown/10 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl text-chai-brown">AI tagging</h2>
              <p className="font-body text-sm text-chai-brown-light">
                Suggests genres, themes, moods, tags, occasions &amp; pitch. Existing values kept.
              </p>
            </div>
            <button
              type="button"
              onClick={runAiSuggest}
              disabled={suggesting || isNew}
              title={isNew ? 'Save the book first' : 'Suggest classification with AI'}
              className="inline-flex items-center gap-2 border border-terracotta/40 text-terracotta px-4 py-2 rounded-lg hover:bg-terracotta/10 font-body text-sm disabled:opacity-50"
            >
              {suggesting ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              Suggest with AI
            </button>
          </div>
          {isNew && (
            <p className="mt-2 font-body text-xs text-chai-brown-light">
              Save the book once, then AI tagging becomes available.
            </p>
          )}
          {aiNote && <p className="mt-2 font-body text-xs text-green-700">{aiNote}</p>}
        </div>

        <details className="bg-white rounded-lg border border-chai-brown/10 p-5">
          <summary className="font-serif text-xl text-chai-brown cursor-pointer">
            Advanced (legacy &amp; extras)
          </summary>
          <p className="font-body text-sm text-chai-brown-light mt-2 mb-4">
            Not on the Excel template — publisher, discovery, copies, links, tropes, etc.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Publisher">
              <input className={inputClass} value={form.publisher ?? ''} onChange={(e) => set('publisher', e.target.value)} />
            </Field>
            <Field label="ASIN">
              <input className={inputClass} value={form.asin ?? ''} onChange={(e) => set('asin', e.target.value)} />
            </Field>
            <Field label="Edition">
              <input className={inputClass} value={form.edition ?? ''} onChange={(e) => set('edition', e.target.value)} />
            </Field>
            <Field label="Ownership (legacy)">
              <select
                className={inputClass}
                value={form.ownership ?? ''}
                onChange={(e) => set('ownership', e.target.value as FormState['ownership'])}
              >
                <option value="">—</option>
                {OWNERSHIP_STATUSES.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Recommendation confidence">
              <select
                className={inputClass}
                value={form.recommendationConfidence ?? ''}
                onChange={(e) =>
                  set('recommendationConfidence', e.target.value as FormState['recommendationConfidence'])
                }
              >
                <option value="">—</option>
                {RECOMMENDATION_CONFIDENCE.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Writing style">
              <input
                className={inputClass}
                value={form.writingStyle ?? ''}
                onChange={(e) => set('writingStyle', e.target.value)}
              />
            </Field>
            <Field label="Tropes">
              <input className={inputClass} value={fromList(form.tropes)} onChange={(e) => set('tropes', toList(e.target.value))} />
            </Field>
            <Field label="Keywords">
              <input
                className={inputClass}
                value={fromList(form.keywords)}
                onChange={(e) => set('keywords', toList(e.target.value))}
              />
            </Field>
            <Field label="Trigger warnings">
              <input
                className={inputClass}
                value={fromList(form.triggerWarnings)}
                onChange={(e) => set('triggerWarnings', toList(e.target.value))}
              />
            </Field>
            <Field label="Why I recommend it">
              <input
                className={inputClass}
                value={form.whyIRecommendIt ?? ''}
                onChange={(e) => set('whyIRecommendIt', e.target.value)}
              />
            </Field>
            <Field label="Personal notes">
              <textarea
                className={inputClass}
                rows={2}
                value={form.personalNotes ?? ''}
                onChange={(e) => set('personalNotes', e.target.value)}
              />
            </Field>
            <Field label="Discovery source">
              <select
                className={inputClass}
                value={form.discoverySource ?? ''}
                onChange={(e) => set('discoverySource', e.target.value as FormState['discoverySource'])}
              >
                <option value="">—</option>
                {DISCOVERY_SOURCES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Discovery status">
              <select
                className={inputClass}
                value={form.discoveryStatus ?? ''}
                onChange={(e) => set('discoveryStatus', e.target.value as FormState['discoveryStatus'])}
              >
                <option value="">—</option>
                {DISCOVERY_STATUSES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif text-lg text-chai-brown">Copies I own</h3>
              <button
                type="button"
                onClick={addCopy}
                className="inline-flex items-center gap-1.5 text-terracotta font-body text-sm hover:underline"
              >
                + Add copy
              </button>
            </div>
            {copies.length === 0 ? (
              <p className="font-body text-sm text-chai-brown-light">No copies recorded.</p>
            ) : (
              <div className="space-y-3">
                {copies.map((copy, i) => (
                  <div key={i} className="flex flex-wrap items-end gap-3">
                    <label className="block">
                      <span className="block font-body text-xs text-chai-brown-light mb-1">Format</span>
                      <select
                        className={`${inputClass} w-40`}
                        value={copy.format ?? ''}
                        onChange={(e) => updateCopy(i, { format: e.target.value as BookCopy['format'] })}
                      >
                        <option value="">—</option>
                        {BOOK_FORMATS.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="block font-body text-xs text-chai-brown-light mb-1">Location</span>
                      <input
                        className={`${inputClass} w-44`}
                        list="library-copy-locations"
                        value={copy.location ?? ''}
                        onChange={(e) => updateCopy(i, { location: e.target.value })}
                      />
                    </label>
                    <label className="block flex-1 min-w-[150px]">
                      <span className="block font-body text-xs text-chai-brown-light mb-1">Notes</span>
                      <input
                        className={inputClass}
                        value={copy.notes ?? ''}
                        onChange={(e) => updateCopy(i, { notes: e.target.value })}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => removeCopy(i)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded mb-0.5"
                      aria-label="Remove copy"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <datalist id="library-copy-locations">
              {LOCATION_SUGGESTIONS.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
          </div>

          <div className="mt-6 grid sm:grid-cols-2 gap-4">
            {(['goodreads', 'amazon', 'blog', 'instagram', 'linkedin', 'youtube', 'newsletter'] as const).map(
              (key) => (
                <Field key={key} label={key.charAt(0).toUpperCase() + key.slice(1)}>
                  <input
                    className={inputClass}
                    value={contentLinks[key] ?? ''}
                    onChange={(e) => set('contentLinks', { ...contentLinks, [key]: e.target.value })}
                  />
                </Field>
              )
            )}
          </div>
        </details>

        <div className="flex items-center gap-3 sticky bottom-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-terracotta text-white px-5 py-2.5 rounded-lg hover:bg-terracotta/90 transition-colors font-body disabled:opacity-50 shadow-lg"
          >
            <Save size={18} />
            {saving ? 'Saving…' : isNew ? 'Create book' : 'Save changes'}
          </button>
          <Link
            href="/admin/library/books"
            className="px-5 py-2.5 rounded-lg bg-white border border-chai-brown/20 text-chai-brown font-body hover:bg-cream transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
