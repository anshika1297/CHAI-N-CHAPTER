'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, Save } from 'lucide-react';

interface BookClub {
  id: string;
  name: string;
  description: string;
  platform: 'instagram' | 'whatsapp' | 'other';
  joinLink: string;
  members: string;
  focus: string;
}

export default function AdminBookClubsPage() {
  const [bookClubs, setBookClubs] = useState<BookClub[]>([
    {
      id: '1',
      name: 'The Chai Circle',
      description: 'A cozy community for slow readers who love to discuss books over virtual chai sessions.',
      platform: 'instagram',
      joinLink: 'https://instagram.com/chainchapter',
      members: '500+',
      focus: 'Fiction & Literary',
    },
    {
      id: '2',
      name: 'Desi Readers Club',
      description: 'Celebrating South Asian literature and authors. Monthly reads featuring diverse voices.',
      platform: 'whatsapp',
      joinLink: 'https://wa.me/1234567890',
      members: '300+',
      focus: 'Indian Literature',
    },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [editingClub, setEditingClub] = useState<BookClub | null>(null);
  const [formData, setFormData] = useState<Omit<BookClub, 'id'>>({
    name: '',
    description: '',
    platform: 'instagram',
    joinLink: '',
    members: '',
    focus: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClub) {
      setBookClubs(bookClubs.map(c => 
        c.id === editingClub.id 
          ? { ...formData, id: editingClub.id }
          : c
      ));
    } else {
      const newClub: BookClub = {
        ...formData,
        id: Date.now().toString(),
      };
      setBookClubs([...bookClubs, newClub]);
    }
    setFormData({ name: '', description: '', platform: 'instagram', joinLink: '', members: '', focus: '' });
    setShowForm(false);
    setEditingClub(null);
  };

  const handleEdit = (club: BookClub) => {
    setEditingClub(club);
    setFormData({
      name: club.name,
      description: club.description,
      platform: club.platform,
      joinLink: club.joinLink,
      members: club.members,
      focus: club.focus,
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this book club?')) {
      setBookClubs(bookClubs.filter(c => c.id !== id));
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown mb-2">
            Manage Book Clubs
          </h1>
          <p className="font-body text-chai-brown-light">
            Add, edit, or remove book clubs
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingClub(null);
            setFormData({ name: '', description: '', platform: 'instagram', joinLink: '', members: '', focus: '' });
          }}
          className="flex items-center gap-2 bg-terracotta text-white px-4 py-2 rounded-lg hover:bg-terracotta/90 transition-colors font-body text-sm"
        >
          <Plus size={20} />
          Add Book Club
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="font-serif text-2xl text-chai-brown mb-4">
              {editingClub ? 'Edit Book Club' : 'Add Book Club'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  required
                  rows={3}
                  className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                    Platform
                  </label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value as BookClub['platform'] })}
                    className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                  >
                    <option value="instagram">Instagram</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                    Members Count
                  </label>
                  <input
                    type="text"
                    value={formData.members}
                    onChange={(e) => setFormData({ ...formData, members: e.target.value })}
                    placeholder="500+"
                    className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                  />
                </div>
              </div>
              <div>
                <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                  Join Link
                </label>
                <input
                  type="url"
                  value={formData.joinLink}
                  onChange={(e) => setFormData({ ...formData, joinLink: e.target.value })}
                  required
                  placeholder="https://..."
                  className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                />
              </div>
              <div>
                <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                  Focus/Theme
                </label>
                <input
                  type="text"
                  value={formData.focus}
                  onChange={(e) => setFormData({ ...formData, focus: e.target.value })}
                  placeholder="Fiction & Literary"
                  className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-terracotta text-white py-2 rounded-lg hover:bg-terracotta/90 transition-colors font-body"
                >
                  {editingClub ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingClub(null);
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

      {/* Book Clubs List */}
      <div className="bg-white rounded-lg border border-chai-brown/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cream">
              <tr>
                <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">
                  Platform
                </th>
                <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">
                  Members
                </th>
                <th className="px-4 py-3 text-left font-body text-sm font-medium text-chai-brown">
                  Focus
                </th>
                <th className="px-4 py-3 text-right font-body text-sm font-medium text-chai-brown">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-chai-brown/10">
              {bookClubs.map((club) => (
                <tr key={club.id} className="hover:bg-cream/50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-body font-medium text-chai-brown">{club.name}</p>
                      <p className="font-body text-sm text-chai-brown-light line-clamp-1">
                        {club.description}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-body text-chai-brown-light capitalize">
                    {club.platform}
                  </td>
                  <td className="px-4 py-3 font-body text-chai-brown-light">
                    {club.members}
                  </td>
                  <td className="px-4 py-3 font-body text-chai-brown-light">
                    {club.focus}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(club)}
                        className="p-2 text-terracotta hover:bg-terracotta/10 rounded transition-colors"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(club.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
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
      </div>
    </div>
  );
}
