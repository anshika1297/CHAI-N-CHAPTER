'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save } from 'lucide-react';
import { getBookClubs, putBookClubs } from '@/lib/api';
import PageLoading from '@/components/PageLoading';

interface BookClub {
  id: string;
  name: string;
  description: string;
  platform: 'instagram' | 'whatsapp' | 'other';
  joinLink: string;
  members: string;
  focus: string;
}

const defaultClubs: BookClub[] = [
  { id: '1', name: 'The Chai Circle', description: 'A cozy community for slow readers who love to discuss books over virtual chai sessions.', platform: 'instagram', joinLink: 'https://instagram.com/chaptersaurchai', members: '500+', focus: 'Fiction & Literary' },
  { id: '2', name: 'Desi Readers Club', description: 'Celebrating South Asian literature and authors. Monthly reads featuring diverse voices.', platform: 'whatsapp', joinLink: 'https://wa.me/1234567890', members: '300+', focus: 'Indian Literature' },
];

const sectionPageDefaults = {
  sectionTitle: 'Book Clubs',
  sectionSubtitle: 'Join our reading communities',
  sectionIntro: "Find your tribe! Join one of our book clubs and connect with fellow readers who share your love for stories.",
  sectionCtaText: 'Explore All Book Clubs',
  sectionCtaHref: '/book-clubs',
  pageTitle: 'Book Clubs',
  pageSubtitle: 'Join our community of passionate readers',
  pageIntro: "Connect with fellow book lovers, share your thoughts, and discover new stories together. Each club has its own unique theme and vibe. Find your perfect reading community!",
  pageCtaText: "Don't see a club that matches your interests?",
  pageCtaHref: '/contact',
  pageCtaLabel: 'Suggest a New Book Club',
};

function toFormClub(x: Record<string, unknown>): BookClub | null {
  if (typeof x?.name !== 'string' || typeof x?.description !== 'string') return null;
  const memberCount = typeof x.memberCount === 'number' ? x.memberCount : (typeof x.memberCount === 'string' ? parseInt(String(x.memberCount), 10) : 0);
  const joinLinkVal = x.joinLink;
  const joinLink = typeof joinLinkVal === 'string' && joinLinkVal.trim() ? joinLinkVal.trim() : '';
  const membersVal = x.members;
  const members = typeof membersVal === 'string' ? membersVal : (memberCount ? String(memberCount) + '+' : '');
  const themeOrFocus = typeof x.theme === 'string' ? String(x.theme).trim() : (typeof x.focus === 'string' ? String(x.focus).trim() : '');
  const platform = (['instagram', 'whatsapp', 'other'].includes(String(x.platform || '').toLowerCase()) ? (x.platform as BookClub['platform']) : 'instagram') as BookClub['platform'];
  const out: BookClub = {
    id: String(x.id ?? x.name),
    name: String(x.name).trim(),
    description: String(x.description).trim(),
    platform,
    joinLink,
    members,
    focus: themeOrFocus,
  };
  return out;
}

function toApiClub(c: BookClub): Record<string, unknown> {
  const n = parseInt(c.members, 10);
  return {
    id: c.id,
    name: c.name,
    theme: c.focus,
    description: c.description,
    platform: c.platform,
    members: c.members,
    focus: c.focus,
    logo: '',
    joinLink: c.joinLink,
    memberCount: isNaN(n) ? 0 : n,
    meetingFrequency: 'Monthly',
    nextMeeting: '',
  };
}

export default function AdminBookClubsPage() {
  const [bookClubs, setBookClubs] = useState<BookClub[]>(defaultClubs);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
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

  useEffect(() => {
    getBookClubs()
      .then(({ content }) => {
        if (content && typeof content === 'object' && !Array.isArray(content)) {
          const c = content as { clubs?: Record<string, unknown>[]; pageClubs?: Record<string, unknown>[] };
          const raw = Array.isArray(c.pageClubs) ? c.pageClubs : Array.isArray(c.clubs) ? c.clubs : [];
          const clubs = raw.map(toFormClub).filter((x): x is BookClub => x != null);
          if (clubs.length) setBookClubs(clubs);
        }
      })
      .catch(() => setMessage({ type: 'error', text: 'Failed to load book clubs' }))
      .finally(() => setLoading(false));
  }, []);

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

  const handleSaveToSite = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        ...sectionPageDefaults,
        clubs: bookClubs.map(toApiClub),
        pageClubs: bookClubs.map(toApiClub),
      };
      await putBookClubs(payload as Record<string, unknown>);
      setMessage({ type: 'success', text: 'Book clubs saved to site!' });
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageLoading message="Loading book clubs…" />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown mb-2">
            Manage Book Clubs
          </h1>
          <p className="font-body text-chai-brown-light">
            Add, edit, or remove book clubs. Save to site to update homepage and /book-clubs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveToSite}
            disabled={saving}
            className="flex items-center gap-2 bg-terracotta text-white px-4 py-2 rounded-lg hover:bg-terracotta/90 transition-colors font-body text-sm disabled:opacity-50"
          >
            <Save size={20} />
            {saving ? 'Saving…' : 'Save to site'}
          </button>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingClub(null);
              setFormData({ name: '', description: '', platform: 'instagram', joinLink: '', members: '', focus: '' });
            }}
            className="flex items-center gap-2 bg-sage/80 text-chai-brown px-4 py-2 rounded-lg hover:bg-sage transition-colors font-body text-sm"
          >
            <Plus size={20} />
            Add Book Club
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
