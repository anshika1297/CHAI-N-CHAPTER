'use client';

import { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { getPageSettings } from '@/lib/api';

export default function PrivacyPage() {
  const [apiContent, setApiContent] = useState<string | null>(null);

  useEffect(() => {
    getPageSettings('privacy')
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
              <Shield size={48} className="text-terracotta" />
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-chai-brown mb-4">
              Privacy Policy
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
            <Shield size={48} className="text-terracotta" />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-chai-brown mb-4">
            Privacy Policy
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
                  At chapters.aur.chai ("we," "our," or "us"), we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website chaptersaurchai.com (the "Website").
                </p>
                <p>
                  Please read this Privacy Policy carefully. By using our Website, you consent to the data practices described in this policy.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl text-chai-brown mb-4">2. Information We Collect</h2>
                
                <h3 className="font-serif text-xl text-chai-brown mt-6 mb-3">2.1 Information You Provide</h3>
                <p className="mb-4">
                  We may collect information that you voluntarily provide to us, including:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Name and email address when you contact us or submit a form</li>
                  <li>Comments and messages you post on our blog</li>
                  <li>Information provided when you subscribe to our newsletter</li>
                  <li>Details provided when you inquire about our services</li>
                </ul>

                <h3 className="font-serif text-xl text-chai-brown mt-6 mb-3">2.2 Automatically Collected Information</h3>
                <p className="mb-4">
                  When you visit our Website, we may automatically collect certain information, including:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>IP address and browser type</li>
                  <li>Pages you visit and time spent on pages</li>
                  <li>Referring website addresses</li>
                  <li>Device information and operating system</li>
                </ul>
              </section>

              <section>
                <h2 className="font-serif text-2xl text-chai-brown mb-4">3. How We Use Your Information</h2>
                <p className="mb-4">We use the information we collect for various purposes, including:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>To provide, maintain, and improve our Website</li>
                  <li>To respond to your inquiries and provide customer support</li>
                  <li>To send you newsletters and updates (with your consent)</li>
                  <li>To process service requests and transactions</li>
                  <li>To analyze usage patterns and improve user experience</li>
                  <li>To detect, prevent, and address technical issues</li>
                  <li>To comply with legal obligations</li>
                </ul>
              </section>

              <section>
                <h2 className="font-serif text-2xl text-chai-brown mb-4">4. Cookies and Tracking Technologies</h2>
                <p className="mb-4">
                  We may use cookies and similar tracking technologies to track activity on our Website and store certain information. Cookies are small data files stored on your device.
                </p>
                <p className="mb-4">
                  You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Website.
                </p>
                <p>
                  We may use both session cookies (which expire when you close your browser) and persistent cookies (which stay on your device until deleted).
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl text-chai-brown mb-4">5. Third-Party Services</h2>
                <p className="mb-4">
                  We may use third-party services that collect, monitor, and analyze information, including:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Analytics services (e.g., Google Analytics) to understand website usage</li>
                  <li>Email marketing services for newsletter management</li>
                  <li>Social media platforms for content sharing</li>
                  <li>Payment processors for service transactions</li>
                </ul>
                <p>
                  These third parties have their own privacy policies governing how they use your information. We encourage you to review their privacy policies.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl text-chai-brown mb-4">6. Data Sharing and Disclosure</h2>
                <p className="mb-4">We do not sell your personal information. We may share your information only in the following circumstances:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>With service providers who assist us in operating our Website and conducting our business</li>
                  <li>When required by law or to respond to legal process</li>
                  <li>To protect our rights, privacy, safety, or property</li>
                  <li>In connection with a business transfer (merger, acquisition, etc.)</li>
                  <li>With your explicit consent</li>
                </ul>
              </section>

              <section>
                <h2 className="font-serif text-2xl text-chai-brown mb-4">7. Data Security</h2>
                <p className="mb-4">
                  We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure.
                </p>
                <p>
                  While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl text-chai-brown mb-4">8. Your Rights</h2>
                <p className="mb-4">Depending on your location, you may have certain rights regarding your personal information, including:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>The right to access your personal information</li>
                  <li>The right to correct inaccurate information</li>
                  <li>The right to request deletion of your information</li>
                  <li>The right to object to processing of your information</li>
                  <li>The right to data portability</li>
                  <li>The right to withdraw consent</li>
                </ul>
                <p>
                  To exercise these rights, please contact us through our <a href="/contact" className="text-terracotta hover:underline">Contact</a> page.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl text-chai-brown mb-4">9. Children's Privacy</h2>
                <p>
                  Our Website is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl text-chai-brown mb-4">10. International Data Transfers</h2>
                <p>
                  Your information may be transferred to and maintained on computers located outside of your state, province, country, or other governmental jurisdiction where data protection laws may differ. By using our Website, you consent to the transfer of your information to these locations.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl text-chai-brown mb-4">11. Changes to This Privacy Policy</h2>
                <p>
                  We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl text-chai-brown mb-4">12. Contact Us</h2>
                <p>
                  If you have any questions about this Privacy Policy or our data practices, please contact us through our <a href="/contact" className="text-terracotta hover:underline">Contact</a> page.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
