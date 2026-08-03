'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save } from 'lucide-react';
import Link from 'next/link';
import { announceBlogPost, getPageSettings, putPageSettings } from '@/lib/api';
import { tryAutoAnnounceOnFirstPublish } from '@/lib/announceSubscribers';
import { isContentPublished, readIsPublished, withToggledPublish } from '@/lib/contentPublish';
import { readSubscribersEmailedAt, subscribersEmailedSaveField } from '@/lib/subscribersEmailed';
import PageLoading from '@/components/PageLoading';
import ImageUploadField from '@/components/ImageUploadField';
import AdminPublishToggle from '@/components/admin/AdminPublishToggle';
import AdminSubscribersEmailedBadge from '@/components/admin/AdminSubscribersEmailedBadge';
import AdminShopLinksSection from '@/components/admin/AdminShopLinksSection';
import CatalogShopAutofill from '@/components/admin/CatalogShopAutofill';
import type { ShopBookMeta, ShopLink } from '@/lib/shopLinks';
import { hasShopLinks, resolveReviewShopLinks, sanitizeShopLinksForSave, shopPath } from '@/lib/shopLinks';
import { parseShopBookMeta, parseShopLinksFromRaw, sanitizeShopBookMeta } from '@/lib/shop/sanitize';
import {
  readGenres,
  readTags,
  reviewFieldsForSave,
  reviewFieldsFromRaw,
  seoFieldsForSave,
  seoFieldsFromRaw,
  type ReviewContentFields,
} from '@/lib/contentFields';
import AdminUniversalSeoFields from '@/components/admin/AdminUniversalSeoFields';
import AdminReviewEditorialFields from '@/components/admin/AdminReviewEditorialFields';
import AdminGenresField from '@/components/admin/AdminGenresField';

export interface BlogHighlight {
  id: string;
  quote: string;
  page?: number;
  image?: string;
}

export interface BlogPost extends ReviewContentFields {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  category: string;
  readingTime: number;
  author: string;
  bookTitle: string;
  bookAuthor: string;
  /** Book rating 1–5 (optional). */
  rating?: number;
  /** Goodreads URL — book title links here on the review. */
  bookLink?: string;
  shopLinks?: ShopLink[];
  shopBook?: ShopBookMeta;
  /** URL for the author profile. Shown as hyperlink on author name. */
  authorLink?: string;
  publishedAt: string;
  isPublished: boolean;
  subscribersEmailedAt?: string;
  highlights?: BlogHighlight[];
}

const DEFAULT_CATEGORIES = [
  'Book Review',
  'Fiction',
  'Non-Fiction',
  'Self-Help',
  'Reflection',
  'Romance',
  'Mystery',
  'Thriller',
  'Historical Fiction',
  'Literary Fiction',
];

const defaultPosts: BlogPost[] = [];

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const emptyForm: Omit<BlogPost, 'id'> = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  image: '',
  category: 'Book Review',
  readingTime: 5,
  author: 'Anshika Mishra',
    bookTitle: '',
    bookAuthor: '',
    rating: undefined,
    bookLink: '',
    authorLink: '',
    shopLinks: [],
    shopBook: undefined,
    publishedAt: new Date().toISOString().slice(0, 10),
  isPublished: false,
  highlights: [],
  tags: [],
  genres: [],
};

