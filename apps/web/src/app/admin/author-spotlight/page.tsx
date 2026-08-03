'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react';
import ImageUploadField from '@/components/ImageUploadField';
import BlogSiteLinkPreviewField from '@/components/author-spotlight/BlogSiteLinkPreviewField';
import PageLoading from '@/components/PageLoading';
import AdminShopLinksSection from '@/components/admin/AdminShopLinksSection';
import AdminSubscribersEmailedBadge from '@/components/admin/AdminSubscribersEmailedBadge';
import { hasShopLinks, normalizeShopLinks, sanitizeShopLinksForSave, shopPath, type ShopLink } from '@/lib/shopLinks';
import { parseShopBookMeta, sanitizeShopBookMeta } from '@/lib/shop/sanitize';
import { readTags, genresForSave } from '@/lib/contentFields';
import AdminGenresField from '@/components/admin/AdminGenresField';
import AdminUniversalSeoFields from '@/components/admin/AdminUniversalSeoFields';
import AdminSpotlightEditorialFields from '@/components/admin/AdminSpotlightEditorialFields';
import AdminAuthorConnectFields from '@/components/admin/AdminAuthorConnectFields';
import {
  getAuthorSpotlightsAdmin,
  createAuthorSpotlightAdmin,
  updateAuthorSpotlightAdmin,
  deleteAuthorSpotlightAdmin,
  publishAuthorSpotlightAdmin,
  reorderAuthorSpotlightsAdmin,
  type AuthorSpotlightDto,
  type AuthorSpotlightFeaturedBook,
  type AuthorSpotlightSocialLink,
  type AuthorSpotlightBlogLink,
  type AuthorSpotlightReadingPairing,
  type AuthorSpotlightQaItem,
} from '@/lib/api';

function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function emptySpotlight(): Omit<AuthorSpotlightDto, 'id'> {
  return {
    slug: '',
    name: '',
    tagline: '',
    coverImage: '',
    profileImage: '',
    introduction: '',
    whoIsHtml: '',
    bio: '',
    genres: [],
    connectLinks: {},
    socialLinks: [],
    featuredBooks: [],
    blogLinks: [],
    readingPairings: [],
    faq: [],
    interviewSectionTitle: 'Interview',
    interview: [],
    isPublished: false,
    displayOrder: 0,
    seoTitle: '',
    seoDescription: '',
    socialShareImage: '',
    ogImage: '',
    tags: [],
    canonicalUrl: '',
    startHere: '',
    notableWorks: [],
    similarAuthors: [],
  };
}

