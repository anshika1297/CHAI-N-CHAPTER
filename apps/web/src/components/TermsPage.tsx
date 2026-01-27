'use client';

import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { getPageSettings } from '@/lib/api';

export default function TermsPage() {
  const [apiContent, setApiContent] = useState<string | null>(null);

  useEffect(() => {
    getPageSettings('terms')
      .then(({ content }) => {
        if (typeof content === 'string' && content.trim()) setApiContent(content);
        else if (content && typeof content === 'object' && 'content' in content && typeof (content as { content: string }).content === 'string') {
          const c = (content as { content: string }).content;
          if (c.trim()) setApiContent(c);
        }
      })
      .catch(() => {});
  }, []);

  if (apiContent) {
    return (
      <section className="pt-24 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <header className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <FileText size={48} className="text-terracotta" />
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-chai-brown mb-4">
              Terms & Conditions
            </h1>
            <p className="font-body text-base text-chai-brown-light">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </header>
          <div className="bg-cream-light rounded-2xl p-8 sm:p-12 border border-chai-brown/10">
            <div className="prose prose-chai-brown max-w-none font-body text-chai-brown-light leading-relaxed">
              {apiContent.split(/\n\n+/).map((para, i) => (
                <p key={i} className="mb-4">{para.trim()}</p>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-24 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <FileText size={48} className="text-terracotta" />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-chai-brown mb-4">
            Terms & Conditions
          </h1>
          <p className="font-body text-base text-chai-brown-light">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </header>

        {/* Content - static fallback when API has no data */}
        <div className="bg-cream-light rounded-2xl p-8 sm:p-12 border border-chai-brown/10">
          <div className="prose prose-chai-brown max-w-none">
            <div className="space-y-8 font-body text-chai-brown-light leading-relaxed">
              <section>
                <h2 className="font-serif text-2xl text-chai-brown mb-4">1. Introduction</h2>
                <p className="mb-4">
                  Welcome to chapters.aur.chai ("we," "our," or "us"). These Terms and Conditions ("Terms") govern your access to and use of our website located at chaptersaurchai.com (the "Website"). By accessing or using our Website, you agree to be bound by these Terms.
                </p>
                <p>
                  If you do not agree with any part of these Terms, please do not use our Website.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl text-chai-brown mb-4">2. Use of the Website</h2>
                <p className="mb-4">
                  You may use our Website for personal, non-commercial purposes. You agree not to:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Use the Website in any way that violates any applicable law or regulation</li>
                  <li>Attempt to gain unauthorized access to any portion of the Website</li>
                  <li>Interfere with or disrupt the Website or servers connected to the Website</li>
                  <li>Reproduce, duplicate, copy, sell, or exploit any portion of the Website without our express written permission</li>
                  <li>Use any automated system, including "robots," "spiders," or "offline readers," to access the Website</li>
                </ul>
              </section>

              <section>
                <h2 className="font-serif text-2xl text-chai-brown mb-4">3. Intellectual Property</h2>
                <p className="mb-4">
                  All content on this Website, including but not limited to text, graphics, logos, images, and software, is the property of chapters.aur.chai or its content suppliers and is protected by copyright, trademark, and other intellectual property laws.
                </p>
                <p>
                  You may not reproduce, distribute, modify, create derivative works of, publicly display, or otherwise use any content from this Website without our prior written consent.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl text-chai-brown mb-4">4. User Content</h2>
                <p className="mb-4">
                  If you submit any content to our Website (such as comments, reviews, or other submissions), you grant us a non-exclusive, royalty-free, perpetual, and worldwide license to use, reproduce, modify, and distribute such content.
                </p>
                <p>
                  You represent and warrant that you own or have the necessary rights to any content you submit and that such content does not violate any third-party rights.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl text-chai-brown mb-4">5. Book Reviews and Recommendations</h2>
                <p className="mb-4">
                  All book reviews, recommendations, and opinions expressed on this Website are our own and reflect our personal views. We do not guarantee the accuracy or completeness of any information provided.
                </p>
                <p>
                  Some reviews may be sponsored or contain affiliate links, which will be clearly disclosed in accordance with applicable laws and regulations.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl text-chai-brown mb-4">6. Services</h2>
                <p className="mb-4">
                  We offer various services including but not limited to beta reading, book reviews, proofreading, and author interviews. Specific terms for these services will be agreed upon separately through our Work With Me page or direct communication.
                </p>
                <p>
                  We reserve the right to refuse service to anyone at any time for any reason.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl text-chai-brown mb-4">7. Disclaimer of Warranties</h2>
                <p className="mb-4">
                  The Website is provided "as is" and "as available" without any warranties of any kind, either express or implied. We do not warrant that:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>The Website will be available at all times or free from errors</li>
                  <li>The Website will meet your requirements</li>
                  <li>The Website will be secure or free from viruses or other harmful components</li>
                </ul>
              </section>

              <section>
                <h2 className="font-serif text-2xl text-chai-brown mb-4">8. Limitation of Liability</h2>
                <p>
                  To the fullest extent permitted by law, chapters.aur.chai shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of the Website.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl text-chai-brown mb-4">9. Links to Third-Party Websites</h2>
                <p>
                  Our Website may contain links to third-party websites. We are not responsible for the content, privacy policies, or practices of any third-party websites. Your use of third-party websites is at your own risk.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl text-chai-brown mb-4">10. Changes to Terms</h2>
                <p>
                  We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the new Terms on this page and updating the "Last updated" date. Your continued use of the Website after any changes constitutes acceptance of the new Terms.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl text-chai-brown mb-4">11. Governing Law</h2>
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of [Your Country/State], without regard to its conflict of law provisions.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl text-chai-brown mb-4">12. Contact Information</h2>
                <p>
                  If you have any questions about these Terms, please contact us through our <a href="/contact" className="text-terracotta hover:underline">Contact</a> page.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
