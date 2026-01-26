'use client';

import Link from 'next/link';
import { Instagram, Twitter, Youtube, Mail, Heart } from 'lucide-react';

const socialLinks = [
  { name: 'Instagram', icon: Instagram, href: 'https://instagram.com/chainchapter' },
  { name: 'Twitter', icon: Twitter, href: 'https://twitter.com/chainchapter' },
  { name: 'YouTube', icon: Youtube, href: 'https://youtube.com/@chainchapter' },
  { name: 'Email', icon: Mail, href: 'mailto:hello@chainchapter.com' },
];

const quickLinks = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Book Reviews', href: '/blog?category=reviews' },
  { name: 'Recommendations', href: '/blog?category=recommendations' },
  { name: 'Book Clubs', href: '/book-clubs' },
  { name: 'Contact', href: '/contact' },
];

export default function Footer() {
  return (
    <footer className="bg-chai-brown text-cream">
      {/* Main Footer */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-block mb-4">
              <span className="font-serif text-2xl tracking-wide">chai.n.chapter</span>
            </Link>
            <p className="text-cream/70 text-sm leading-relaxed mb-4">
              A cozy corner of the internet where books meet chai, 
              and every story finds a home.
            </p>
            
            {/* Social Links */}
            <div className="flex gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-cream/10 flex items-center justify-center hover:bg-terracotta transition-colors"
                    aria-label={social.name}
                  >
                    <Icon size={18} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-serif text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-cream/70 hover:text-terracotta-light transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-serif text-lg mb-4">Stay Connected</h3>
            <p className="text-cream/70 text-sm mb-4">
              Get the latest book recommendations and blog updates.
            </p>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-4 py-2 rounded-full bg-cream/10 border border-cream/20 text-cream placeholder:text-cream/50 text-sm focus:outline-none focus:border-terracotta"
              />
              <button 
                type="submit"
                className="px-4 py-2 bg-terracotta rounded-full text-sm font-medium hover:bg-terracotta-dark transition-colors"
              >
                Join
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-cream/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 text-xs sm:text-sm text-cream/60">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
              <p>
                © {new Date().getFullYear()} chai.n.chapter. All rights reserved.
              </p>
              <div className="flex items-center gap-3">
                <Link href="/terms" className="hover:text-terracotta-light transition-colors">
                  Terms & Conditions
                </Link>
                <span className="text-cream/40">|</span>
                <Link href="/privacy" className="hover:text-terracotta-light transition-colors">
                  Privacy Policy
                </Link>
              </div>
            </div>
            <p className="flex items-center gap-1">
              Made with <Heart size={14} className="text-terracotta" fill="currentColor" /> and lots of chai
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
