'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Instagram, Facebook, Linkedin, Youtube, Mail, Heart, BookOpen, AtSign, LucideIcon } from 'lucide-react';
import { siteConfig } from '@/lib/seo';
import { getPageSettings } from '@/lib/api';

const iconMap: Record<string, LucideIcon> = {
  email: Mail,
  mail: Mail,
  instagram: Instagram,
  facebook: Facebook,
  goodreads: BookOpen,
  linkedin: Linkedin,
  threads: AtSign,
  youtube: Youtube,
};

/** Map contact page social name to footer icon key */
function socialNameToKey(name: string): string {
  const n = name.trim().toLowerCase();
  if (n === 'email') return 'email';
  if (n === 'instagram') return 'instagram';
  if (n === 'facebook') return 'facebook';
  if (n === 'goodreads') return 'goodreads';
  if (n === 'linkedin') return 'linkedin';
  if (n === 'threads') return 'threads';
  if (n === 'youtube') return 'youtube';
  return n.replace(/\s+/g, '');
}

const defaultSocialLinks = [
  { name: 'Email', key: 'email', href: `mailto:${siteConfig.email}` },
  { name: 'Instagram', key: 'instagram', href: siteConfig.social.instagram },
  { name: 'Facebook', key: 'facebook', href: siteConfig.social.facebook },
  { name: 'Goodreads', key: 'goodreads', href: siteConfig.social.goodreads },
  { name: 'LinkedIn', key: 'linkedin', href: siteConfig.social.linkedin },
  { name: 'Threads', key: 'threads', href: siteConfig.social.threads },
  { name: 'YouTube', key: 'youtube', href: siteConfig.social.youtube },
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
  const [socialLinks, setSocialLinks] = useState(defaultSocialLinks);

  useEffect(() => {
    getPageSettings('contact')
      .then(({ content }) => {
        if (content && typeof content === 'object' && !Array.isArray(content)) {
          const c = content as { socialLinks?: { name: string; url: string }[] };
          if (Array.isArray(c.socialLinks) && c.socialLinks.length > 0) {
            const links = c.socialLinks
              .filter((s): s is { name: string; url: string } => typeof s?.name === 'string' && typeof s?.url === 'string')
              .map((s) => ({
                name: s.name.trim(),
                key: socialNameToKey(s.name),
                href: (s.url && String(s.url).trim()) ? String(s.url).trim() : '#',
              }));
            if (links.length) setSocialLinks(links);
          }
        }
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="bg-chai-brown text-cream">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div>
            <Link href="/" className="inline-block mb-4">
              <span className="font-serif text-2xl tracking-wide">{siteConfig.name}</span>
            </Link>
            <p className="text-cream/70 text-sm leading-relaxed mb-4">
              A cozy corner of the internet where books meet chai, and every story finds a home.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => {
                const Icon = iconMap[social.key] ?? Mail;
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

      <div className="border-t border-cream/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 text-xs sm:text-sm text-cream/60">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
              <p>© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
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
