'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  type: 'blog' | 'recommendations' | 'musings';
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([
    { id: '1', name: 'Fiction', slug: 'fiction', description: 'Fictional stories and novels', type: 'blog' },
    { id: '2', name: 'Non-Fiction', slug: 'non-fiction', description: 'Non-fiction books and memoirs', type: 'blog' },
    { id: '3', name: 'Monthly Wrap-ups', slug: 'monthly-wrapups', description: 'Monthly reading summaries', type: 'recommendations' },
    { id: '4', name: 'Short Stories', slug: 'short-stories', description: 'Short story collections', type: 'musings' },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<Omit<Category, 'id'>>({
    name: '',
    slug: '',
    description: '',
    type: 'blog',
  });

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
    if (editingCategory) {
      setCategories(categories.map(c => 
        c.id === editingCategory.id 
          ? { ...formData, id: editingCategory.id }
          : c
      ));
    } else {
      const newCategory: Category = {
        ...formData,
        id: Date.now().toString(),
      };
      setCategories([...categories, newCategory]);
    }
    setFormData({ name: '', slug: '', description: '', type: 'blog' });
    setShowForm(false);
    setEditingCategory(null);
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
    if (confirm('Are you sure you want to delete this category?')) {
      setCategories(categories.filter(c => c.id !== id));
    }
  };

  const categoriesByType = {
    blog: categories.filter(c => c.type === 'blog'),
    recommendations: categories.filter(c => c.type === 'recommendations'),
    musings: categories.filter(c => c.type === 'musings'),
  };

  return (
    <div className="max-w-7xl mx-auto">
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
                  className="flex-1 bg-terracotta text-white py-2 rounded-lg hover:bg-terracotta/90 transition-colors font-body"
                >
                  {editingCategory ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingCategory(null);
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
