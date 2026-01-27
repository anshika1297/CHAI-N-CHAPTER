'use client';

import { useState, useEffect } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import { getPageSettings, putPageSettings } from '@/lib/api';
import PageLoading from '@/components/PageLoading';

interface Service {
  id: string;
  title: string;
  description: string;
}

const defaultWorkWithMeData = {
  header: {
    title: 'Work With Me',
    description: "I'm passionate about supporting authors and publishers in their literary journey. Whether you need a beta reader, book reviewer, or a collaborator for your next project, I'd love to help bring your stories to life.",
  },
  services: [
    { id: '1', title: 'Beta Reading', description: 'Get detailed feedback on your manuscript before publication. I provide comprehensive analysis on plot, character development, pacing, and overall story structure.' },
    { id: '2', title: 'Book Reviews', description: 'Honest and detailed book reviews for your published works. Reviews will be featured on the blog and shared across social media platforms.' },
    { id: '3', title: 'Proofreading', description: 'Thorough proofreading services to catch grammar, spelling, punctuation, and formatting errors. Ensure your manuscript is polished and professional.' },
    { id: '4', title: 'Author Interviews', description: 'Engaging author interviews to help promote your book and share your writing journey with my reading community.' },
    { id: '5', title: 'Literary Agent Services', description: 'Assistance with manuscript submissions, query letter reviews, and guidance on navigating the publishing industry.' },
    { id: '6', title: 'Paid Content & Collaborations', description: 'Sponsored blog posts, social media promotions, book tours, and other collaborative content opportunities for authors and publishers.' },
  ] as Service[],
  socialLinks: [
    { name: 'Email', url: 'mailto:hello@chaptersaurchai.com', color: 'text-chai-brown' },
    { name: 'Instagram', url: 'https://instagram.com/chaptersaurchai', color: 'text-pink-500' },
    { name: 'Facebook', url: 'https://facebook.com/chaptersaurchai', color: 'text-blue-600' },
    { name: 'Goodreads', url: 'https://goodreads.com/chaptersaurchai', color: 'text-amber-700' },
    { name: 'LinkedIn', url: 'https://linkedin.com/in/chaptersaurchai', color: 'text-blue-700' },
    { name: 'Threads', url: 'https://www.threads.net/@chaptersaurchai', color: 'text-neutral-700' },
    { name: 'YouTube', url: 'https://youtube.com/@chaptersaurchai', color: 'text-red-500' },
  ],
  connectSection: {
    title: 'Connect With Me',
    description: 'Follow me on social media to stay updated with my latest reviews, recommendations, and bookish content.',
  },
};

export default function AdminWorkWithMePage() {
  const [workWithMeData, setWorkWithMeData] = useState(defaultWorkWithMeData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    getPageSettings('work-with-me')
      .then(({ content }) => {
        if (content && typeof content === 'object' && !Array.isArray(content)) {
          setWorkWithMeData({ ...defaultWorkWithMeData, ...(content as object) } as typeof defaultWorkWithMeData);
        }
      })
      .catch(() => setMessage({ type: 'error', text: 'Failed to load Work With Me data' }))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await putPageSettings('work-with-me', workWithMeData as unknown as Record<string, unknown>);
      setMessage({ type: 'success', text: 'Work With Me content saved successfully!' });
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const addService = () => {
    const newService: Service = {
      id: Date.now().toString(),
      title: '',
      description: '',
    };
    setWorkWithMeData({
      ...workWithMeData,
      services: [...workWithMeData.services, newService],
    });
  };

  const removeService = (id: string) => {
    if (confirm('Are you sure you want to remove this service?')) {
      setWorkWithMeData({
        ...workWithMeData,
        services: workWithMeData.services.filter(s => s.id !== id),
      });
    }
  };

  const updateService = (id: string, field: 'title' | 'description', value: string) => {
    setWorkWithMeData({
      ...workWithMeData,
      services: workWithMeData.services.map(s =>
        s.id === id ? { ...s, [field]: value } : s
      ),
    });
  };

  if (loading) {
    return <PageLoading message="Loading Work With Me…" />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown mb-2">
            Edit Work With Me
          </h1>
          <p className="font-body text-chai-brown-light">
            Manage your services and social links
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

      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-lg p-6 border border-chai-brown/10">
          <h2 className="font-serif text-xl text-chai-brown mb-4">Header</h2>
          <div className="space-y-4">
            <div>
              <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                Title
              </label>
              <input
                type="text"
                value={workWithMeData.header.title}
                onChange={(e) => setWorkWithMeData({
                  ...workWithMeData,
                  header: { ...workWithMeData.header, title: e.target.value }
                })}
                className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
              />
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                Description
              </label>
              <textarea
                value={workWithMeData.header.description}
                onChange={(e) => setWorkWithMeData({
                  ...workWithMeData,
                  header: { ...workWithMeData.header, description: e.target.value }
                })}
                rows={3}
                className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
              />
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="bg-white rounded-lg p-6 border border-chai-brown/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl text-chai-brown">Services</h2>
            <button
              onClick={addService}
              className="flex items-center gap-2 bg-terracotta text-white px-4 py-2 rounded-lg hover:bg-terracotta/90 transition-colors font-body text-sm"
            >
              <Plus size={18} />
              Add Service
            </button>
          </div>
          <div className="space-y-4">
            {workWithMeData.services.map((service) => (
              <div key={service.id} className="p-4 border border-chai-brown/10 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-body font-medium text-chai-brown">Service</h3>
                  <button
                    onClick={() => removeService(service.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={service.title}
                    onChange={(e) => updateService(service.id, 'title', e.target.value)}
                    placeholder="Service Title"
                    className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                  />
                  <textarea
                    value={service.description}
                    onChange={(e) => updateService(service.id, 'description', e.target.value)}
                    placeholder="Service Description"
                    rows={3}
                    className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-white rounded-lg p-6 border border-chai-brown/10">
          <h2 className="font-serif text-xl text-chai-brown mb-4">Social Media Links</h2>
          <div className="space-y-4">
            {workWithMeData.socialLinks.map((link, index) => (
              <div key={index} className="p-4 border border-chai-brown/10 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                      Platform Name
                    </label>
                    <input
                      type="text"
                      value={link.name}
                      onChange={(e) => {
                        const newLinks = [...workWithMeData.socialLinks];
                        newLinks[index] = { ...link, name: e.target.value };
                        setWorkWithMeData({ ...workWithMeData, socialLinks: newLinks });
                      }}
                      className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                    />
                  </div>
                  <div>
                    <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                      URL
                    </label>
                    <input
                      type="text"
                      value={link.url}
                      onChange={(e) => {
                        const newLinks = [...workWithMeData.socialLinks];
                        newLinks[index] = { ...link, url: e.target.value };
                        setWorkWithMeData({ ...workWithMeData, socialLinks: newLinks });
                      }}
                      className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
