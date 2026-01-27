'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail, Heart, Coffee } from 'lucide-react';
import { getPageSettings } from '@/lib/api';

const defaultHeader = {
  title: "Let's Connect",
  subtitle: 'Over a cup of chai, of course!',
  description: "Whether you want to chat about books, discuss a potential collaboration, or just say hello — I'd love to hear from you. Drop me a message and let's start a conversation!",
};

export default function Contact() {
  const [header, setHeader] = useState(defaultHeader);

  useEffect(() => {
    getPageSettings('contact')
      .then(({ content }) => {
        if (content && typeof content === 'object' && !Array.isArray(content)) {
          const c = content as { header?: { title?: string; subtitle?: string; description?: string } };
          if (c.header && typeof c.header === 'object') {
            setHeader({
              title: (typeof c.header.title === 'string' && c.header.title.trim() ? c.header.title : defaultHeader.title),
              subtitle: (typeof c.header.subtitle === 'string' && c.header.subtitle.trim() ? c.header.subtitle : defaultHeader.subtitle),
              description: (typeof c.header.description === 'string' && c.header.description.trim() ? c.header.description : defaultHeader.description),
            });
          }
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-cream to-cream-dark">
      <div className="max-w-4xl mx-auto text-center">
        <div className="flex justify-center gap-4 mb-6">
          <Coffee className="text-chai-brown-light animate-float" size={24} />
          <Heart className="text-terracotta animate-float" size={24} style={{ animationDelay: '0.5s' }} />
          <Coffee className="text-chai-brown-light animate-float" size={24} style={{ animationDelay: '1s' }} />
        </div>

        <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-chai-brown mb-2">{header.title}</h2>
        <p className="text-terracotta font-body italic text-base sm:text-lg mb-6 sm:mb-8">{header.subtitle}</p>
        <p className="text-chai-brown-light font-body text-base sm:text-lg leading-relaxed mb-6 max-w-2xl mx-auto px-2">
          {header.description}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/contact" className="btn-primary inline-flex items-center justify-center gap-2">
            <Mail size={18} />
            Get In Touch
          </Link>
          <Link href="/work-with-me" className="btn-secondary inline-flex items-center justify-center gap-2">
            Work With Me
          </Link>
        </div>

        <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-cream-light rounded-2xl border border-chai-brown/10 mx-2 sm:mx-0">
          <p className="text-chai-brown font-serif text-lg mb-2">Join the Reading List</p>
          <p className="text-chai-brown-light text-sm mb-4">
            Subscribe to get book recommendations and blog updates straight to your inbox.
          </p>
          <Link href="/subscribe" className="text-terracotta font-sans text-sm font-medium hover:underline">
            Subscribe Now →
          </Link>
        </div>
      </div>
    </section>
  );
}
