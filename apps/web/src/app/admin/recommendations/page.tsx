'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save } from 'lucide-react';
import Link from 'next/link';
import { getPageSettings, putPageSettings } from '@/lib/api';
import PageLoading from '@/components/PageLoading';
import ImageUploadField from '@/components/ImageUploadField';

export interface RecommendationBook {
  id: string;
  title: string;
  author: string;
  image: string;
  rating: number;
  description: string;
  /** URL for the book (e.g. Goodreads, Amazon). Shown as hyperlink on book title. */
  bookLink?: string;
  /** URL for the author profile. Shown as hyperlink on author name. */
  authorLink?: string;
}

export interface Recommendation {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  intro: string;
  conclusion: string;
  image: string;
  category: string;
  readingTime: number;
  author: string;
  publishedAt: string;
  bookCount: number;
  books: RecommendationBook[];
  /** SEO keywords for this list; merged with site-wide keywords in meta. */
  seoKeywords?: string[];
}

const RECO_CATEGORIES = [
  'Book List',
  'Monthly Wrap-Up',
  'Weekly Wrap-Up',
  'Yearly Wrap-Up',
  'Genre Recommendations',
  'Author Spotlight',
];

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const defaultRecos: Recommendation[] = [
  {
    id: '1',
    title: 'Cozy Winter Reads: Books to Curl Up With',
    slug: 'cozy-winter-reads',
    excerpt:
      "As the temperature drops, there's nothing better than a warm blanket, hot chai, and these cozy reads that feel like a warm hug. From heartwarming romances to atmospheric mysteries...",
    intro:
      "As the temperature drops, there's nothing better than a warm blanket, hot chai, and these cozy reads that feel like a warm hug.",
    conclusion: 'These books have been my companions through many winter evenings. Happy reading!',
    image: '',
    category: 'Book List',
    readingTime: 6,
    author: 'Anshika Mishra',
    publishedAt: '2024-01-20',
    bookCount: 4,
    books: [
      { id: '1', title: 'The Seven Husbands of Evelyn Hugo', author: 'Taylor Jenkins Reid', image: '', rating: 5, description: 'This book completely swept me away!', bookLink: '', authorLink: '' },
      { id: '2', title: 'The Little Book of Hygge', author: 'Meik Wiking', image: '', rating: 4, description: 'Perfect for understanding the Danish concept of coziness.', bookLink: '', authorLink: '' },
    ],
  },
  {
    id: '2',
    title: 'January 2024 Wrap-Up: My Reading Journey',
    slug: 'january-2024-wrapup',
    excerpt:
      "January was a month of discovery! I read 8 incredible books across genres, from contemporary fiction to historical dramas. Here's what kept me turning pages...",
    intro: "January was a month of discovery!",
    conclusion: "Here's to more great reads in February.",
    image: '',
    category: 'Monthly Wrap-Up',
    readingTime: 8,
    author: 'Anshika Mishra',
    publishedAt: '2024-02-01',
    bookCount: 8,
    books: [],
  },
];

const emptyForm: Omit<Recommendation, 'id'> = {
  title: '',
  slug: '',
  excerpt: '',
  intro: '',
  conclusion: '',
  image: '',
  category: 'Book List',
  readingTime: 5,
  author: 'Anshika Mishra',
  publishedAt: new Date().toISOString().slice(0, 10),
  bookCount: 0,
  books: [],
  seoKeywords: [],
};

