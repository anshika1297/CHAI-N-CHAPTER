'use client';

import { useState, useEffect } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import { getPageSettings, putPageSettings } from '@/lib/api';
import PageLoading from '@/components/PageLoading';
import ImageUploadField from '@/components/ImageUploadField';

type PictureCornerItem = { id: string; imageUrl: string; title?: string; description?: string };

const defaultAboutData = {
  hero: {
    name: 'Anshika',
    greeting: "Hi, I'm",
    subtitle1: 'Welcome to my cozy corner',
    subtitle2: 'of the internet',
    introText: 'A book lover, chai enthusiast, and storyteller at heart. I believe every great story deserves to be shared over a warm cup of chai. Join me as I navigate through pages, one chapter at a time.',
    imageUrl: '',
  },
  readingJourney: {
    title: 'My Reading Journey',
    subtitle: 'How it all began',
    paragraphs: [
      "My love affair with books started when I was just a little girl, curled up in my grandmother's lap as she read me stories from ancient Indian epics. Those magical moments, with the smell of old books and the warmth of her voice, planted a seed that would grow into an unshakeable passion.",
      "As I grew older, books became my escape, my teachers, and my constant companions. From devouring Enid Blyton's adventures to discovering the rich tapestry of Indian literature, each book shaped who I am today. The turning point came in 2015 when I read a book that completely changed my perspective on life.",
      "That's when I realized I wanted to share these transformative experiences with others. I started documenting my thoughts, creating a space where stories could breathe and readers could find their next favorite book. Today, reading isn't just a hobby—it's a way of life, a journey I'm honored to share with you.",
    ],
  },
  blogStory: {
    title: 'How This Blog Came to Life',
    subtitle: 'The story behind chapters.aur.chai',
    storyParagraphs: [
      "chapters.aur.chai was born from a simple desire: to create a space where books meet chai, and stories find a home. After years of sharing book recommendations with friends over countless cups of chai, I realized there was a need for a platform that felt personal, authentic, and cozy—not algorithmic or overwhelming.",
      "In 2020, during a time when the world slowed down, I decided to turn my passion into something tangible. This blog is my love letter to slow reading, thoughtful reviews, and the beautiful community of readers who believe that every story matters.",
    ],
    whatToExpect: [
      { icon: '☕', title: 'Honest Reviews:', text: 'No sugar-coating, just genuine thoughts about books that moved me.' },
      { icon: '📚', title: 'Curated Recommendations:', text: 'Handpicked reads for every mood and moment.' },
      { icon: '💭', title: 'Reflections & Essays:', text: 'Deep dives into themes, characters, and the stories that stay with you.' },
      { icon: '🤝', title: 'Community:', text: 'Join our book clubs and connect with fellow readers who share your passion.' },
      { icon: '🌿', title: 'Slow Living:', text: 'A space that celebrates taking your time, one chapter at a time.' },
    ],
  },
  readingDNA: {
    title: 'My Reading DNA',
    subtitle: 'A few fun facts about my reading life',
    facts: [
      { label: 'Favorite Genre', value: 'Literary Fiction' },
      { label: 'Reading Style', value: 'Slow & Savor' },
      { label: 'First Book Love', value: 'The Secret Garden' },
      { label: 'Current Obsession', value: 'Indian Literature' },
      { label: 'Reading Goal', value: '50 Books/Year' },
      { label: 'Perfect Reading Spot', value: 'Cozy Corner + Chai' },
    ],
  },
  pictureCorner: [] as PictureCornerItem[],
};

