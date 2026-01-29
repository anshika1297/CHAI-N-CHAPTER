'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { getAdminCategories, createCategory, updateCategory, deleteCategory, type CategoryDto, type CategoryType } from '@/lib/api';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  type: 'blog' | 'recommendations' | 'musings';
}

function toCategory(c: CategoryDto): Category {
  return {
    id: c._id,
    name: c.name,
    slug: c.slug,
    description: c.description ?? '',
    type: c.type,
  };
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<Omit<Category, 'id'>>({
    name: '',
    slug: '',
    description: '',
    type: 'blog',
  });

  const fetchCategories = useCallback(() => {
    setLoading(true);
    getAdminCategories()
      .then(({ categories: list }) => {
        setCategories(list.map(toCategory));
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load categories'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const payload = {
      name: formData.name.trim(),
      slug: formData.slug.trim() || generateSlug(formData.name),
      description: formData.description.trim(),
      type: formData.type as CategoryType,
    };
    (editingCategory
      ? updateCategory(editingCategory.id, payload)
      : createCategory(payload)
    )
      .then(() => {
        setFormData({ name: '', slug: '', description: '', type: 'blog' });
        setShowForm(false);
        setEditingCategory(null);
        fetchCategories();
      })
      .catch((e) => {
        const msg = e instanceof Error ? e.message : 'Failed to save category';
        setError(msg.includes('Unauthorized') || msg.includes('Not logged in') ? `${msg} Please log in again.` : msg);
      })
      .finally(() => setSaving(false));
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description,
      type: category.type,
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    deleteCategory(id)
      .then(() => fetchCategories())
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to delete category'));
  };

  const categoriesByType = {
    blog: categories.filter(c => c.type === 'blog'),
    recommendations: categories.filter(c => c.type === 'recommendations'),
    musings: categories.filter(c => c.type === 'musings'),
  };

  if (loading && categories.length === 0) {
    return (
      <div className="max-w-7xl mx-auto py-8">
        <p className="font-body text-chai-brown-light">Loading categories…</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-body text-sm">
          {error}
        </div>
      )}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown mb-2">
            Manage Categories
          </h1>
          <p className="font-body text-chai-brown-light">
            Organize content by categories for different blog types
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingCategory(null);
            setFormData({ name: '', slug: '', description: '', type: 'blog' });
          }}
          className="flex items-center gap-2 bg-terracotta text-white px-4 py-2 rounded-lg hover:bg-terracotta/90 transition-colors font-body text-sm"
        >
          <Plus size={20} />
          Add Category
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="font-serif text-2xl text-chai-brown mb-4">
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                  Category Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Category['type'] })}
                  className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                >
                  <option value="blog">Book Reviews</option>
                  <option value="recommendations">Book Recommendations</option>
                  <option value="musings">Her Musings Verse</option>
                </select>
              </div>
              <div>
                <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                />
              </div>
              <div>
                <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                  Slug
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                />
              </div>
              <div>
                <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-terracotta text-white py-2 rounded-lg hover:bg-terracotta/90 transition-colors font-body disabled:opacity-50"
                >
                  {saving ? 'Saving…' : (editingCategory ? 'Update' : 'Create')}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setShowForm(false);
                    setEditingCategory(null);
                  }}
                  className="flex-1 bg-gray-200 text-chai-brown py-2 rounded-lg hover:bg-gray-300 transition-colors font-body disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories by Type */}
      <div className="space-y-6">
        {/* Book Reviews Categories */}
        <div className="bg-white rounded-lg border border-chai-brown/10 shadow-sm overflow-hidden">
          <div className="bg-cream px-4 py-3 border-b border-chai-brown/10">
            <h2 className="font-serif text-xl text-chai-brown">Book Reviews Categories</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream/50">
                <tr>
                  <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">Name</th>
                  <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">Slug</th>
                  <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">Description</th>
                  <th className="px-4 py-3 text-right font-body text-sm font-medium text-chai-brown">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-chai-brown/10">
                {categoriesByType.blog.map((category) => (
                  <tr key={category.id} className="hover:bg-cream/50">
                    <td className="px-4 py-3 font-body text-chai-brown">{category.name}</td>
                    <td className="px-4 py-3 font-body text-chai-brown-light text-sm">{category.slug}</td>
                    <td className="px-4 py-3 font-body text-chai-brown-light text-sm">{category.description}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(category)} className="p-2 text-terracotta hover:bg-terracotta/10 rounded">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => handleDelete(category.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recommendations Categories */}
        <div className="bg-white rounded-lg border border-chai-brown/10 shadow-sm overflow-hidden">
          <div className="bg-cream px-4 py-3 border-b border-chai-brown/10">
            <h2 className="font-serif text-xl text-chai-brown">Book Recommendations Categories</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream/50">
                <tr>
                  <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">Name</th>
                  <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">Slug</th>
                  <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">Description</th>
                  <th className="px-4 py-3 text-right font-body text-sm font-medium text-chai-brown">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-chai-brown/10">
                {categoriesByType.recommendations.map((category) => (
                  <tr key={category.id} className="hover:bg-cream/50">
                    <td className="px-4 py-3 font-body text-chai-brown">{category.name}</td>
                    <td className="px-4 py-3 font-body text-chai-brown-light text-sm">{category.slug}</td>
                    <td className="px-4 py-3 font-body text-chai-brown-light text-sm">{category.description}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(category)} className="p-2 text-terracotta hover:bg-terracotta/10 rounded">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => handleDelete(category.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Musings Categories */}
        <div className="bg-white rounded-lg border border-chai-brown/10 shadow-sm overflow-hidden">
          <div className="bg-cream px-4 py-3 border-b border-chai-brown/10">
            <h2 className="font-serif text-xl text-chai-brown">Her Musings Verse Categories</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream/50">
                <tr>
                  <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">Name</th>
                  <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">Slug</th>
                  <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">Description</th>
                  <th className="px-4 py-3 text-right font-body text-sm font-medium text-chai-brown">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-chai-brown/10">
                {categoriesByType.musings.map((category) => (
                  <tr key={category.id} className="hover:bg-cream/50">
                    <td className="px-4 py-3 font-body text-chai-brown">{category.name}</td>
                    <td className="px-4 py-3 font-body text-chai-brown-light text-sm">{category.slug}</td>
                    <td className="px-4 py-3 font-body text-chai-brown-light text-sm">{category.description}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(category)} className="p-2 text-terracotta hover:bg-terracotta/10 rounded">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => handleDelete(category.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
