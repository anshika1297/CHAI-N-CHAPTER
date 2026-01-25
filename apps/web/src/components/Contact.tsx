'use client';

import Link from 'next/link';
import { Mail, Heart, Coffee } from 'lucide-react';

export default function Contact() {
  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-cream to-cream-dark">
      <div className="max-w-4xl mx-auto text-center">
        {/* Decorative elements */}
        <div className="flex justify-center gap-4 mb-8">
          <Coffee className="text-chai-brown-light animate-float" size={24} />
          <Heart className="text-terracotta animate-float" size={24} style={{ animationDelay: '0.5s' }} />
          <Coffee className="text-chai-brown-light animate-float" size={24} style={{ animationDelay: '1s' }} />
        </div>

        <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-chai-brown mb-2">Let's Connect</h2>
        <p className="text-terracotta font-body italic text-base sm:text-lg mb-6 sm:mb-8">
          Over a cup of chai, of course!
        </p>

        <p className="text-chai-brown-light font-body text-base sm:text-lg leading-relaxed mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
          Whether you want to chat about books, discuss a potential collaboration, 
          or just say hello — I'd love to hear from you. Drop me a message and 
          let's start a conversation!
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

        {/* Newsletter hint */}
        <div className="mt-8 sm:mt-12 p-4 sm:p-6 bg-cream-light rounded-2xl border border-chai-brown/10 mx-2 sm:mx-0">
          <p className="text-chai-brown font-serif text-lg mb-2">
            Join the Reading List
          </p>
          <p className="text-chai-brown-light text-sm mb-4">
            Subscribe to get book recommendations and blog updates straight to your inbox.
          </p>
          <Link 
            href="/subscribe" 
            className="text-terracotta font-sans text-sm font-medium hover:underline"
          >
            Subscribe Now →
          </Link>
        </div>
      </div>
    </section>
  );
}