/** Same rules as API: lowercase, hyphens, strip invalid chars. */
function normalizeSlugForApi(slug: string, name: string): string {
  const t = slug.trim();
  if (!t) return slugFromName(name);
  return t
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

type SpotlightFieldKey = 'name' | 'slug' | 'coverImage' | 'profileImage';
type SpotlightFieldErrors = Partial<Record<SpotlightFieldKey, string>>;

function validateSpotlightFields(body: {
  name: string;
  slug: string;
  coverImage: string;
  profileImage: string;
}): SpotlightFieldErrors {
  const errs: SpotlightFieldErrors = {};
  if (!body.name.trim()) {
    errs.name = 'Name is required.';
  }
  const slug = body.slug.trim();
  if (!slug) {
    errs.slug =
      'A URL slug is required. Use a name that includes letters or numbers, or type a slug (e.g. author-name).';
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    errs.slug = 'Slug may only contain lowercase letters, numbers, and hyphens.';
  }
  if (!body.profileImage.trim()) {
    errs.profileImage = 'Author photo is required for the detail page — upload or paste an image URL.';
  }
  return errs;
}

export default function AdminAuthorSpotlightPage() {
  const [list, setList] = useState<AuthorSpotlightDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<AuthorSpotlightDto, 'id'>>(emptySpotlight());
  const [fieldErrors, setFieldErrors] = useState<SpotlightFieldErrors>({});
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    getAuthorSpotlightsAdmin()
      .then(({ spotlights }) => {
        setList(spotlights);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptySpotlight());
    setFieldErrors({});
    setShowForm(true);
    setError(null);
  };

  const openEdit = (s: AuthorSpotlightDto) => {
    setEditingId(s.id);
    setFieldErrors({});
    setForm({
      slug: s.slug,
      name: s.name,
      tagline: s.tagline ?? '',
      coverImage: s.coverImage ?? '',
      profileImage: s.profileImage,
      introduction: s.introduction ?? '',
      whoIsHtml: s.whoIsHtml ?? '',
      bio: s.bio ?? '',
      genres: s.genres ?? [],
      connectLinks: s.connectLinks ?? {},
      socialLinks: s.socialLinks ?? [],
      featuredBooks: (s.featuredBooks ?? []).map((b) => ({
        ...b,
        shopLinks: normalizeShopLinks(b.shopLinks, b.buyLink),
        shopBook: parseShopBookMeta(b.shopBook),
      })),
      blogLinks: s.blogLinks ?? [],
      readingPairings: s.readingPairings ?? [],
      faq: s.faq ?? [],
      interviewSectionTitle: s.interviewSectionTitle ?? 'Interview',
      interview: s.interview ?? [],
      isPublished: s.isPublished,
      publishDate: s.publishDate,
      displayOrder: s.displayOrder ?? 0,
      seoTitle: s.seoTitle ?? '',
      seoDescription: s.seoDescription ?? '',
      socialShareImage: s.socialShareImage ?? s.ogImage ?? '',
      ogImage: s.socialShareImage ?? s.ogImage ?? '',
      tags: s.tags ?? readTags(s),
      canonicalUrl: s.canonicalUrl ?? '',
      startHere: s.startHere ?? '',
      notableWorks: s.notableWorks ?? [],
      similarAuthors: s.similarAuthors ?? [],
    });
    setShowForm(true);
    setError(null);
  };

  const payloadFromForm = (): Omit<AuthorSpotlightDto, 'id' | 'createdAt' | 'updatedAt'> => ({
    ...form,
    slug: normalizeSlugForApi(form.slug, form.name),
    genres: genresForSave(form.genres),
    featuredBooks: (form.featuredBooks ?? []).map((b) => ({
      ...b,
      shopLinks: sanitizeShopLinksForSave(b.shopLinks as ShopLink[] | undefined),
      shopBook: sanitizeShopBookMeta(b.shopBook),
      buyLink: '',
    })),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const body = payloadFromForm();

    const fieldErrs = validateSpotlightFields({
      name: body.name,
      slug: body.slug,
      coverImage: body.coverImage ?? '',
      profileImage: body.profileImage,
    });
    if (Object.keys(fieldErrs).length > 0) {
      setFieldErrors(fieldErrs);
      setSaving(false);
      return;
    }
    setFieldErrors({});

    try {
      let announceMessage: string | undefined;
      if (editingId) {
        ({ announceMessage } = await updateAuthorSpotlightAdmin(editingId, body));
      } else {
        ({ announceMessage } = await createAuthorSpotlightAdmin(body));
      }
      setShowForm(false);
      setEditingId(null);
      load();
      if (announceMessage) {
        setNotice({ type: 'success', text: announceMessage });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this author spotlight? This cannot be undone.')) return;
    setError(null);
    try {
      await deleteAuthorSpotlightAdmin(id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const togglePublish = async (s: AuthorSpotlightDto) => {
    setError(null);
    setNotice(null);
    try {
      const { announceMessage } = await publishAuthorSpotlightAdmin(s.id, !s.isPublished);
      load();
      if (announceMessage) {
        setNotice({ type: 'success', text: announceMessage });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[index], next[j]] = [next[j], next[index]];
    setError(null);
    try {
      await reorderAuthorSpotlightsAdmin(next.map((x) => x.id));
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reorder failed');
    }
  };

  const setSocial = (i: number, patch: Partial<AuthorSpotlightSocialLink>) => {
    const socialLinks = [...form.socialLinks];
    const prev = socialLinks[i];
    socialLinks[i] = { ...(prev || { label: '', url: '' }), ...patch };
    setForm({ ...form, socialLinks });
  };

  const addSocial = () => setForm({ ...form, socialLinks: [...form.socialLinks, { label: '', url: '' }] });
  const removeSocial = (i: number) =>
    setForm({ ...form, socialLinks: form.socialLinks.filter((_, idx) => idx !== i) });

  const setFeatured = (i: number, patch: Partial<AuthorSpotlightFeaturedBook>) => {
    const featuredBooks = [...form.featuredBooks];
    const prev = featuredBooks[i];
    featuredBooks[i] = {
      ...(prev || {
        title: '',
        coverImage: '',
        description: '',
        buyLink: '',
        goodreadsLink: '',
        blogReviewLink: '',
      }),
      ...patch,
    };
    setForm({ ...form, featuredBooks });
  };
  const addFeatured = () =>
    setForm({ ...form, featuredBooks: [...form.featuredBooks, { title: '', coverImage: '', description: '' }] });
  const removeFeatured = (i: number) =>
    setForm({ ...form, featuredBooks: form.featuredBooks.filter((_, idx) => idx !== i) });

  const setBlogLink = (i: number, patch: Partial<AuthorSpotlightBlogLink>) => {
    const blogLinks = [...form.blogLinks];
    const prev = blogLinks[i];
    blogLinks[i] = { ...(prev || { title: '', url: '' }), ...patch };
    setForm({ ...form, blogLinks });
  };
  const addBlogLink = () => setForm({ ...form, blogLinks: [...form.blogLinks, { title: '', url: '' }] });
  const removeBlogLink = (i: number) =>
    setForm({ ...form, blogLinks: form.blogLinks.filter((_, idx) => idx !== i) });

  const setPairing = (i: number, patch: Partial<AuthorSpotlightReadingPairing>) => {
    const readingPairings = [...form.readingPairings];
    const prev = readingPairings[i];
    readingPairings[i] = {
      ...(prev || {
        ifYouLiked: '',
        recommendedTitle: '',
        reason: '',
        internalUrl: '',
      }),
      ...patch,
    };
    setForm({ ...form, readingPairings });
  };
  const addPairing = () =>
    setForm({
      ...form,
      readingPairings: [...form.readingPairings, { ifYouLiked: '', recommendedTitle: '', reason: '' }],
    });
  const removePairing = (i: number) =>
    setForm({ ...form, readingPairings: form.readingPairings.filter((_, idx) => idx !== i) });

  const setFaq = (i: number, patch: Partial<AuthorSpotlightQaItem>) => {
    const faq = [...form.faq];
    const prev = faq[i];
    faq[i] = { ...(prev || { question: '', answer: '' }), ...patch };
    setForm({ ...form, faq });
  };
  const addFaq = () => setForm({ ...form, faq: [...form.faq, { question: '', answer: '' }] });
  const removeFaq = (i: number) => setForm({ ...form, faq: form.faq.filter((_, idx) => idx !== i) });

  const setInterview = (i: number, patch: Partial<AuthorSpotlightQaItem>) => {
    const interview = [...form.interview];
    const prev = interview[i];
    interview[i] = { ...(prev || { question: '', answer: '' }), ...patch };
    setForm({ ...form, interview });
  };
  const addInterview = () =>
    setForm({ ...form, interview: [...form.interview, { question: '', answer: '' }] });
  const removeInterview = (i: number) =>
    setForm({ ...form, interview: form.interview.filter((_, idx) => idx !== i) });

  if (loading && list.length === 0) {
    return <PageLoading message="Loading author spotlights…" />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-body text-sm">
          {error}
        </div>
      )}
      {notice && (
        <div
          className={`mb-4 p-4 rounded-lg font-body text-sm border ${
            notice.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {notice.text}
        </div>
      )}

      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown mb-2">Author spotlight</h1>
          <p className="font-body text-chai-brown-light">
            Create and publish author profiles. <strong>Shop buy links</strong> are on each featured book — Edit → Featured books → green{' '}
            <strong>&quot;Where to buy — Shop page&quot;</strong>. Public:{' '}
            <Link href="/author-spotlight" className="text-terracotta hover:underline">/author-spotlight</Link>,{' '}
            <Link href="/shop" className="text-terracotta hover:underline">/shop</Link>.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 bg-terracotta text-white px-4 py-2 rounded-lg hover:bg-terracotta/90 transition-colors font-body text-sm"
        >
          <Plus size={20} />
          New spotlight
        </button>
      </div>

      <div className="bg-white rounded-lg border border-chai-brown/10 shadow-sm overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cream/50">
              <tr>
                <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">Order</th>
                <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">Name</th>
                <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">Slug</th>
                <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">Published</th>
                <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">Shop</th>
                <th className="px-4 py-3 text-right font-body text-sm font-medium text-chai-brown">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((s, index) => (
                <tr key={s.id} className="border-t border-chai-brown/10">
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        aria-label="Move up"
                        disabled={index === 0 || saving}
                        onClick={() => move(index, -1)}
                        className="p-1 rounded border border-chai-brown/20 disabled:opacity-30"
                      >
                        <ChevronUp size={18} />
                      </button>
                      <button
                        type="button"
                        aria-label="Move down"
                        disabled={index === list.length - 1 || saving}
                        onClick={() => move(index, 1)}
                        className="p-1 rounded border border-chai-brown/20 disabled:opacity-30"
                      >
                        <ChevronDown size={18} />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-body text-chai-brown">{s.name}</td>
                  <td className="px-4 py-3 font-body text-sm text-chai-brown-light">{s.slug}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => togglePublish(s)}
                      className={`inline-flex items-center gap-1 text-sm font-body px-2 py-1 rounded ${
                        s.isPublished ? 'bg-emerald-50 text-emerald-800' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {s.isPublished ? <Eye size={16} /> : <EyeOff size={16} />}
                      {s.isPublished ? 'Live' : 'Draft'}
                    </button>
                    <AdminSubscribersEmailedBadge item={s} />
                  </td>
                  <td className="px-4 py-3 font-body text-sm">
                    {(() => {
                      const n = (s.featuredBooks ?? []).filter((b) =>
                        hasShopLinks(normalizeShopLinks(b.shopLinks, b.buyLink))
                      ).length;
                      return n > 0 ? (
                        <Link href={shopPath('author-spotlight', s.slug)} target="_blank" rel="noopener noreferrer" className="text-sage font-medium hover:underline">
                          {n} book{n === 1 ? '' : 's'}
                        </Link>
                      ) : (
                        <span className="text-chai-brown-light">—</span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/author-spotlight/${encodeURIComponent(s.slug)}`}
                      target="_blank"
                      className="inline-block text-sm text-terracotta hover:underline font-body p-2"
                    >
                      View
                    </Link>
                    <button
                      type="button"
                      onClick={() => openEdit(s)}
                      className="inline-flex items-center gap-1 text-sm text-chai-brown hover:text-terracotta font-body"
                    >
                      <Edit size={16} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(s.id)}
                      className="inline-flex items-center gap-1 text-sm text-red-600 hover:underline font-body p-2"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && (
            <p className="p-8 text-center font-body text-chai-brown-light">No spotlights yet. Create one to get started.</p>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 shadow-xl">
            <h2 className="font-serif text-2xl text-chai-brown mb-4">
              {editingId ? 'Edit spotlight' : 'New spotlight'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {Object.keys(fieldErrors).length > 0 && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 font-body text-sm text-red-800"
                >
                  Please fix the highlighted required fields before saving. Nothing was sent to the server yet.
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-sm font-medium text-chai-brown mb-1" htmlFor="as-name">
                    Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="as-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFieldErrors((fe) => ({ ...fe, name: undefined }));
                      setForm((f) => ({
                        ...f,
                        name,
                        slug: editingId ? f.slug : slugFromName(name),
                      }));
                    }}
                    autoComplete="off"
                    aria-invalid={Boolean(fieldErrors.name)}
                    aria-describedby={fieldErrors.name ? 'as-name-err' : undefined}
                    className={`w-full px-3 py-2 border rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-terracotta ${
                      fieldErrors.name ? 'border-red-400 ring-1 ring-red-100' : 'border-chai-brown/20'
                    }`}
                  />
                  {fieldErrors.name ? (
                    <p id="as-name-err" className="mt-1 text-sm text-red-600">
                      {fieldErrors.name}
                    </p>
                  ) : null}
                </div>
                <div>
                  <label className="block font-body text-sm font-medium text-chai-brown mb-1" htmlFor="as-slug">
                    URL slug <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="as-slug"
                    type="text"
                    value={form.slug}
                    onChange={(e) => {
                      setFieldErrors((fe) => ({ ...fe, slug: undefined }));
                      setForm({ ...form, slug: e.target.value });
                    }}
                    autoComplete="off"
                    aria-invalid={Boolean(fieldErrors.slug)}
                    aria-describedby={fieldErrors.slug ? 'as-slug-err' : undefined}
                    placeholder="e.g. priya-sharma"
                    className={`w-full px-3 py-2 border rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-terracotta ${
                      fieldErrors.slug ? 'border-red-400 ring-1 ring-red-100' : 'border-chai-brown/20'
                    }`}
                  />
                  {fieldErrors.slug ? (
                    <p id="as-slug-err" className="mt-1 text-sm text-red-600">
                      {fieldErrors.slug}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-chai-brown-light">
                      Lowercase letters, numbers, and hyphens. Filled from name when you create a new spotlight.
                    </p>
                  )}
                </div>
              </div>

              <ImageUploadField
                module="author-spotlight"
                id="as-cover"
                label={
                  <span className="font-body text-sm font-medium text-chai-brown">
                    Cover image (listing cards)
                  </span>
                }
                validationMessage={fieldErrors.coverImage}
                value={form.coverImage ?? ''}
                onChange={(url) => {
                  setFieldErrors((fe) => ({ ...fe, coverImage: undefined }));
                  setForm({ ...form, coverImage: url });
                }}
              />
              <p className="-mt-2 text-xs text-chai-brown-light">
                Used on listing cards. If empty, the author photo is used instead.
              </p>

              <ImageUploadField
                module="author-spotlight"
                id="as-profile"
                label={
                  <span className="font-body text-sm font-medium text-chai-brown">
                    Author photo (detail page) <span className="text-red-600">*</span>
                  </span>
                }
                validationMessage={fieldErrors.profileImage}
                value={form.profileImage}
                onChange={(url) => {
                  setFieldErrors((fe) => ({ ...fe, profileImage: undefined }));
                  setForm({ ...form, profileImage: url });
                }}
              />

              <div>
                <label className="block font-body text-sm font-medium text-chai-brown mb-1">Tagline</label>
                <input
                  type="text"
                  value={form.tagline}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                  className="w-full px-3 py-2 border border-chai-brown/20 rounded-lg font-body text-sm"
                />
              </div>

              <div>
                <label className="block font-body text-sm font-medium text-chai-brown mb-1">
                  Introduction
                </label>
                <textarea
                  value={form.introduction ?? ''}
                  onChange={(e) => setForm({ ...form, introduction: e.target.value })}
                  rows={5}
                  placeholder="Hook for About the author. HTML allowed (e.g. <p>, <em>, <a href=&quot;...&quot;>)."
                  className="w-full px-3 py-2 border border-chai-brown/20 rounded-lg font-body text-sm font-mono"
                />
                <p className="mt-1 text-xs text-chai-brown-light">
                  Shown in About the author only — not repeated in Quick facts.
                </p>
              </div>

              <div>
                <label className="block font-body text-sm font-medium text-chai-brown mb-1">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={5}
                  placeholder="Full biography. HTML allowed."
                  className="w-full px-3 py-2 border border-chai-brown/20 rounded-lg font-body text-sm font-mono"
                />
              </div>

              <AdminGenresField
                value={form.genres}
                onChange={(genres) => setForm({ ...form, genres })}
                label="Genres"
                hint="Primary genre(s) for discovery and author spotlight cards."
              />

              <AdminAuthorConnectFields
                value={form.connectLinks ?? {}}
                onChange={(connectLinks) => setForm({ ...form, connectLinks })}
              />

              <fieldset className="border border-chai-brown/15 rounded-lg p-4">
                <legend className="font-body text-sm font-medium text-chai-brown px-1">Extra social links (legacy)</legend>
                <p className="text-xs text-chai-brown-light mb-2 -mt-1">Prefer Connect fields above. These merge if not duplicated.</p>
                {form.socialLinks.map((row, i) => (
                  <div key={i} className="flex flex-wrap gap-2 mb-2">
                    <input
                      placeholder="Label"
                      value={row.label}
                      onChange={(e) => setSocial(i, { label: e.target.value })}
                      className="flex-1 min-w-[8rem] px-3 py-2 border border-chai-brown/20 rounded-lg text-sm"
                    />
                    <input
                      placeholder="URL"
                      value={row.url}
                      onChange={(e) => setSocial(i, { url: e.target.value })}
                      className="flex-[2] min-w-[12rem] px-3 py-2 border border-chai-brown/20 rounded-lg text-sm"
                    />
                    <button type="button" onClick={() => removeSocial(i)} className="text-red-600 text-sm px-2">
                      Remove
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addSocial} className="text-sm text-terracotta font-body mt-1">
                  + Add link
                </button>
              </fieldset>

              <fieldset className="border border-chai-brown/15 rounded-lg p-4">
                <legend className="font-body text-sm font-medium text-chai-brown px-1">Books by this author</legend>
                {form.featuredBooks.map((b, i) => (
                  <div key={i} className="mb-4 p-3 bg-cream/40 rounded-lg space-y-2">
                    <input
                      placeholder="Title *"
                      value={b.title}
                      onChange={(e) => setFeatured(i, { title: e.target.value })}
                      className="w-full px-3 py-2 border border-chai-brown/20 rounded-lg text-sm"
                    />
                    <ImageUploadField
                      module="author-spotlight"
                      label="Cover"
                      value={b.coverImage ?? ''}
                      onChange={(url) => setFeatured(i, { coverImage: url })}
                    />
                    <textarea
                      placeholder="Description"
                      value={b.description ?? ''}
                      onChange={(e) => setFeatured(i, { description: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-chai-brown/20 rounded-lg text-sm"
                    />
                    <div className="grid sm:grid-cols-3 gap-2">
                      <input
                        placeholder="Blog review URL"
                        value={b.blogReviewLink ?? ''}
                        onChange={(e) => setFeatured(i, { blogReviewLink: e.target.value })}
                        className="px-3 py-2 border border-chai-brown/20 rounded-lg text-sm"
                      />
                      <input
                        placeholder="Goodreads URL"
                        value={b.goodreadsLink ?? ''}
                        onChange={(e) => setFeatured(i, { goodreadsLink: e.target.value })}
                        className="px-3 py-2 border border-chai-brown/20 rounded-lg text-sm"
                      />
                    </div>
                    <AdminShopLinksSection
                      className="mt-3"
                      value={(b.shopLinks ?? []) as ShopLink[]}
                      onChange={(shopLinks) => setFeatured(i, { shopLinks, buyLink: '' })}
                      shopBook={b.shopBook}
                      onShopBookChange={(shopBook) => setFeatured(i, { shopBook })}
                      inheritHint={{
                        title: b.title,
                        coverImage: b.coverImage,
                      }}
                      shopPageHref={form.slug?.trim() ? `${shopPath('author-spotlight', form.slug)}#book-${i}` : undefined}
                    />
                    <button type="button" onClick={() => removeFeatured(i)} className="text-sm text-red-600">
                      Remove book
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addFeatured} className="text-sm text-terracotta font-body">
                  + Add book
                </button>
              </fieldset>

              <fieldset className="border border-chai-brown/15 rounded-lg p-4">
                <legend className="font-body text-sm font-medium text-chai-brown px-1">
                  Featured on Chapters.Aur.Chai
                </legend>
                <p className="font-body text-xs text-chai-brown-light mb-3 -mt-1">
                  Links to reviews, recommendations, or musings — grouped automatically on the public page.
                </p>
                {form.blogLinks.map((row, i) => (
                  <div key={i} className="mb-4 p-3 bg-cream/40 rounded-lg space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <input
                        placeholder="Title (optional — auto-filled from preview)"
                        value={row.title}
                        onChange={(e) => setBlogLink(i, { title: e.target.value })}
                        className="flex-1 min-w-[8rem] px-3 py-2 border border-chai-brown/20 rounded-lg text-sm"
                      />
                      <input
                        placeholder="/blog/your-post-slug"
                        value={row.url}
                        onChange={(e) => setBlogLink(i, { url: e.target.value })}
                        className="flex-[2] min-w-[12rem] px-3 py-2 border border-chai-brown/20 rounded-lg text-sm"
                      />
                      <button type="button" onClick={() => removeBlogLink(i)} className="text-red-600 text-sm px-2">
                        Remove
                      </button>
                    </div>
                    <BlogSiteLinkPreviewField
                      url={row.url}
                      title={row.title}
                      onTitleChange={(t) => setBlogLink(i, { title: t })}
                    />
                  </div>
                ))}
                <button type="button" onClick={addBlogLink} className="text-sm text-terracotta font-body">
                  + Add link
                </button>
              </fieldset>

              <fieldset className="border border-chai-brown/15 rounded-lg p-4">
                <legend className="font-body text-sm font-medium text-chai-brown px-1">Reading pairings</legend>
                {form.readingPairings.map((row, i) => (
                  <div key={i} className="mb-3 p-3 bg-cream/40 rounded-lg space-y-2">
                    <input
                      placeholder="If you liked…"
                      value={row.ifYouLiked}
                      onChange={(e) => setPairing(i, { ifYouLiked: e.target.value })}
                      className="w-full px-3 py-2 border border-chai-brown/20 rounded-lg text-sm"
                    />
                    <input
                      placeholder="Recommended title"
                      value={row.recommendedTitle}
                      onChange={(e) => setPairing(i, { recommendedTitle: e.target.value })}
                      className="w-full px-3 py-2 border border-chai-brown/20 rounded-lg text-sm"
                    />
                    <textarea
                      placeholder="Reason"
                      value={row.reason}
                      onChange={(e) => setPairing(i, { reason: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-chai-brown/20 rounded-lg text-sm"
                    />
                    <input
                      placeholder="Internal URL (optional)"
                      value={row.internalUrl ?? ''}
                      onChange={(e) => setPairing(i, { internalUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-chai-brown/20 rounded-lg text-sm"
                    />
                    <button type="button" onClick={() => removePairing(i)} className="text-sm text-red-600">
                      Remove
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addPairing} className="text-sm text-terracotta font-body">
                  + Add pairing
                </button>
              </fieldset>

              <fieldset className="border border-chai-brown/15 rounded-lg p-4">
                <legend className="font-body text-sm font-medium text-chai-brown px-1">FAQ</legend>
                {form.faq.map((row, i) => (
                  <div key={i} className="mb-3 space-y-2">
                    <input
                      placeholder="Question"
                      value={row.question}
                      onChange={(e) => setFaq(i, { question: e.target.value })}
                      className="w-full px-3 py-2 border border-chai-brown/20 rounded-lg text-sm"
                    />
                    <textarea
                      placeholder="Answer"
                      value={row.answer}
                      onChange={(e) => setFaq(i, { answer: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-chai-brown/20 rounded-lg text-sm"
                    />
                    <button type="button" onClick={() => removeFaq(i)} className="text-sm text-red-600">
                      Remove
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addFaq} className="text-sm text-terracotta font-body">
                  + Add FAQ
                </button>
              </fieldset>

              <div>
                <label className="block font-body text-sm font-medium text-chai-brown mb-1">
                  Interview section title
                </label>
                <input
                  type="text"
                  value={form.interviewSectionTitle ?? 'Interview'}
                  onChange={(e) => setForm({ ...form, interviewSectionTitle: e.target.value })}
                  className="w-full px-3 py-2 border border-chai-brown/20 rounded-lg font-body text-sm"
                />
              </div>

              <fieldset className="border border-chai-brown/15 rounded-lg p-4">
                <legend className="font-body text-sm font-medium text-chai-brown px-1">Interview</legend>
                {form.interview.map((row, i) => (
                  <div key={i} className="mb-3 space-y-2">
                    <input
                      placeholder="What you asked (conversational — no need to number)"
                      value={row.question}
                      onChange={(e) => setInterview(i, { question: e.target.value })}
                      className="w-full px-3 py-2 border border-chai-brown/20 rounded-lg text-sm"
                    />
                    <textarea
                      placeholder="Author’s reply (HTML allowed)"
                      value={row.answer}
                      onChange={(e) => setInterview(i, { answer: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-chai-brown/20 rounded-lg text-sm font-mono"
                    />
                    <button type="button" onClick={() => removeInterview(i)} className="text-sm text-red-600">
                      Remove
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addInterview} className="text-sm text-terracotta font-body">
                  + Add exchange
                </button>
              </fieldset>

              <AdminSpotlightEditorialFields
                value={form}
                authorName={form.name}
                onChange={(editorial) => setForm({ ...form, ...editorial })}
              />

              <AdminUniversalSeoFields
                imageModule="author-spotlight"
                value={form}
                onChange={(seo) => setForm({ ...form, ...seo })}
              />

              <p className="font-body text-xs text-chai-brown-light">
                Publishing is controlled from the list (Live / Draft). New entries are created as drafts unless you
                publish from the table after saving.
              </p>

              <div className="flex gap-3 pt-2 sticky bottom-0 bg-white pb-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-terracotta text-white py-2 rounded-lg hover:bg-terracotta/90 font-body disabled:opacity-50"
                >
                  {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create'}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className="flex-1 bg-gray-200 text-chai-brown py-2 rounded-lg hover:bg-gray-300 font-body"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
