'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save } from 'lucide-react';
import Link from 'next/link';
import { announceMusing, getPageSettings, putPageSettings } from '@/lib/api';
import { tryAutoAnnounceOnFirstPublish } from '@/lib/announceSubscribers';
import { isContentPublished, readIsPublished, withToggledPublish } from '@/lib/contentPublish';
import { readSubscribersEmailedAt, subscribersEmailedSaveField } from '@/lib/subscribersEmailed';
import PageLoading from '@/components/PageLoading';
import ImageUploadField from '@/components/ImageUploadField';
import AdminPublishToggle from '@/components/admin/AdminPublishToggle';
import AdminSubscribersEmailedBadge from '@/components/admin/AdminSubscribersEmailedBadge';
import {
  readTags,
  musingFieldsForSave,
  musingFieldsFromRaw,
  seoFieldsForSave,
  seoFieldsFromRaw,
  type MusingContentFields,
} from '@/lib/contentFields';
import AdminUniversalSeoFields from '@/components/admin/AdminUniversalSeoFields';
import AdminMusingEditorialFields from '@/components/admin/AdminMusingEditorialFields';

export interface Musing extends MusingContentFields {
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
  isPublished: boolean;
  subscribersEmailedAt?: string;
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

const defaultMusings: Musing[] = [];

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
  isPublished: false,
  tags: [],
};

function toMusing(x: Record<string, unknown>): Musing | null {
  if (typeof x?.title !== 'string' || typeof x?.slug !== 'string') return null;
  return {
    id: String(x.id ?? x.slug),
    title: String(x.title).trim(),
    slug: String(x.slug).trim(),
    excerpt: typeof x.excerpt === 'string' ? x.excerpt : '',
    content: typeof x.content === 'string' ? x.content : '',
    image: typeof x.image === 'string' ? x.image : '',
    category: typeof x.category === 'string' ? x.category : 'Reflection',
    readingTime: typeof x.readingTime === 'number' ? x.readingTime : Number(x.readingTime) || 3,
    author: typeof x.author === 'string' ? x.author : '',
    publishedAt: typeof x.publishedAt === 'string' ? x.publishedAt : new Date().toISOString().slice(0, 10),
    isPublished: readIsPublished(x),
    subscribersEmailedAt: readSubscribersEmailedAt(x),
    ...seoFieldsFromRaw(x),
    tags: readTags(x),
    ...musingFieldsFromRaw(x),
  };
}