export default function AdminAboutPage() {
  const [aboutData, setAboutData] = useState(defaultAboutData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    getPageSettings('about')
      .then(({ content }) => {
        if (content && typeof content === 'object' && !Array.isArray(content)) {
          const c = content as Record<string, unknown>;
          const items: PictureCornerItem[] = Array.isArray(c.pictureCorner)
            ? (c.pictureCorner as Record<string, unknown>[])
                .filter((x) => x && typeof x === 'object' && typeof (x as { id?: unknown }).id === 'string')
                .map((x) => ({
                  id: String((x as { id: string }).id),
                  imageUrl: typeof (x as { imageUrl?: unknown }).imageUrl === 'string' ? (x as { imageUrl: string }).imageUrl : '',
                  title: typeof (x as { title?: unknown }).title === 'string' ? (x as { title: string }).title : '',
                  description: typeof (x as { description?: unknown }).description === 'string' ? (x as { description: string }).description : '',
                }))
            : defaultAboutData.pictureCorner;
          setAboutData({
            ...defaultAboutData,
            ...(content as object),
            pictureCorner: items.length ? items : defaultAboutData.pictureCorner,
          } as typeof defaultAboutData);
        }
      })
      .catch(() => setMessage({ type: 'error', text: 'Failed to load About data' }))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await putPageSettings('about', aboutData as unknown as Record<string, unknown>);
      setMessage({ type: 'success', text: 'About Me content saved successfully!' });
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageLoading message="Loading about page…" />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown mb-2">
            Edit About Me
          </h1>
          <p className="font-body text-chai-brown-light">
            Manage your About Me page content
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
        {/* Hero Section */}
        <div className="bg-white rounded-lg p-6 border border-chai-brown/10">
          <h2 className="font-serif text-xl text-chai-brown mb-4">Hero Section (top of About Me)</h2>
          <div className="space-y-4">
            {/* About Me / Author photo – prominent at top */}
            <div className="p-4 rounded-lg bg-cream/50 border border-chai-brown/10">
              <ImageUploadField
                label="About Me photo (author image)"
                value={aboutData.hero.imageUrl}
                onChange={(url) => setAboutData({
                  ...aboutData,
                  hero: { ...aboutData.hero, imageUrl: url }
                })}
                module="about"
                placeholder="Paste URL or click Upload to choose from device"
                className="font-body"
              />
              <p className="mt-2 text-xs text-chai-brown-light font-body">
                This image appears at the top of the About Me page. Use the Upload button to pick an image from your device, or paste a URL.
              </p>
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                Name
              </label>
              <input
                type="text"
                value={aboutData.hero.name}
                onChange={(e) => setAboutData({
                  ...aboutData,
                  hero: { ...aboutData.hero, name: e.target.value }
                })}
                className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
              />
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                Intro Text
              </label>
              <textarea
                value={aboutData.hero.introText}
                onChange={(e) => setAboutData({
                  ...aboutData,
                  hero: { ...aboutData.hero, introText: e.target.value }
                })}
                rows={4}
                className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
              />
            </div>
          </div>
        </div>

        {/* Reading Journey */}
        <div className="bg-white rounded-lg p-6 border border-chai-brown/10">
          <h2 className="font-serif text-xl text-chai-brown mb-4">Reading Journey</h2>
          <div className="space-y-4">
            {aboutData.readingJourney.paragraphs.map((para, index) => (
              <div key={index}>
                <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                  Paragraph {index + 1}
                </label>
                <textarea
                  value={para}
                  onChange={(e) => {
                    const newParagraphs = [...aboutData.readingJourney.paragraphs];
                    newParagraphs[index] = e.target.value;
                    setAboutData({
                      ...aboutData,
                      readingJourney: { ...aboutData.readingJourney, paragraphs: newParagraphs }
                    });
                  }}
                  rows={3}
                  className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Blog Story */}
        <div className="bg-white rounded-lg p-6 border border-chai-brown/10">
          <h2 className="font-serif text-xl text-chai-brown mb-4">Blog Story</h2>
          <div className="space-y-4">
            {aboutData.blogStory.storyParagraphs.map((para, index) => (
              <div key={index}>
                <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                  Story Paragraph {index + 1}
                </label>
                <textarea
                  value={para}
                  onChange={(e) => {
                    const newParagraphs = [...aboutData.blogStory.storyParagraphs];
                    newParagraphs[index] = e.target.value;
                    setAboutData({
                      ...aboutData,
                      blogStory: { ...aboutData.blogStory, storyParagraphs: newParagraphs }
                    });
                  }}
                  rows={3}
                  className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                />
              </div>
            ))}
            <div>
              <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                What to Expect Items
              </label>
              {aboutData.blogStory.whatToExpect.map((item, index) => (
                <div key={index} className="mb-4 p-4 border border-chai-brown/10 rounded-lg">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <input
                      type="text"
                      value={item.icon}
                      onChange={(e) => {
                        const newItems = [...aboutData.blogStory.whatToExpect];
                        newItems[index] = { ...item, icon: e.target.value };
                        setAboutData({
                          ...aboutData,
                          blogStory: { ...aboutData.blogStory, whatToExpect: newItems }
                        });
                      }}
                      placeholder="Icon (emoji)"
                      className="px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                    />
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => {
                        const newItems = [...aboutData.blogStory.whatToExpect];
                        newItems[index] = { ...item, title: e.target.value };
                        setAboutData({
                          ...aboutData,
                          blogStory: { ...aboutData.blogStory, whatToExpect: newItems }
                        });
                      }}
                      placeholder="Title"
                      className="px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                    />
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => {
                        const newItems = [...aboutData.blogStory.whatToExpect];
                        newItems[index] = { ...item, text: e.target.value };
                        setAboutData({
                          ...aboutData,
                          blogStory: { ...aboutData.blogStory, whatToExpect: newItems }
                        });
                      }}
                      placeholder="Description"
                      className="px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Picture Corner (carousel on About Me page) */}
        <div className="bg-white rounded-lg p-6 border border-chai-brown/10">
          <h2 className="font-serif text-xl text-chai-brown mb-2">Picture Corner (carousel)</h2>
          <p className="font-body text-sm text-chai-brown-light mb-4">
            Images shown in the &quot;Picture Corner&quot; carousel on the About Me page. Add images from book fairs, reading nooks, etc.
          </p>
          <div className="space-y-4">
            {aboutData.pictureCorner.map((item, index) => (
              <div
                key={item.id}
                className="p-4 rounded-lg border border-chai-brown/20 bg-cream/30 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-body text-sm font-medium text-chai-brown">Image {index + 1}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setAboutData({
                        ...aboutData,
                        pictureCorner: aboutData.pictureCorner.filter((i) => i.id !== item.id),
                      })
                    }
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    aria-label="Remove"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-chai-brown-light mb-1">Title (optional)</label>
                    <input
                      type="text"
                      value={item.title ?? ''}
                      onChange={(e) => {
                        const next = [...aboutData.pictureCorner];
                        const i = next.findIndex((x) => x.id === item.id);
                        if (i !== -1) next[i] = { ...next[i], title: e.target.value };
                        setAboutData({ ...aboutData, pictureCorner: next });
                      }}
                      placeholder="e.g. Book Fair 2024"
                      className="w-full px-3 py-2 border border-chai-brown/20 rounded-lg font-body text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-chai-brown-light mb-1">Description (optional)</label>
                    <input
                      type="text"
                      value={item.description ?? ''}
                      onChange={(e) => {
                        const next = [...aboutData.pictureCorner];
                        const i = next.findIndex((x) => x.id === item.id);
                        if (i !== -1) next[i] = { ...next[i], description: e.target.value };
                        setAboutData({ ...aboutData, pictureCorner: next });
                      }}
                      placeholder="e.g. Exploring the Delhi Book Fair"
                      className="w-full px-3 py-2 border border-chai-brown/20 rounded-lg font-body text-sm"
                    />
                  </div>
                </div>
                <ImageUploadField
                  label="Image"
                  value={item.imageUrl}
                  onChange={(url) => {
                    const next = [...aboutData.pictureCorner];
                    const i = next.findIndex((x) => x.id === item.id);
                    if (i !== -1) next[i] = { ...next[i], imageUrl: url };
                    setAboutData({ ...aboutData, pictureCorner: next });
                  }}
                  module="about"
                  placeholder="Upload or paste URL"
                  className="font-body"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setAboutData({
                  ...aboutData,
                  pictureCorner: [
                    ...aboutData.pictureCorner,
                    { id: crypto.randomUUID?.() ?? `pc-${Date.now()}-${Math.random().toString(36).slice(2)}`, imageUrl: '', title: '', description: '' },
                  ],
                })
              }
              className="flex items-center gap-2 px-4 py-2 border border-chai-brown/30 rounded-lg font-body text-sm text-chai-brown hover:bg-cream"
            >
              <Plus size={18} />
              Add image
            </button>
          </div>
        </div>

        {/* Reading DNA */}
        <div className="bg-white rounded-lg p-6 border border-chai-brown/10">
          <h2 className="font-serif text-xl text-chai-brown mb-4">Reading DNA Facts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {aboutData.readingDNA.facts.map((fact, index) => (
              <div key={index} className="p-4 border border-chai-brown/10 rounded-lg">
                <input
                  type="text"
                  value={fact.label}
                  onChange={(e) => {
                    const newFacts = [...aboutData.readingDNA.facts];
                    newFacts[index] = { ...fact, label: e.target.value };
                    setAboutData({
                      ...aboutData,
                      readingDNA: { ...aboutData.readingDNA, facts: newFacts }
                    });
                  }}
                  placeholder="Label"
                  className="w-full mb-2 px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                />
                <input
                  type="text"
                  value={fact.value}
                  onChange={(e) => {
                    const newFacts = [...aboutData.readingDNA.facts];
                    newFacts[index] = { ...fact, value: e.target.value };
                    setAboutData({
                      ...aboutData,
                      readingDNA: { ...aboutData.readingDNA, facts: newFacts }
                    });
                  }}
                  placeholder="Value"
                  className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
