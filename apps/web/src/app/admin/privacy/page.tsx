'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';

export default function AdminPrivacyPage() {
  const [privacyContent, setPrivacyContent] = useState(`At chai.n.chapter ("we," "our," or "us"), we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website chai.n.chapter (the "Website").

Please read this Privacy Policy carefully. By using our Website, you consent to the data practices described in this policy.

Information We Collect
Information You Provide
We may collect information that you voluntarily provide to us, including:
- Name and email address when you contact us or submit a form
- Comments and messages you post on our blog
- Information provided when you subscribe to our newsletter
- Details provided when you inquire about our services

Automatically Collected Information
When you visit our Website, we may automatically collect certain information, including:
- IP address and browser type
- Pages you visit and time spent on pages
- Referring website addresses
- Device information and operating system

How We Use Your Information
We use the information we collect for various purposes, including:
- To provide, maintain, and improve our Website
- To respond to your inquiries and provide customer support
- To send you newsletters and updates (with your consent)
- To process service requests and transactions
- To analyze usage patterns and improve user experience
- To detect, prevent, and address technical issues
- To comply with legal obligations`);

  const handleSave = () => {
    // TODO: Replace with actual API call
    console.log('Saving privacy content:', privacyContent);
    alert('Privacy Policy saved successfully!');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown mb-2">
            Edit Privacy Policy
          </h1>
          <p className="font-body text-chai-brown-light">
            Update your website's privacy policy
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

      <div className="bg-white rounded-lg border border-chai-brown/10 shadow-sm p-6">
        <label className="block font-body text-sm font-medium text-chai-brown mb-4">
          Privacy Policy Content
        </label>
        <textarea
          value={privacyContent}
          onChange={(e) => setPrivacyContent(e.target.value)}
          rows={30}
          className="w-full px-4 py-3 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body text-chai-brown leading-relaxed resize-y"
          placeholder="Enter your privacy policy content here..."
        />
        <p className="mt-4 font-body text-sm text-chai-brown-light">
          Tip: Use line breaks to separate sections. The content will be formatted automatically on the public page.
        </p>
      </div>
    </div>
  );
}
