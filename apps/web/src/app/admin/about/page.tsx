'use client';

import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { getPageSettings, putPageSettings } from '@/lib/api';
import PageLoading from '@/components/PageLoading';

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
          setAboutData({ ...defaultAboutData, ...(content as object) } as typeof defaultAboutData);
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
          <h2 className="font-serif text-xl text-chai-brown mb-4">Hero Section</h2>
          <div className="space-y-4">
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
            <div>
              <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                Image URL
              </label>
              <input
                type="text"
                value={aboutData.hero.imageUrl}
                onChange={(e) => setAboutData({
                  ...aboutData,
                  hero: { ...aboutData.hero, imageUrl: e.target.value }
                })}
                placeholder="https://example.com/image.jpg"
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
