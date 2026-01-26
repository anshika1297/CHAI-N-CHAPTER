'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';

export default function AdminContactPage() {
  const [contactData, setContactData] = useState({
    header: {
      title: "Let's Connect",
      subtitle: 'Over a cup of chai, of course!',
      description: "Whether you want to chat about books, share your favorite reads, discuss a potential collaboration, or just say hello — I'd love to hear from you!",
    },
    socialLinks: [
      { name: 'Instagram', url: 'https://instagram.com/chainchapter', color: 'text-pink-500' },
      { name: 'Twitter', url: 'https://twitter.com/chainchapter', color: 'text-blue-400' },
      { name: 'YouTube', url: 'https://youtube.com/@chainchapter', color: 'text-red-500' },
      { name: 'Email', url: 'mailto:hello@chainchapter.com', color: 'text-chai-brown' },
    ],
    sidebar: {
      responseTime: 'I typically respond within 24-48 hours',
      workWithMeLink: '/work-with-me',
      note: 'For casual chats, book recommendations, or just to say hello, this is the perfect place!',
    },
  });

  const handleSave = () => {
    // TODO: Replace with actual API call
    console.log('Saving contact data:', contactData);
    alert('Contact page content saved successfully!');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown mb-2">
            Edit Contact Page
          </h1>
          <p className="font-body text-chai-brown-light">
            Manage your Contact page content
          </p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-terracotta text-white px-6 py-2 rounded-lg hover:bg-terracotta/90 transition-colors font-body"
        >
          <Save size={20} />
          Save Changes
        </button>
      </div>

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
                value={contactData.header.title}
                onChange={(e) => setContactData({
                  ...contactData,
                  header: { ...contactData.header, title: e.target.value }
                })}
                className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
              />
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                Subtitle
              </label>
              <input
                type="text"
                value={contactData.header.subtitle}
                onChange={(e) => setContactData({
                  ...contactData,
                  header: { ...contactData.header, subtitle: e.target.value }
                })}
                className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
              />
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                Description
              </label>
              <textarea
                value={contactData.header.description}
                onChange={(e) => setContactData({
                  ...contactData,
                  header: { ...contactData.header, description: e.target.value }
                })}
                rows={3}
                className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
              />
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-white rounded-lg p-6 border border-chai-brown/10">
          <h2 className="font-serif text-xl text-chai-brown mb-4">Social Media Links</h2>
          <div className="space-y-4">
            {contactData.socialLinks.map((link, index) => (
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
                        const newLinks = [...contactData.socialLinks];
                        newLinks[index] = { ...link, name: e.target.value };
                        setContactData({ ...contactData, socialLinks: newLinks });
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
                        const newLinks = [...contactData.socialLinks];
                        newLinks[index] = { ...link, url: e.target.value };
                        setContactData({ ...contactData, socialLinks: newLinks });
                      }}
                      className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="bg-white rounded-lg p-6 border border-chai-brown/10">
          <h2 className="font-serif text-xl text-chai-brown mb-4">Sidebar Content</h2>
          <div className="space-y-4">
            <div>
              <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                Response Time
              </label>
              <input
                type="text"
                value={contactData.sidebar.responseTime}
                onChange={(e) => setContactData({
                  ...contactData,
                  sidebar: { ...contactData.sidebar, responseTime: e.target.value }
                })}
                className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
              />
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                Note
              </label>
              <textarea
                value={contactData.sidebar.note}
                onChange={(e) => setContactData({
                  ...contactData,
                  sidebar: { ...contactData.sidebar, note: e.target.value }
                })}
                rows={3}
                className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
