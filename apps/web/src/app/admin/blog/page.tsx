'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';

export interface BlogHighlight {
  id: string;
  quote: string;
  page?: number;
  image?: string;
}

export interface BlogPost {
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
  publishedAt: string;
  highlights?: BlogHighlight[];
  /** SEO keywords for this post; merged with site-wide keywords in meta. */
  seoKeywords?: string[];
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

const defaultPosts: BlogPost[] = [
  {
    id: '1',
    title: 'The Art of Slow Living: Finding Peace in Pages',
    slug: 'art-of-slow-living',
    excerpt:
      'A beautiful meditation on slowing down and finding joy in the simple act of reading. This book changed how I approach my daily routine and taught me the value of mindful reading...',
    content: '<p>In a world that moves at breakneck speed...</p>',
    image: '',
    category: 'Book Review',
    readingTime: 5,
    author: 'Anshika Mishra',
    bookTitle: 'The Art of Slow Living',
    bookAuthor: 'Marie Kondo',
    publishedAt: '2024-01-15',
    highlights: [
      { id: '1', quote: "Reading isn't just about consuming words, but about creating space for reflection and connection.", page: 45, image: '' },
      { id: '2', quote: "Slow living isn't about doing less, but about doing things with intention and presence.", page: 120, image: '' },
    ],
    seoKeywords: ['slow living', 'mindfulness', 'Marie Kondo', 'self-help', 'mindful reading', 'The Art of Slow Living'],
  },
  {
    id: '2',
    title: 'Finding Hygge in Hardcover: Winter Reads',
    slug: 'finding-hygge-winter-reads',
    excerpt:
      "As the winter settles in, there's nothing quite like curling up with a warm cup of chai and these cozy reads that feel like a warm hug...",
    content: '<p>As the winter settles in...</p>',
    image: '',
    category: 'Book Review',
    readingTime: 7,
    author: 'Anshika Mishra',
    bookTitle: 'The Little Book of Hygge',
    bookAuthor: '',
    publishedAt: '2024-01-10',
  },
  {
    id: '3',
    title: 'Stories That Stayed: My All-Time Favorites',
    slug: 'stories-that-stayed',
    excerpt:
      'Some books leave an imprint on your soul. Here are the stories that I carry with me, the ones that shaped my reading journey...',
    content: '<p>Some books leave an imprint...</p>',
    image: '',
    category: 'Reflection',
    readingTime: 6,
    author: 'Anshika Mishra',
    bookTitle: 'Various',
    bookAuthor: '',
    publishedAt: '2024-01-05',
  },
  {
    id: '4',
    title: 'A Journey Through Indian Literature',
    slug: 'journey-indian-literature',
    excerpt:
      'Exploring the rich tapestry of Indian storytelling, from ancient epics to contemporary voices that speak to our modern hearts...',
    content: '<p>Exploring the rich tapestry...</p>',
    image: '',
    category: 'Book Review',
    readingTime: 8,
    author: 'Anshika Mishra',
    bookTitle: 'The God of Small Things',
    bookAuthor: 'Arundhati Roy',
    publishedAt: '2023-12-28',
  },
];

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
  publishedAt: new Date().toISOString().slice(0, 10),
  highlights: [],
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

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>(defaultPosts);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState<Omit<BlogPost, 'id'>>(emptyForm);

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: editingPost ? formData.slug : generateSlug(title),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPost) {
      setPosts(
        posts.map((p) =>
          p.id === editingPost.id ? { ...formData, id: editingPost.id } : p
        )
      );
    } else {
      const newPost: BlogPost = {
        ...formData,
        id: Date.now().toString(),
      };
      setPosts([...posts, newPost]);
    }
    setFormData(emptyForm);
    setShowForm(false);
    setEditingPost(null);
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
      publishedAt: post.publishedAt,
      highlights: post.highlights ?? [],
      seoKeywords: post.seoKeywords ?? [],
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this post? This cannot be undone.')) {
      setPosts(posts.filter((p) => p.id !== id));
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

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown mb-2">
            Manage Book Reviews
          </h1>
          <p className="font-body text-chai-brown-light">
            Create, edit, and publish blog posts
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-terracotta text-white px-4 py-2 rounded-lg hover:bg-terracotta/90 transition-colors font-body text-sm"
        >
          <Plus size={20} />
          Add Post
        </button>
      </div>

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
                  <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                    Featured Image URL
                  </label>
                  <p className="text-xs text-chai-brown-light mb-1">Use any public URL (Imgur, imgbb, etc.) or a path like /images/blog/… if the file is in <code className="bg-cream px-1 rounded">public/images/</code>. No cloud storage needed.</p>
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://... or /images/..."
                    className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
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

              {/* SEO / Meta keywords */}
              <div>
                <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                  SEO / Meta keywords
                </label>
                <p className="text-xs text-chai-brown-light mb-2">
                  One per line or comma-separated. Merged with site-wide keywords (book blogger, book critic, etc.) on the blog page meta. When you have an API, these will drive the live meta automatically; until then, add this slug and keywords to <code className="bg-cream px-1 rounded text-[11px]">lib/content.ts</code> so the published page uses them.
                </p>
                <textarea
                  value={formatKeywordsForInput(formData.seoKeywords ?? [])}
                  onChange={(e) =>
                    setFormData({ ...formData, seoKeywords: parseKeywordsInput(e.target.value) })
                  }
                  rows={3}
                  placeholder="e.g. slow living, mindfulness, Marie Kondo (one per line or comma-separated)"
                  className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body text-sm"
                />
              </div>

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
                  Optional. Shown as “Favorite Quotes & Highlights” on the post. Use any image URL or path like /images/…
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
                      <input
                        type="text"
                        value={h.image ?? ''}
                        onChange={(e) => {
                          const next = [...(formData.highlights ?? [])];
                          next[idx] = { ...h, image: e.target.value || undefined };
                          setFormData({ ...formData, highlights: next });
                        }}
                        placeholder="Image URL (optional)"
                        className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body text-sm"
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
                  Published
                </th>
                <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">
                  Read
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
              {posts.map((post) => (
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
                    {formatDate(post.publishedAt)}
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-chai-brown-light">
                    {post.readingTime} min
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-chai-brown-light" title={(post.seoKeywords ?? []).join(', ') || 'No custom keywords'}>
                    {(post.seoKeywords ?? []).length ? (
                      <span className="text-terracotta">{(post.seoKeywords ?? []).length}</span>
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
              ))}
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