export default function AdminMusingsPage() {
  const [items, setItems] = useState<Musing[]>(defaultMusings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Musing | null>(null);
  const [formData, setFormData] = useState<Omit<Musing, 'id'>>(emptyForm);

  const loadItems = async (): Promise<Musing[]> => {
    const { content } = await getPageSettings('musings');
    if (content && typeof content === 'object' && !Array.isArray(content) && Array.isArray((content as { items?: unknown }).items)) {
      const list = ((content as { items: Record<string, unknown>[] }).items).map(toMusing).filter((p): p is Musing => p != null);
      if (list.length) {
        setItems(list);
        return list;
      }
    }
    return items;
  };

  useEffect(() => {
    loadItems()
      .catch(() => setMessage({ type: 'error', text: 'Failed to load musings' }))
      .finally(() => setLoading(false));
  }, []);

  const saveItemsToApi = async (itemsToSave: Musing[]) => {
    const itemsPayload = itemsToSave.map((i) => ({
      id: i.id,
      title: i.title,
      slug: i.slug,
      excerpt: i.excerpt ?? '',
      content: i.content ?? '',
      image: i.image ?? '',
      category: i.category ?? 'Reflection',
      readingTime: Number(i.readingTime) || 3,
      author: i.author ?? '',
      publishedAt: i.publishedAt ?? new Date().toISOString().slice(0, 10),
      isPublished: i.isPublished === true,
      ...subscribersEmailedSaveField(i.subscribersEmailedAt),
      ...seoFieldsForSave(i),
      ...musingFieldsForSave(i),
    }));
    await putPageSettings('musings', { items: itemsPayload });
  };

  const handleSaveToSite = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await saveItemsToApi(items);
      setMessage({ type: 'success', text: 'Musings saved to site!' });
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
    const before = editing ?? { ...emptyForm, id: 'new', isPublished: false, subscribersEmailedAt: undefined };
    let after: Musing;
    let nextItems: Musing[];
    if (editing) {
      after = { ...formData, id: editing.id, subscribersEmailedAt: editing.subscribersEmailedAt };
      nextItems = items.map((p) => (p.id === editing.id ? after : p));
    } else {
      after = { ...formData, id: Date.now().toString() };
      nextItems = [...items, after];
    }
    setItems(nextItems);
    setFormData(emptyForm);
    setShowForm(false);
    setEditing(null);
    setSaving(true);
    setMessage(null);
    try {
      await saveItemsToApi(nextItems);
      let msg = 'Musing saved to site!';
      const annex = await tryAutoAnnounceOnFirstPublish(before, after, () => announceMusing(after.slug));
      if (annex) {
        await loadItems();
        msg += ` ${annex}`;
      }
      setMessage({ type: 'success', text: msg });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save' });
    } finally {
      setSaving(false);
    }
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
      isPublished: item.isPublished,
      tags: item.tags ?? [],
      seoTitle: item.seoTitle,
      seoDescription: item.seoDescription,
      ogImage: item.ogImage,
      canonicalUrl: item.canonicalUrl,
      keyTakeaway: item.keyTakeaway,
      themes: item.themes ?? [],
    });
    setShowForm(true);
  };

  const togglePublish = async (item: Musing) => {
    const before = item;
    const updated = withToggledPublish(item);
    const nextItems = items.map((p) => (p.id === item.id ? updated : p));
    setItems(nextItems);
    setSaving(true);
    setMessage(null);
    try {
      await saveItemsToApi(nextItems);
      let msg = isContentPublished(item) ? 'Musing is now a draft.' : 'Musing is live on the site!';
      const annex = await tryAutoAnnounceOnFirstPublish(before, updated, () => announceMusing(updated.slug));
      if (annex) {
        await loadItems();
        msg += ` ${annex}`;
      }
      setMessage({ type: 'success', text: msg });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this musing? This cannot be undone.')) return;
    const nextItems = items.filter((p) => p.id !== id);
    setItems(nextItems);
    setSaving(true);
    setMessage(null);
    try {
      await saveItemsToApi(nextItems);
      setMessage({ type: 'success', text: 'Musing removed and saved.' });
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

  if (loading) return <PageLoading message="Loading musings…" />;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown mb-2">
            Her Musings Verse
          </h1>
          <p className="font-body text-chai-brown-light">
            Create and edit musings. Subscribers are emailed automatically the first time you publish.
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
          Add Musing
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
                  <ImageUploadField
                    label="Cover image"
                    value={formData.image}
                    onChange={(url) => setFormData({ ...formData, image: url })}
                    module="musings"
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
              <AdminMusingEditorialFields
                value={formData}
                onChange={(editorial) => setFormData({ ...formData, ...editorial })}
              />

              <AdminUniversalSeoFields
                imageModule="musings"
                value={formData}
                onChange={(seo) => setFormData({ ...formData, ...seo })}
              />
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
                <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">Status</th>
                <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">Date</th>
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
                  <td className="px-4 py-3">
                    <AdminPublishToggle
                      isPublished={isContentPublished(item)}
                      onToggle={() => togglePublish(item)}
                      disabled={saving}
                    />
                    <AdminSubscribersEmailedBadge item={item} />
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-chai-brown-light">{formatDate(item.publishedAt)}</td>
                  <td className="px-4 py-3 font-body text-sm text-chai-brown-light">{item.readingTime} min</td>
                  <td className="px-4 py-3 font-body text-sm text-chai-brown-light" title={(item.tags ?? []).join(', ') || 'No tags'}>
                    {(item.tags ?? []).length ? (
                      <span className="text-terracotta">{(item.tags ?? []).length}</span>
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
