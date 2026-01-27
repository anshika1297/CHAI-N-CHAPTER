'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';

export interface Musing {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  category: string;
  readingTime: number;
  author: string;
  publishedAt: string;
  /** SEO keywords for this musing; merged with site-wide keywords in meta. */
  seoKeywords?: string[];
}

const MUSING_CATEGORIES = [
  'Reflection',
  'Personal',
  'Short Story',
  'Thoughts',
  'Poetry',
  'Random',
];

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const defaultMusings: Musing[] = [
  {
    id: '1',
    title: 'The Art of Reading in Silence',
    slug: 'art-of-reading-in-silence',
    excerpt:
      "In a world full of noise, there's something sacred about the quiet moments spent with a book.",
    content: '<p>In a world full of noise, there\'s something sacred about the quiet moments spent with a book.</p>',
    image: '',
    category: 'Reflection',
    readingTime: 3,
    author: 'Anshika Mishra',
    publishedAt: '2024-01-22',
  },
  {
    id: '2',
    title: 'A Letter to My Younger Reading Self',
    slug: 'letter-to-younger-reading-self',
    excerpt:
      "Dear 15-year-old me, I wish I could tell you that the books you're reading now will shape who you become.",
    content: '<p>Dear 15-year-old me...</p>',
    image: '',
    category: 'Personal',
    readingTime: 4,
    author: 'Anshika Mishra',
    publishedAt: '2024-01-18',
  },
  {
    id: '3',
    title: 'The Coffee Shop Chronicles: Chapter One',
    slug: 'coffee-shop-chronicles-chapter-one',
    excerpt:
      'She sat in the corner, a worn copy of "The Seven Husbands of Evelyn Hugo" in her hands.',
    content: '<p>She sat in the corner...</p>',
    image: '',
    category: 'Short Story',
    readingTime: 5,
    author: 'Anshika Mishra',
    publishedAt: '2024-01-15',
  },
  {
    id: '4',
    title: 'Why I Read the Last Page First',
    slug: 'why-i-read-last-page-first',
    excerpt:
      "I know, I know. It's a cardinal sin in the bookish community. But hear me out...",
    content: '<p>I know, I know...</p>',
    image: '',
    category: 'Thoughts',
    readingTime: 3,
    author: 'Anshika Mishra',
    publishedAt: '2024-01-12',
  },
];

const emptyForm: Omit<Musing, 'id'> = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  image: '',
  category: 'Reflection',
  readingTime: 3,
  author: 'Anshika Mishra',
  publishedAt: new Date().toISOString().slice(0, 10),
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

export default function AdminMusingsPage() {
  const [items, setItems] = useState<Musing[]>(defaultMusings);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Musing | null>(null);
  const [formData, setFormData] = useState<Omit<Musing, 'id'>>(emptyForm);

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: editing ? formData.slug : generateSlug(title),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      setItems(
        items.map((p) =>
          p.id === editing.id ? { ...formData, id: editing.id } : p
        )
      );
    } else {
      setItems([...items, { ...formData, id: Date.now().toString() }]);
    }
    setFormData(emptyForm);
    setShowForm(false);
    setEditing(null);
  };

  const handleEdit = (item: Musing) => {
    setEditing(item);
    setFormData({
      title: item.title,
      slug: item.slug,
      excerpt: item.excerpt,
      content: item.content,
      image: item.image,
      category: item.category,
      readingTime: item.readingTime,
      author: item.author,
      publishedAt: item.publishedAt,
      seoKeywords: item.seoKeywords ?? [],
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this musing? This cannot be undone.')) {
      setItems(items.filter((p) => p.id !== id));
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

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown mb-2">
            Her Musings Verse
          </h1>
          <p className="font-body text-chai-brown-light">
            Create and edit musings, reflections, and short stories
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setFormData(emptyForm);
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-terracotta text-white px-4 py-2 rounded-lg hover:bg-terracotta/90 transition-colors font-body text-sm"
        >
          <Plus size={20} />
          Add Musing
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="font-serif text-2xl text-chai-brown mb-4">
              {editing ? 'Edit Musing' : 'Add Musing'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-body text-sm font-medium text-chai-brown mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  required
                  placeholder="Musing title"
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
                <label className="block font-body text-sm font-medium text-chai-brown mb-2">Content (HTML)</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                  rows={10}
                  placeholder="<p>Your musing content in HTML...</p>"
                  className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body font-mono text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-sm font-medium text-chai-brown mb-2">Cover image URL</label>
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                  />
                </div>
                <div>
                  <label className="block font-body text-sm font-medium text-chai-brown mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                  >
                    {MUSING_CATEGORIES.map((c) => (
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
                      setFormData({ ...formData, readingTime: parseInt(e.target.value, 10) || 3 })
                    }
                    className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                  />
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
              {/* SEO / Meta keywords */}
              <div>
                <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                  SEO / Meta keywords
                </label>
                <p className="text-xs text-chai-brown-light mb-2">
                  One per line or comma-separated. Merged with site-wide keywords on the musing page meta. Until you have an API, add this slug and keywords to <code className="bg-cream px-1 rounded text-[11px]">lib/content.ts</code> (MUSING_META) so the published page uses them.
                </p>
                <textarea
                  value={formatKeywordsForInput(formData.seoKeywords ?? [])}
                  onChange={(e) =>
                    setFormData({ ...formData, seoKeywords: parseKeywordsInput(e.target.value) })
                  }
                  rows={3}
                  placeholder="e.g. reading habits, personal essay, quiet reading (one per line or comma-separated)"
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
                <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">Published</th>
                <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">Read</th>
                <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">SEO</th>
                <th className="px-4 py-3 text-right font-body text-sm font-medium text-chai-brown">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-chai-brown/10">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-cream/50">
                  <td className="px-4 py-3">
                    <p className="font-body font-medium text-chai-brown line-clamp-2">{item.title}</p>
                    <p className="font-body text-xs text-chai-brown-light mt-0.5">/musings/{item.slug}</p>
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-chai-brown-light">{item.category}</td>
                  <td className="px-4 py-3 font-body text-sm text-chai-brown-light">{formatDate(item.publishedAt)}</td>
                  <td className="px-4 py-3 font-body text-sm text-chai-brown-light">{item.readingTime} min</td>
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
                        href={`/musings/${item.slug}`}
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
            No musings yet. Click “Add Musing” to create one.
          </div>
        )}
      </div>
    </div>
  );
}
