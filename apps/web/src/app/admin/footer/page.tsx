'use client';

import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { getPageSettings, putPageSettings } from '@/lib/api';
import PageLoading from '@/components/PageLoading';
import ImageUploadField from '@/components/ImageUploadField';

const defaultFooterData = {
  heading: 'Chapters.aur.Chai',
  tagline: 'A cozy corner of the internet where books meet chai, and every story finds a home.',
  logoUrl: '',
};

export default function AdminFooterPage() {
  const [footerData, setFooterData] = useState(defaultFooterData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    getPageSettings('footer')
      .then(({ content }) => {
        if (content && typeof content === 'object' && !Array.isArray(content)) {
          const c = content as { heading?: string; tagline?: string; logoUrl?: string };
          setFooterData({
            heading: typeof c.heading === 'string' ? c.heading : defaultFooterData.heading,
            tagline: typeof c.tagline === 'string' ? c.tagline : defaultFooterData.tagline,
            logoUrl: typeof c.logoUrl === 'string' ? c.logoUrl : defaultFooterData.logoUrl,
          });
        }
      })
      .catch(() => setMessage({ type: 'error', text: 'Failed to load footer data' }))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await putPageSettings('footer', footerData as Record<string, unknown>);
      setMessage({ type: 'success', text: 'Footer content saved successfully! Logo will appear in header and footer on the site.' });
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageLoading message="Loading footer settings…" />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown mb-2">Edit Footer</h1>
          <p className="font-body text-chai-brown-light">Footer heading, tagline and logo. The logo is also shown in the site header.</p>
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
          <h2 className="font-serif text-xl text-chai-brown mb-4">Logo</h2>
          <p className="text-chai-brown-light text-sm mb-3">Upload a logo image. It will be displayed in the header (top of every page) and in the footer.</p>
          <ImageUploadField
            module="footer"
            value={footerData.logoUrl}
            onChange={(url) => setFooterData({ ...footerData, logoUrl: url })}
            label="Logo image"
            placeholder="Upload or paste image URL"
          />
        </div>

        <div className="bg-white rounded-lg p-6 border border-chai-brown/10">
          <h2 className="font-serif text-xl text-chai-brown mb-4">Footer heading</h2>
          <input
            type="text"
            value={footerData.heading}
            onChange={(e) => setFooterData({ ...footerData, heading: e.target.value })}
            className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg font-body text-chai-brown"
            placeholder="Chapters.aur.Chai"
          />
        </div>

        <div className="bg-white rounded-lg p-6 border border-chai-brown/10">
          <h2 className="font-serif text-xl text-chai-brown mb-4">Tagline</h2>
          <textarea
            value={footerData.tagline}
            onChange={(e) => setFooterData({ ...footerData, tagline: e.target.value })}
            className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg font-body text-chai-brown min-h-[100px]"
            placeholder="A cozy corner of the internet where books meet chai..."
          />
        </div>
      </div>
    </div>
  );
}
