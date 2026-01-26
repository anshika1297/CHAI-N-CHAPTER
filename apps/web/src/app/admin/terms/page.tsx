'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';

export default function AdminTermsPage() {
  const [termsContent, setTermsContent] = useState(`Welcome to chai.n.chapter ("we," "our," or "us"). These Terms and Conditions ("Terms") govern your access to and use of our website located at chai.n.chapter (the "Website"). By accessing or using our Website, you agree to be bound by these Terms.

If you do not agree with any part of these Terms, please do not use our Website.

Use of the Website
You may use our Website for personal, non-commercial purposes. You agree not to:
- Use the Website in any way that violates any applicable law or regulation
- Attempt to gain unauthorized access to any portion of the Website
- Interfere with or disrupt the Website or servers connected to the Website
- Reproduce, duplicate, copy, sell, or exploit any portion of the Website without our express written permission
- Use any automated system, including "robots," "spiders," or "offline readers," to access the Website

Intellectual Property
All content on this Website, including but not limited to text, graphics, logos, images, and software, is the property of chai.n.chapter or its content suppliers and is protected by copyright, trademark, and other intellectual property laws.

You may not reproduce, distribute, modify, create derivative works of, publicly display, or otherwise use any content from this Website without our prior written consent.`);

  const handleSave = () => {
    // TODO: Replace with actual API call
    console.log('Saving terms content:', termsContent);
    alert('Terms & Conditions saved successfully!');
  };

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
          className="flex items-center gap-2 bg-terracotta text-white px-6 py-2 rounded-lg hover:bg-terracotta/90 transition-colors font-body"
        >
          <Save size={20} />
          Save Changes
        </button>
      </div>

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
