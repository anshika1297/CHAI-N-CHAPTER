'use client';

import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { getPageSettings, putPageSettings } from '@/lib/api';
import PageLoading from '@/components/PageLoading';

const defaultTerms = `Welcome to chapters.aur.chai ("we," "our," or "us"). These Terms and Conditions ("Terms") govern your access to and use of our website located at chaptersaurchai.com (the "Website"). By accessing or using our Website, you agree to be bound by these Terms.

If you do not agree with any part of these Terms, please do not use our Website.

Use of the Website
You may use our Website for personal, non-commercial purposes. You agree not to:
- Use the Website in any way that violates any applicable law or regulation
- Attempt to gain unauthorized access to any portion of the Website
- Interfere with or disrupt the Website or servers connected to the Website
- Reproduce, duplicate, copy, sell, or exploit any portion of the Website without our express written permission
- Use any automated system, including "robots," "spiders," or "offline readers," to access the Website

Intellectual Property
All content on this Website, including but not limited to text, graphics, logos, images, and software, is the property of chapters.aur.chai or its content suppliers and is protected by copyright, trademark, and other intellectual property laws.

You may not reproduce, distribute, modify, create derivative works of, publicly display, or otherwise use any content from this Website without our prior written consent.`;

export default function AdminTermsPage() {
  const [termsContent, setTermsContent] = useState(defaultTerms);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    getPageSettings('terms')
      .then(({ content }) => {
        if (typeof content === 'string') setTermsContent(content);
        else if (content && typeof content === 'object' && 'content' in content && typeof (content as { content: string }).content === 'string') {
          setTermsContent((content as { content: string }).content);
        }
      })
      .catch(() => setMessage({ type: 'error', text: 'Failed to load Terms' }))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await putPageSettings('terms', { content: termsContent });
      setMessage({ type: 'success', text: 'Terms & Conditions saved successfully!' });
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageLoading message="Loading Terms…" />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown mb-2">
            Edit Terms & Conditions
          </h1>
          <p className="font-body text-chai-brown-light">
            Update your website's terms and conditions
          </p>
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

      <div className="bg-white rounded-lg border border-chai-brown/10 shadow-sm p-6">
        <label className="block font-body text-sm font-medium text-chai-brown mb-4">
          Terms & Conditions Content
        </label>
        <textarea
          value={termsContent}
          onChange={(e) => setTermsContent(e.target.value)}
          rows={30}
          className="w-full px-4 py-3 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body text-chai-brown leading-relaxed resize-y"
          placeholder="Enter your terms and conditions content here..."
        />
        <p className="mt-4 font-body text-sm text-chai-brown-light">
          Tip: Use line breaks to separate sections. The content will be formatted automatically on the public page.
        </p>
      </div>
    </div>
  );
}