/** Parse "one per line or comma-separated" into trimmed string array. */
function parseKeywordsInput(value: string): string[] {
  return value
    .split(/[\n,]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function formatKeywordsForInput(keywords: string[]): string {
  return (keywords ?? []).join('\n');
}

function toReco(x: Record<string, unknown>): Recommendation | null {
  if (typeof x?.title !== 'string' || typeof x?.slug !== 'string') return null;
  const books = Array.isArray((x as { books?: unknown }).books)
    ? ((x as { books: Record<string, unknown>[] }).books).map((b) => ({
        id: String(b?.id ?? ''),
        title: String(b?.title ?? '').trim(),
        author: String(b?.author ?? '').trim(),
        image: typeof b?.image === 'string' ? b.image : '',
        rating: typeof b?.rating === 'number' ? b.rating : Number(b?.rating) || 0,
        description: String(b?.description ?? '').trim(),
        bookLink: typeof b?.bookLink === 'string' ? b.bookLink.trim() : '',
        authorLink: typeof b?.authorLink === 'string' ? b.authorLink.trim() : '',
      }))
    : [];
  return {
    id: String(x.id ?? x.slug),
    title: String(x.title).trim(),
    slug: String(x.slug).trim(),
    excerpt: typeof x.excerpt === 'string' ? x.excerpt : '',
    intro: typeof x.intro === 'string' ? x.intro : '',
    conclusion: typeof x.conclusion === 'string' ? x.conclusion : '',
    image: typeof x.image === 'string' ? x.image : '',
    category: typeof x.category === 'string' ? x.category : 'Book List',
    readingTime: typeof x.readingTime === 'number' ? x.readingTime : Number(x.readingTime) || 5,
    author: typeof x.author === 'string' ? x.author : '',
    publishedAt: typeof x.publishedAt === 'string' ? x.publishedAt : new Date().toISOString().slice(0, 10),
    bookCount: typeof x.bookCount === 'number' ? x.bookCount : books.length,
    books,
    seoKeywords: Array.isArray(x.seoKeywords) ? (x.seoKeywords as string[]).filter((s) => typeof s === 'string') : [],
  };
}

export default function AdminRecommendationsPage() {
  const [items, setItems] = useState<Recommendation[]>(defaultRecos);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Recommendation | null>(null);
  const [formData, setFormData] = useState<Omit<Recommendation, 'id'>>(emptyForm);

  useEffect(() => {
    getPageSettings('recommendations')
      .then(({ content }) => {
        if (content && typeof content === 'object' && !Array.isArray(content) && Array.isArray((content as { items?: unknown }).items)) {
          const list = ((content as { items: Record<string, unknown>[] }).items).map(toReco).filter((p): p is Recommendation => p != null);
          if (list.length) setItems(list);
        }
      })
      .catch(() => setMessage({ type: 'error', text: 'Failed to load recommendations' }))
      .finally(() => setLoading(false));
  }, []);

  const saveItemsToApi = async (itemsToSave: Recommendation[]) => {
    const itemsPayload = itemsToSave.map((i) => ({
      id: i.id,
      title: i.title,
      slug: i.slug,
      excerpt: i.excerpt ?? '',
      intro: i.intro ?? '',
      conclusion: i.conclusion ?? '',
      image: i.image ?? '',
      category: i.category ?? 'Book List',
      readingTime: Number(i.readingTime) || 5,
      author: i.author ?? '',
      publishedAt: i.publishedAt ?? new Date().toISOString().slice(0, 10),
      bookCount: Number(i.bookCount) ?? (i.books?.length ?? 0),
      books: Array.isArray(i.books) ? i.books.map((b) => ({ id: b.id, title: b.title ?? '', author: b.author ?? '', image: b.image ?? '', rating: Number(b.rating) || 0, description: b.description ?? '', bookLink: b.bookLink ?? '', authorLink: b.authorLink ?? '' })) : [],
      seoKeywords: Array.isArray(i.seoKeywords) ? i.seoKeywords : [],
    }));
    await putPageSettings('recommendations', { items: itemsPayload });
  };

  const handleSaveToSite = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await saveItemsToApi(items);
      setMessage({ type: 'success', text: 'Recommendations saved to site!' });
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: editing ? formData.slug : generateSlug(title),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let nextItems: Recommendation[];
    if (editing) {
      nextItems = items.map((p) =>
        p.id === editing.id ? { ...formData, id: editing.id } : p
      );
    } else {
      nextItems = [...items, { ...formData, id: Date.now().toString() }];
    }
    setItems(nextItems);
    setFormData(emptyForm);
    setShowForm(false);
    setEditing(null);
    setSaving(true);
    setMessage(null);
    try {
      await saveItemsToApi(nextItems);
      setMessage({ type: 'success', text: 'Recommendation saved to site!' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: Recommendation) => {
    setEditing(item);
    setFormData({
      title: item.title,
      slug: item.slug,
      excerpt: item.excerpt,
      intro: item.intro,
      conclusion: item.conclusion,
      image: item.image,
      category: item.category,
      readingTime: item.readingTime,
      author: item.author,
      publishedAt: item.publishedAt,
      bookCount: item.bookCount,
      books: item.books,
      seoKeywords: item.seoKeywords ?? [],
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this recommendation list? This cannot be undone.')) return;
    const nextItems = items.filter((p) => p.id !== id);
    setItems(nextItems);
    setSaving(true);
    setMessage(null);
    try {
      await saveItemsToApi(nextItems);
      setMessage({ type: 'success', text: 'Recommendation removed and saved.' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return d;
    }
  };

  if (loading) return <PageLoading message="Loading recommendations…" />;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown mb-2">
            Manage Book Recommendations
          </h1>
          <p className="font-body text-chai-brown-light">
            Create and edit recommendation lists. Home page shows newest 3.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSaveToSite}
            disabled={saving}
            className="flex items-center gap-2 bg-terracotta text-white px-4 py-2 rounded-lg hover:bg-terracotta/90 transition-colors font-body text-sm disabled:opacity-50"
          >
            <Save size={20} />
            {saving ? 'Saving…' : 'Save to site'}
          </button>
          <button
          onClick={() => {
            setEditing(null);
            setFormData(emptyForm);
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-sage/80 text-chai-brown px-4 py-2 rounded-lg hover:bg-sage transition-colors font-body text-sm"
        >
          <Plus size={20} />
          Add List
        </button>
        </div>
      </div>
      {message && (
        <div className={`mb-6 px-4 py-3 rounded-lg font-body text-sm ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="font-serif text-2xl text-chai-brown mb-4">
              {editing ? 'Edit Recommendation' : 'Add Recommendation'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-body text-sm font-medium text-chai-brown mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  required
                  placeholder="e.g. Cozy Winter Reads"
                  className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                />
              </div>
              <div>
                <label className="block font-body text-sm font-medium text-chai-brown mb-2">Slug (URL)</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                />
              </div>
              <div>
                <label className="block font-body text-sm font-medium text-chai-brown mb-2">Excerpt</label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  required
                  rows={2}
                  placeholder="Short summary for cards"
                  className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                />
              </div>
              <div>
                <label className="block font-body text-sm font-medium text-chai-brown mb-2">Intro</label>
                <textarea
                  value={formData.intro}
                  onChange={(e) => setFormData({ ...formData, intro: e.target.value })}
                  required
                  rows={3}
                  placeholder="Opening paragraph"
                  className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                />
              </div>
              <div>
                <label className="block font-body text-sm font-medium text-chai-brown mb-2">Conclusion</label>
                <textarea
                  value={formData.conclusion}
                  onChange={(e) => setFormData({ ...formData, conclusion: e.target.value })}
                  rows={2}
                  placeholder="Closing paragraph"
                  className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <ImageUploadField
                    label="Cover image"
                    value={formData.image}
                    onChange={(url) => setFormData({ ...formData, image: url })}
                    module="recommendations"
                    placeholder="Paste URL or click Upload"
                    className="font-body"
                  />
                </div>
                <div>
                  <label className="block font-body text-sm font-medium text-chai-brown mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                  >
                    {RECO_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-body text-sm font-medium text-chai-brown mb-2">Reading time (min)</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.readingTime}
                    onChange={(e) =>
                      setFormData({ ...formData, readingTime: parseInt(e.target.value, 10) || 5 })
                    }
                    className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                  />
                </div>
                <div>
                  <label className="block font-body text-sm font-medium text-chai-brown mb-2">Book count</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.bookCount}
                    onChange={(e) =>
                      setFormData({ ...formData, bookCount: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                  />
                </div>
                <div>
                  <label className="block font-body text-sm font-medium text-chai-brown mb-2">Published date</label>
                  <input
                    type="date"
                    value={formData.publishedAt}
                    onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                    className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                  />
                </div>
              </div>
              <div>
                <label className="block font-body text-sm font-medium text-chai-brown mb-2">Author</label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                />
              </div>

              {/* Featured books – each can have its own image URL */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block font-body text-sm font-medium text-chai-brown">
                    Featured books in this list
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        books: [
                          ...formData.books,
                          { id: Date.now().toString(), title: '', author: '', image: '', rating: 0, description: '', bookLink: '', authorLink: '' },
                        ],
                      })
                    }
                    className="text-terracotta text-xs font-body hover:underline"
                  >
                    + Add book
                  </button>
                </div>
                <p className="text-xs text-chai-brown-light mb-2">
                  Each book can have its own cover image. Use Upload or paste a URL.
                </p>
                {formData.books.map((book, idx) => (
                  <div
                    key={book.id}
                    className="mb-4 p-4 border border-chai-brown/10 rounded-lg bg-cream/30 space-y-3"
                  >
                    <div className="flex justify-between">
                      <span className="text-xs font-body text-chai-brown-light">Book #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            books: formData.books.filter((b) => b.id !== book.id),
                          })
                        }
                        className="text-red-600 text-xs hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={book.title}
                        onChange={(e) => {
                          const next = [...formData.books];
                          next[idx] = { ...book, title: e.target.value };
                          setFormData({ ...formData, books: next });
                        }}
                        placeholder="Book title"
                        className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body text-sm"
                      />
                      <input
                        type="text"
                        value={book.author}
                        onChange={(e) => {
                          const next = [...formData.books];
                          next[idx] = { ...book, author: e.target.value };
                          setFormData({ ...formData, books: next });
                        }}
                        placeholder="Author"
                        className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <ImageUploadField
                        value={book.image}
                        onChange={(url) => {
                          const next = [...formData.books];
                          next[idx] = { ...book, image: url };
                          setFormData({ ...formData, books: next });
                        }}
                        module="recommendations"
                        placeholder="Cover image (optional)"
                        className="font-body"
                      />
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-chai-brown-light">Rating (1–5):</label>
                        <input
                          type="number"
                          min={0}
                          max={5}
                          value={book.rating || ''}
                          onChange={(e) => {
                            const next = [...formData.books];
                            next[idx] = { ...book, rating: e.target.value ? parseInt(e.target.value, 10) : 0 };
                            setFormData({ ...formData, books: next });
                          }}
                          className="w-16 px-2 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-chai-brown-light mb-1">Book link (URL)</label>
                        <input
                          type="url"
                          value={book.bookLink ?? ''}
                          onChange={(e) => {
                            const next = [...formData.books];
                            next[idx] = { ...book, bookLink: e.target.value };
                            setFormData({ ...formData, books: next });
                          }}
                          placeholder="https://… (Goodreads, Amazon, etc.)"
                          className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body text-sm"
                        />
                        <p className="text-[11px] text-chai-brown-light mt-0.5">Book title becomes a clickable link.</p>
                      </div>
                      <div>
                        <label className="block text-xs text-chai-brown-light mb-1">Author profile link (URL)</label>
                        <input
                          type="url"
                          value={book.authorLink ?? ''}
                          onChange={(e) => {
                            const next = [...formData.books];
                            next[idx] = { ...book, authorLink: e.target.value };
                            setFormData({ ...formData, books: next });
                          }}
                          placeholder="https://… (author site, Goodreads, etc.)"
                          className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body text-sm"
                        />
                        <p className="text-[11px] text-chai-brown-light mt-0.5">Author name becomes a clickable link.</p>
                      </div>
                    </div>
                    <textarea
                      value={book.description}
                      onChange={(e) => {
                        const next = [...formData.books];
                        next[idx] = { ...book, description: e.target.value };
                        setFormData({ ...formData, books: next });
                      }}
                      rows={2}
                      placeholder="Why you recommend it (optional)"
                      className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body text-sm"
                    />
                  </div>
                ))}
              </div>

              {/* SEO / Meta keywords */}
              <div>
                <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                  SEO / Meta keywords
                </label>
                <p className="text-xs text-chai-brown-light mb-2">
                  One per line or comma-separated. Merged with site-wide keywords on the recommendation page meta. Until you have an API, add this slug and keywords to <code className="bg-cream px-1 rounded text-[11px]">lib/content.ts</code> (RECO_META) so the published page uses them.
                </p>
                <textarea
                  value={formatKeywordsForInput(formData.seoKeywords ?? [])}
                  onChange={(e) =>
                    setFormData({ ...formData, seoKeywords: parseKeywordsInput(e.target.value) })
                  }
                  rows={3}
                  placeholder="e.g. cozy reads, winter books, Taylor Jenkins Reid (one per line or comma-separated)"
                  className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body text-sm"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-terracotta text-white py-2 rounded-lg hover:bg-terracotta/90 transition-colors font-body"
                >
                  {editing ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditing(null); }}
                  className="flex-1 bg-gray-200 text-chai-brown py-2 rounded-lg hover:bg-gray-300 transition-colors font-body"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-chai-brown/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cream">
              <tr>
                <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">Title</th>
                <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">Category</th>
                <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">Books</th>
                <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">Published</th>
                <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">SEO</th>
                <th className="px-4 py-3 text-right font-body text-sm font-medium text-chai-brown">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-chai-brown/10">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-cream/50">
                  <td className="px-4 py-3">
                    <p className="font-body font-medium text-chai-brown line-clamp-2">{item.title}</p>
                    <p className="font-body text-xs text-chai-brown-light mt-0.5">/recommendations/{item.slug}</p>
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-chai-brown-light">{item.category}</td>
                  <td className="px-4 py-3 font-body text-sm text-chai-brown-light">{item.bookCount}</td>
                  <td className="px-4 py-3 font-body text-sm text-chai-brown-light">{formatDate(item.publishedAt)}</td>
                  <td className="px-4 py-3 font-body text-sm text-chai-brown-light" title={(item.seoKeywords ?? []).join(', ') || 'No custom keywords'}>
                    {(item.seoKeywords ?? []).length ? (
                      <span className="text-terracotta">{(item.seoKeywords ?? []).length}</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/recommendations/${item.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-sage hover:bg-sage/10 rounded transition-colors font-body text-xs"
                      >
                        View
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className="p-2 text-terracotta hover:bg-terracotta/10 rounded transition-colors"
                        aria-label="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        aria-label="Delete"
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
        {items.length === 0 && (
          <div className="px-4 py-12 text-center font-body text-chai-brown-light">
            No recommendation lists yet. Click “Add List” to create one.
          </div>
        )}
      </div>
    </div>
  );
}