function toPost(x: Record<string, unknown>): BlogPost | null {
  if (typeof x?.title !== 'string' || typeof x?.slug !== 'string') return null;
  return {
    id: String(x.id ?? x.slug),
    title: String(x.title).trim(),
    slug: String(x.slug).trim(),
    excerpt: typeof x.excerpt === 'string' ? x.excerpt : '',
    content: typeof x.content === 'string' ? x.content : '',
    image: typeof x.image === 'string' ? x.image : '',
    category: typeof x.category === 'string' ? x.category : 'Book Review',
    readingTime: typeof x.readingTime === 'number' ? x.readingTime : Number(x.readingTime) || 5,
    author: typeof x.author === 'string' ? x.author : '',
    bookTitle: typeof x.bookTitle === 'string' ? x.bookTitle : '',
    bookAuthor: typeof x.bookAuthor === 'string' ? x.bookAuthor : '',
    rating: typeof x.rating === 'number' && x.rating >= 1 && x.rating <= 5 ? x.rating : undefined,
    bookLink: typeof x.bookLink === 'string' ? x.bookLink : '',
    authorLink: typeof x.authorLink === 'string' ? x.authorLink : '',
    shopLinks: parseShopLinksFromRaw(x.shopLinks),
    shopBook: parseShopBookMeta(x.shopBook),
    publishedAt: typeof x.publishedAt === 'string' ? x.publishedAt : new Date().toISOString().slice(0, 10),
    isPublished: readIsPublished(x),
    subscribersEmailedAt: readSubscribersEmailedAt(x),
    highlights: Array.isArray(x.highlights) ? (x.highlights as Record<string, unknown>[]).map((h) => ({ id: String(h?.id ?? ''), quote: String(h?.quote ?? '').trim(), page: typeof h?.page === 'number' ? h.page : undefined, image: typeof h?.image === 'string' ? h.image : '' })).filter((h) => h.quote) : [],
    ...seoFieldsFromRaw(x),
    tags: readTags(x),
    genres: readGenres(x),
    ...reviewFieldsFromRaw(x),
  };
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>(defaultPosts);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState<Omit<BlogPost, 'id'>>(emptyForm);
  const loadPosts = async (): Promise<BlogPost[]> => {
    const { content } = await getPageSettings('blog');
    if (content && typeof content === 'object' && !Array.isArray(content) && Array.isArray((content as { posts?: unknown }).posts)) {
      const list = ((content as { posts: Record<string, unknown>[] }).posts).map(toPost).filter((p): p is BlogPost => p != null);
      if (list.length) {
        setPosts(list);
        return list;
      }
    }
    return posts;
  };

  useEffect(() => {
    loadPosts()
      .catch(() => setMessage({ type: 'error', text: 'Failed to load posts' }))
      .finally(() => setLoading(false));
  }, []);

  /** Build serializable payload and call PUT /api/settings/pages/blog */
  const savePostsToApi = async (postsToSave: BlogPost[]) => {
    const postsPayload = postsToSave.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      content: p.content,
      image: p.image ?? '',
      category: p.category ?? 'Book Review',
      readingTime: Number(p.readingTime) || 5,
      author: p.author ?? '',
      bookTitle: p.bookTitle ?? '',
      bookAuthor: p.bookAuthor ?? '',
      rating: p.rating != null && p.rating >= 1 && p.rating <= 5 ? p.rating : undefined,
      bookLink: p.bookLink ?? '',
      authorLink: p.authorLink ?? '',
      shopLinks: sanitizeShopLinksForSave(p.shopLinks),
      shopBook: sanitizeShopBookMeta(p.shopBook),
      publishedAt: p.publishedAt ?? new Date().toISOString().slice(0, 10),
      isPublished: p.isPublished === true,
      ...subscribersEmailedSaveField(p.subscribersEmailedAt),
      highlights: Array.isArray(p.highlights) ? p.highlights.map((h) => ({ id: h.id, quote: h.quote ?? '', page: h.page, image: h.image ?? '' })) : [],
      ...seoFieldsForSave(p),
      ...reviewFieldsForSave(p),
    }));
    await putPageSettings('blog', { posts: postsPayload });
  };

  const handleSaveToSite = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await savePostsToApi(posts);
      setMessage({ type: 'success', text: 'Book reviews saved to site!' });
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
      slug: editingPost ? formData.slug : generateSlug(title),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const before = editingPost ?? { ...emptyForm, id: 'new', isPublished: false, subscribersEmailedAt: undefined };
    let after: BlogPost;
    let nextPosts: BlogPost[];
    if (editingPost) {
      after = { ...formData, id: editingPost.id, subscribersEmailedAt: editingPost.subscribersEmailedAt };
      nextPosts = posts.map((p) => (p.id === editingPost.id ? after : p));
    } else {
      after = { ...formData, id: Date.now().toString() };
      nextPosts = [...posts, after];
    }
    setPosts(nextPosts);
    setFormData(emptyForm);
    setShowForm(false);
    setEditingPost(null);
    setSaving(true);
    setMessage(null);
    try {
      await savePostsToApi(nextPosts);
      let msg = 'Post saved to site!';
      const annex = await tryAutoAnnounceOnFirstPublish(before, after, () => announceBlogPost(after.slug));
      if (annex) {
        await loadPosts();
        msg += ` ${annex}`;
      }
      setMessage({ type: 'success', text: msg });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      image: post.image,
      category: post.category,
      readingTime: post.readingTime,
      author: post.author,
      bookTitle: post.bookTitle,
      bookAuthor: post.bookAuthor,
      rating: post.rating,
      bookLink: post.bookLink ?? '',
      authorLink: post.authorLink ?? '',
      shopLinks: post.shopLinks ?? [],
      shopBook: post.shopBook,
      publishedAt: post.publishedAt,
      isPublished: post.isPublished,
      highlights: post.highlights ?? [],
      tags: post.tags ?? [],
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
      ogImage: post.ogImage,
      canonicalUrl: post.canonicalUrl,
      recommendedFor: post.recommendedFor,
      notRecommendedFor: post.notRecommendedFor,
      verdict: post.verdict,
      similarBooks: post.similarBooks ?? [],
      genres: post.genres ?? [],
    });
    setShowForm(true);
  };

  const togglePublish = async (post: BlogPost) => {
    const before = post;
    const updated = withToggledPublish(post);
    const nextPosts = posts.map((p) => (p.id === post.id ? updated : p));
    setPosts(nextPosts);
    setSaving(true);
    setMessage(null);
    try {
      await savePostsToApi(nextPosts);
      let msg = isContentPublished(post) ? 'Post is now a draft.' : 'Post is live on the site!';
      const annex = await tryAutoAnnounceOnFirstPublish(before, updated, () => announceBlogPost(updated.slug));
      if (annex) {
        await loadPosts();
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
    if (!confirm('Are you sure you want to delete this post? This cannot be undone.')) return;
    const nextPosts = posts.filter((p) => p.id !== id);
    setPosts(nextPosts);
    setSaving(true);
    setMessage(null);
    try {
      await savePostsToApi(nextPosts);
      setMessage({ type: 'success', text: 'Post removed and saved.' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const openCreate = () => {
    setEditingPost(null);
    setFormData(emptyForm);
    setShowForm(true);
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

  if (loading) return <PageLoading message="Loading book reviews…" />;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown mb-2">
            Manage Book Reviews
          </h1>
          <p className="font-body text-chai-brown-light">
            Create, edit, and publish blog posts. <strong>Shop buy links</strong> are inside each post — click{' '}
            <strong>Edit</strong>, scroll to the green <strong>&quot;Where to buy — Shop page&quot;</strong> section, then Save to site.
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
          onClick={openCreate}
          className="flex items-center gap-2 bg-terracotta text-white px-4 py-2 rounded-lg hover:bg-terracotta/90 transition-colors font-body text-sm"
        >
          <Plus size={20} />
          Add Post
        </button>
        </div>
      </div>
      {message && (
        <div className={`mb-6 px-4 py-3 rounded-lg font-body text-sm ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="font-serif text-2xl text-chai-brown mb-4">
              {editingPost ? 'Edit Post' : 'Add Post'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  required
                  placeholder="Post title"
                  className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                />
              </div>
              <div>
                <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                  Slug (URL)
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                  placeholder="url-friendly-slug"
                  className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                />
              </div>
              <div>
                <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                  Excerpt
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  required
                  rows={3}
                  placeholder="Short summary for cards and SEO"
                  className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                />
              </div>
              <div>
                <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                  Content (HTML)
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                  rows={10}
                  placeholder="<p>Your post content in HTML...</p>"
                  className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body font-mono text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <ImageUploadField
                    label="Featured image"
                    value={formData.image}
                    onChange={(url) => setFormData({ ...formData, image: url })}
                    module="blog"
                    placeholder="Paste URL or click Upload"
                    className="font-body"
                  />
                </div>
                <div>
                  <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                  >
                    {DEFAULT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <AdminGenresField
                value={formData.genres}
                onChange={(genres) => setFormData({ ...formData, genres })}
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                    Reading time (min)
                  </label>
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
                  <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                    Author
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                  />
                </div>
                <div>
                  <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                    Published date
                  </label>
                  <input
                    type="date"
                    value={formData.publishedAt}
                    onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                    className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                    Book title
                  </label>
                  <input
                    type="text"
                    value={formData.bookTitle}
                    onChange={(e) => setFormData({ ...formData, bookTitle: e.target.value })}
                    placeholder="Book being reviewed"
                    className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                  />
                </div>
                <div>
                  <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                    Book author
                  </label>
                  <input
                    type="text"
                    value={formData.bookAuthor}
                    onChange={(e) => setFormData({ ...formData, bookAuthor: e.target.value })}
                    placeholder="Author of the book"
                    className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                  />
                </div>
              </div>
              <CatalogShopAutofill
                title={formData.bookTitle}
                author={formData.bookAuthor}
                shopLinks={formData.shopLinks}
                shopBook={formData.shopBook}
                bookLink={formData.bookLink}
                coverImage={formData.image}
                onApply={(patch) =>
                  setFormData((prev) => ({
                    ...prev,
                    shopLinks: patch.shopLinks.length ? patch.shopLinks : prev.shopLinks,
                    shopBook: patch.shopBook ?? prev.shopBook,
                    bookLink: patch.bookLink && !prev.bookLink?.trim() ? patch.bookLink : prev.bookLink,
                    image: patch.coverImage && !prev.image?.trim() ? patch.coverImage : prev.image,
                  }))
                }
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                    Rating (1–5)
                  </label>
                  <select
                    value={formData.rating ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rating: e.target.value ? parseInt(e.target.value, 10) : undefined,
                      })
                    }
                    className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                  >
                    <option value="">No rating</option>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n} / 5
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-body text-sm font-medium text-chai-brown mb-2">Goodreads link</label>
                  <input
                    type="url"
                    value={formData.bookLink ?? ''}
                    onChange={(e) => setFormData({ ...formData, bookLink: e.target.value })}
                    placeholder="https://www.goodreads.com/book/…"
                    className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                  />
                </div>
                <div>
                  <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                    Author profile link (URL)
                  </label>
                  <input
                    type="url"
                    value={formData.authorLink ?? ''}
                    onChange={(e) => setFormData({ ...formData, authorLink: e.target.value })}
                    placeholder="https://… (author site, Goodreads, etc.)"
                    className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                  />
                  <p className="text-xs text-chai-brown-light mt-0.5">Author name becomes a clickable link.</p>
                </div>
              </div>

              <AdminShopLinksSection
                value={formData.shopLinks ?? []}
                onChange={(shopLinks) => setFormData({ ...formData, shopLinks })}
                shopBook={formData.shopBook}
                onShopBookChange={(shopBook) => setFormData({ ...formData, shopBook })}
                inheritHint={{
                  title: formData.bookTitle,
                  author: formData.bookAuthor,
                  genre: formData.genres?.[0] ?? formData.category,
                  coverImage: formData.image,
                }}
                shopPageHref={formData.slug?.trim() ? shopPath('review', formData.slug) : undefined}
              />

              <AdminReviewEditorialFields
                value={formData}
                onChange={(editorial) => setFormData({ ...formData, ...editorial })}
              />

              <AdminUniversalSeoFields
                imageModule="blog"
                value={formData}
                onChange={(seo) => setFormData({ ...formData, ...seo })}
              />

              {/* Highlights / Quotes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block font-body text-sm font-medium text-chai-brown">
                    Favorite quotes & highlights
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        highlights: [
                          ...(formData.highlights ?? []),
                          { id: Date.now().toString(), quote: '', page: undefined, image: '' },
                        ],
                      })
                    }
                    className="text-terracotta text-xs font-body hover:underline"
                  >
                    + Add quote
                  </button>
                </div>
                <p className="text-xs text-chai-brown-light mb-2">
                  Optional. Shown as “Favorite Quotes & Highlights” on the post. Upload or paste URL for each quote image.
                </p>
                {(formData.highlights ?? []).map((h, idx) => (
                  <div
                    key={h.id}
                    className="mb-4 p-4 border border-chai-brown/10 rounded-lg bg-cream/30 space-y-3"
                  >
                    <div className="flex justify-between">
                      <span className="text-xs font-body text-chai-brown-light">Quote #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            highlights: (formData.highlights ?? []).filter((x) => x.id !== h.id),
                          })
                        }
                        className="text-red-600 text-xs hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    <textarea
                      value={h.quote}
                      onChange={(e) => {
                        const next = [...(formData.highlights ?? [])];
                        next[idx] = { ...h, quote: e.target.value };
                        setFormData({ ...formData, highlights: next });
                      }}
                      rows={2}
                      placeholder="Quote from the book"
                      className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body text-sm"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="number"
                        min={0}
                        value={h.page ?? ''}
                        onChange={(e) => {
                          const next = [...(formData.highlights ?? [])];
                          next[idx] = { ...h, page: e.target.value ? parseInt(e.target.value, 10) : undefined };
                          setFormData({ ...formData, highlights: next });
                        }}
                        placeholder="Page number (optional)"
                        className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body text-sm"
                      />
                      <ImageUploadField
                        value={h.image ?? ''}
                        onChange={(url) => {
                          const next = [...(formData.highlights ?? [])];
                          next[idx] = { ...h, image: url || '' };
                          setFormData({ ...formData, highlights: next });
                        }}
                        module="blog"
                        placeholder="Quote image (optional)"
                        className="font-body"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-terracotta text-white py-2 rounded-lg hover:bg-terracotta/90 transition-colors font-body"
                >
                  {editingPost ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPost(null);
                  }}
                  className="flex-1 bg-gray-200 text-chai-brown py-2 rounded-lg hover:bg-gray-300 transition-colors font-body"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Posts Table */}
      <div className="bg-white rounded-lg border border-chai-brown/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cream">
              <tr>
                <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">
                  Title
                </th>
                <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">
                  Category
                </th>
                <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">
                  Book
                </th>
                <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">
                  Rating
                </th>
                <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">
                  Date
                </th>
                <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">
                  Read
                </th>
                <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown" title="Buy links on /shop">
                  Shop
                </th>
                <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown" title="Meta keywords count">
                  SEO
                </th>
                <th className="px-4 py-3 text-right font-body text-sm font-medium text-chai-brown">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-chai-brown/10">
              {posts.map((post) => {
                const resolvedShopLinks = resolveReviewShopLinks(post as unknown as Record<string, unknown>);
                return (
                <tr key={post.id} className="hover:bg-cream/50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-body font-medium text-chai-brown line-clamp-2">
                        {post.title}
                      </p>
                      <p className="font-body text-xs text-chai-brown-light mt-0.5">
                        /blog/{post.slug}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-chai-brown-light">
                    {post.category}
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-chai-brown-light">
                    <span className="italic">{post.bookTitle || '—'}</span>
                    {post.bookAuthor && (
                      <span className="block text-xs">by {post.bookAuthor}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-chai-brown-light">
                    {post.rating != null ? `${post.rating}/5` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <AdminPublishToggle
                      isPublished={isContentPublished(post)}
                      onToggle={() => togglePublish(post)}
                      disabled={saving}
                    />
                    <AdminSubscribersEmailedBadge item={post} />
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-chai-brown-light">
                    {formatDate(post.publishedAt)}
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-chai-brown-light">
                    {post.readingTime} min
                  </td>
                  <td className="px-4 py-3 font-body text-sm">
                    {hasShopLinks(resolvedShopLinks) ? (
                      <Link
                        href={shopPath('review', post.slug)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sage font-medium hover:underline"
                        title="View on /shop"
                      >
                        {resolvedShopLinks.length} link{resolvedShopLinks.length === 1 ? '' : 's'}
                      </Link>
                    ) : (
                      <span className="text-chai-brown-light" title="Edit post → Where to buy section">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-chai-brown-light" title={(post.tags ?? []).join(', ') || 'No tags'}>
                    {(post.tags ?? []).length ? (
                      <span className="text-terracotta">{(post.tags ?? []).length}</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-sage hover:bg-sage/10 rounded transition-colors font-body text-xs"
                      >
                        View
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleEdit(post)}
                        className="p-2 text-terracotta hover:bg-terracotta/10 rounded transition-colors"
                        aria-label="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(post.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        aria-label="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
        {posts.length === 0 && (
          <div className="px-4 py-12 text-center font-body text-chai-brown-light">
            No posts yet. Click “Add Post” to create your first book review.
          </div>
        )}
      </div>
    </div>
  );
}
