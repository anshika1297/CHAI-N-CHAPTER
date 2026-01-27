'use client';

import { useState, useEffect } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import { getPageSettings, putPageSettings } from '@/lib/api';
import PageLoading from '@/components/PageLoading';

const defaultHeaderData = {
  siteName: 'Chapters.aur.Chai',
  navLinks: [
    { name: 'Home', href: '/' },
    { name: 'About Me', href: '/about' },
    { name: 'Book Reviews', href: '/blog' },
    { name: 'Book Recommendations', href: '/recommendations' },
    { name: 'Her Musings Verse', href: '/musings' },
    { name: 'Book Clubs', href: '/book-clubs' },
    { name: 'Work With Me', href: '/work-with-me' },
  ],
};

export default function AdminHeaderPage() {
  const [headerData, setHeaderData] = useState(defaultHeaderData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    getPageSettings('header')
      .then(({ content }) => {
        if (content && typeof content === 'object' && !Array.isArray(content)) {
          const c = content as { siteName?: string; navLinks?: { name: string; href: string }[] };
          setHeaderData({
            siteName: typeof c.siteName === 'string' ? c.siteName : defaultHeaderData.siteName,
            navLinks: Array.isArray(c.navLinks) && c.navLinks.length > 0
              ? c.navLinks.filter((l): l is { name: string; href: string } => typeof l?.name === 'string' && typeof l?.href === 'string')
              : defaultHeaderData.navLinks,
          });
        }
      })
      .catch(() => setMessage({ type: 'error', text: 'Failed to load header data' }))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await putPageSettings('header', headerData as Record<string, unknown>);
      setMessage({ type: 'success', text: 'Header content saved successfully!' });
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const addLink = () => {
    setHeaderData({
      ...headerData,
      navLinks: [...headerData.navLinks, { name: '', href: '/' }],
    });
  };

  const removeLink = (index: number) => {
    const next = headerData.navLinks.filter((_, i) => i !== index);
    setHeaderData({ ...headerData, navLinks: next.length ? next : [{ name: 'Home', href: '/' }] });
  };

  const updateLink = (index: number, field: 'name' | 'href', value: string) => {
    const next = headerData.navLinks.map((link, i) =>
      i === index ? { ...link, [field]: value } : link
    );
    setHeaderData({ ...headerData, navLinks: next });
  };

  if (loading) {
    return <PageLoading message="Loading header settings…" />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown mb-2">Edit Header</h1>
          <p className="font-body text-chai-brown-light">Site name and navigation links shown in the main header</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-terracotta text-white px-6 py-2 rounded-lg hover:bg-terracotta/90 transition-colors font-body disabled:opacity-50"
        >
          <Save size={20} />
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
      {message && (
        <div
          className={`mb-6 px-4 py-3 rounded-lg font-body text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-white rounded-lg p-6 border border-chai-brown/10">
          <h2 className="font-serif text-xl text-chai-brown mb-4">Site name (logo text)</h2>
          <input
            type="text"
            value={headerData.siteName}
            onChange={(e) => setHeaderData({ ...headerData, siteName: e.target.value })}
            className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg font-body text-chai-brown"
            placeholder="Chapters.aur.Chai"
          />
        </div>

        <div className="bg-white rounded-lg p-6 border border-chai-brown/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl text-chai-brown">Navigation links</h2>
            <button
              type="button"
              onClick={addLink}
              className="flex items-center gap-2 px-3 py-1.5 bg-sage/20 text-chai-brown rounded-lg text-sm hover:bg-sage/30"
            >
              <Plus size={16} /> Add link
            </button>
          </div>
          <ul className="space-y-3">
            {headerData.navLinks.map((link, index) => (
              <li key={index} className="flex flex-wrap gap-2 items-center border-b border-chai-brown/10 pb-3">
                <input
                  type="text"
                  value={link.name}
                  onChange={(e) => updateLink(index, 'name', e.target.value)}
                  className="flex-1 min-w-[120px] px-3 py-2 border border-chai-brown/20 rounded-lg font-body text-sm"
                  placeholder="Label"
                />
                <input
                  type="text"
                  value={link.href}
                  onChange={(e) => updateLink(index, 'href', e.target.value)}
                  className="flex-1 min-w-[140px] px-3 py-2 border border-chai-brown/20 rounded-lg font-body text-sm"
                  placeholder="/about"
                />
                <button
                  type="button"
                  onClick={() => removeLink(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                  aria-label="Remove link"
                >
                  <Trash2 size={18} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
