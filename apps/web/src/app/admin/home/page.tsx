'use client';

import { useState, useEffect } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import { getPageSettings, putPageSettings } from '@/lib/api';
import PageLoading from '@/components/PageLoading';
import ImageUploadField from '@/components/ImageUploadField';

const defaultHome = {
  welcomeText: 'Welcome to my cozy corner',
  headingLine1: 'Where Chai Meets',
  headingLine2: 'Stories',
  introText: "Hello, I'm Anshika — a book lover, chai enthusiast, and storyteller at heart. Join me as I share honest book reviews, curated recommendations, and reflections from my reading journey.",
  stats: [
    { value: '50+', label: 'Book Reviews' },
    { value: '2K+', label: 'Readers' },
    { value: '3', label: 'Book Clubs' },
  ],
  ctaPrimary: 'Read My Story',
  ctaPrimaryHref: '/about',
  ctaSecondary: 'Explore Blogs',
  ctaSecondaryHref: '/blog',
  imageUrl: '',
};

export default function AdminHomePage() {
  const [data, setData] = useState(defaultHome);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    getPageSettings('home')
      .then(({ content }) => {
        if (content && typeof content === 'object' && !Array.isArray(content)) {
          const c = content as Record<string, unknown>;
          setData({
            welcomeText: typeof c.welcomeText === 'string' && c.welcomeText.trim() ? c.welcomeText : defaultHome.welcomeText,
            headingLine1: typeof c.headingLine1 === 'string' && c.headingLine1.trim() ? c.headingLine1 : defaultHome.headingLine1,
            headingLine2: typeof c.headingLine2 === 'string' && c.headingLine2.trim() ? c.headingLine2 : defaultHome.headingLine2,
            introText: typeof c.introText === 'string' && c.introText.trim() ? c.introText : defaultHome.introText,
            stats: Array.isArray(c.stats) && c.stats.length > 0
              ? (c.stats as { value?: string; label?: string }[])
                  .filter((s): s is { value: string; label: string } => typeof s?.value === 'string' && typeof s?.label === 'string')
                  .map((s) => ({ value: s.value.trim(), label: s.label.trim() }))
              : defaultHome.stats,
            ctaPrimary: typeof c.ctaPrimary === 'string' && c.ctaPrimary.trim() ? c.ctaPrimary : defaultHome.ctaPrimary,
            ctaPrimaryHref: typeof c.ctaPrimaryHref === 'string' && c.ctaPrimaryHref.trim() ? c.ctaPrimaryHref : defaultHome.ctaPrimaryHref,
            ctaSecondary: typeof c.ctaSecondary === 'string' && c.ctaSecondary.trim() ? c.ctaSecondary : defaultHome.ctaSecondary,
            ctaSecondaryHref: typeof c.ctaSecondaryHref === 'string' && c.ctaSecondaryHref.trim() ? c.ctaSecondaryHref : defaultHome.ctaSecondaryHref,
            imageUrl: typeof c.imageUrl === 'string' ? c.imageUrl : '',
          });
        }
      })
      .catch(() => setMessage({ type: 'error', text: 'Failed to load home data' }))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await putPageSettings('home', data as Record<string, unknown>);
      setMessage({ type: 'success', text: 'Home (hero) content saved successfully!' });
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const addStat = () => {
    setData((d) => ({ ...d, stats: [...d.stats, { value: '', label: '' }] }));
  };
  const removeStat = (i: number) => {
    setData((d) => ({ ...d, stats: d.stats.filter((_, j) => j !== i) }));
  };
  const updateStat = (i: number, field: 'value' | 'label', v: string) => {
    setData((d) => ({ ...d, stats: d.stats.map((s, j) => (j === i ? { ...s, [field]: v } : s)) }));
  };

  if (loading) {
    return <PageLoading message="Loading home settings…" />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown mb-2">Edit Home (Hero)</h1>
          <p className="font-body text-chai-brown-light">Headline, intro, stats, and CTAs on the homepage hero</p>
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
        <div className={`mb-6 px-4 py-3 rounded-lg font-body text-sm ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-white rounded-lg p-6 border border-chai-brown/10">
          <h2 className="font-serif text-xl text-chai-brown mb-4">Hero copy</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-chai-brown-light mb-1">Welcome line</label>
              <input type="text" value={data.welcomeText} onChange={(e) => setData((d) => ({ ...d, welcomeText: e.target.value }))} className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg font-body text-chai-brown" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-chai-brown-light mb-1">Heading line 1</label>
                <input type="text" value={data.headingLine1} onChange={(e) => setData((d) => ({ ...d, headingLine1: e.target.value }))} className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg font-body text-chai-brown" />
              </div>
              <div>
                <label className="block text-sm text-chai-brown-light mb-1">Heading line 2 (accent)</label>
                <input type="text" value={data.headingLine2} onChange={(e) => setData((d) => ({ ...d, headingLine2: e.target.value }))} className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg font-body text-chai-brown" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-chai-brown-light mb-1">Intro paragraph</label>
              <textarea value={data.introText} onChange={(e) => setData((d) => ({ ...d, introText: e.target.value }))} className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg font-body text-chai-brown" rows={3} />
            </div>
            <div>
              <ImageUploadField
                label="Hero image (optional)"
                value={data.imageUrl}
                onChange={(url) => setData((d) => ({ ...d, imageUrl: url }))}
                module="home"
                placeholder="https://... or upload"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-chai-brown/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl text-chai-brown">Stats</h2>
            <button type="button" onClick={addStat} className="flex items-center gap-2 px-3 py-1.5 bg-sage/20 text-chai-brown rounded-lg text-sm hover:bg-sage/30">
              <Plus size={16} /> Add
            </button>
          </div>
          <ul className="space-y-3">
            {data.stats.map((s, i) => (
              <li key={i} className="flex gap-2 items-center border-b border-chai-brown/10 pb-3">
                <input type="text" value={s.value} onChange={(e) => updateStat(i, 'value', e.target.value)} className="w-20 px-3 py-2 border border-chai-brown/20 rounded-lg font-body text-sm" placeholder="50+" />
                <input type="text" value={s.label} onChange={(e) => updateStat(i, 'label', e.target.value)} className="flex-1 px-3 py-2 border border-chai-brown/20 rounded-lg font-body text-sm" placeholder="Book Reviews" />
                <button type="button" onClick={() => removeStat(i)} className="p-2 text-red-600 hover:bg-red-50 rounded" aria-label="Remove"><Trash2 size={18} /></button>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-lg p-6 border border-chai-brown/10">
          <h2 className="font-serif text-xl text-chai-brown mb-4">CTAs</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-chai-brown-light mb-1">Primary button text</label>
              <input type="text" value={data.ctaPrimary} onChange={(e) => setData((d) => ({ ...d, ctaPrimary: e.target.value }))} className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg font-body text-chai-brown" />
            </div>
            <div>
              <label className="block text-sm text-chai-brown-light mb-1">Primary href</label>
              <input type="text" value={data.ctaPrimaryHref} onChange={(e) => setData((d) => ({ ...d, ctaPrimaryHref: e.target.value }))} className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg font-body text-chai-brown" />
            </div>
            <div>
              <label className="block text-sm text-chai-brown-light mb-1">Secondary button text</label>
              <input type="text" value={data.ctaSecondary} onChange={(e) => setData((d) => ({ ...d, ctaSecondary: e.target.value }))} className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg font-body text-chai-brown" />
            </div>
            <div>
              <label className="block text-sm text-chai-brown-light mb-1">Secondary href</label>
              <input type="text" value={data.ctaSecondaryHref} onChange={(e) => setData((d) => ({ ...d, ctaSecondaryHref: e.target.value }))} className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg font-body text-chai-brown" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
