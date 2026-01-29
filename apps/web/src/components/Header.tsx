'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { getPageSettings, getImageUrl } from '@/lib/api';

const defaultNavLinks = [
  { name: 'Home', href: '/' },
  { name: 'About Me', href: '/about' },
  { name: 'Book Reviews', href: '/blog' },
  { name: 'Book Recommendations', href: '/recommendations' },
  { name: 'Her Musings Verse', href: '/musings' },
  { name: 'Book Clubs', href: '/book-clubs' },
  { name: 'Work With Me', href: '/work-with-me' },
];

const defaultSiteName = 'Chapters.aur.Chai';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [siteName, setSiteName] = useState(defaultSiteName);
  const [navLinks, setNavLinks] = useState(defaultNavLinks);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    getPageSettings('header')
      .then(({ content }) => {
        if (content && typeof content === 'object' && !Array.isArray(content)) {
          const c = content as { siteName?: string; navLinks?: { name: string; href: string }[] };
          if (typeof c.siteName === 'string' && c.siteName.trim()) setSiteName(c.siteName.trim());
          if (Array.isArray(c.navLinks) && c.navLinks.length > 0) {
            setNavLinks(
              c.navLinks
                .filter((l): l is { name: string; href: string } => typeof l?.name === 'string' && typeof l?.href === 'string')
                .map((l) => ({ name: l.name.trim(), href: l.href.trim() || '/' }))
            );
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    getPageSettings('footer')
      .then(({ content }) => {
        if (content && typeof content === 'object' && !Array.isArray(content)) {
          const c = content as { logoUrl?: string };
          if (typeof c.logoUrl === 'string' && c.logoUrl.trim()) setLogoUrl(c.logoUrl.trim());
        }
      })
      .catch(() => {});
  }, []);

  const logoSrc = logoUrl ? getImageUrl(logoUrl) : '';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || isMenuOpen ? 'bg-cream shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between py-4 gap-6">
          <Link href="/" className="flex items-center group shrink-0">
            {logoSrc ? (
              <span className="relative block w-14 h-9 md:w-16 md:h-10 shrink-0 overflow-hidden flex-shrink-0">
                <Image
                  src={logoSrc}
                  alt=""
                  fill
                  className="object-contain object-left"
                  sizes="64px"
                  unoptimized={logoSrc.startsWith('/')}
                />
              </span>
            ) : null}
            <span className="font-serif text-2xl md:text-3xl text-chai-brown tracking-wide group-hover:text-terracotta transition-colors whitespace-nowrap">
              {siteName}
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-0 ml-auto min-w-0">
            {navLinks.map((link, index) => (
              <div key={link.name} className="flex items-center">
                {index > 0 && (
                  <span className="h-4 w-px bg-chai-brown/20 mx-3 xl:mx-4" />
                )}
                <Link
                  href={link.href}
                  className="nav-link text-xs xl:text-sm whitespace-nowrap"
                >
                  {link.name}
                </Link>
              </div>
            ))}
          </nav>

          <button
            className="lg:hidden text-chai-brown p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ${
            isMenuOpen ? 'max-h-96 pb-4' : 'max-h-0'
          }`}
        >
          <nav className="flex flex-col gap-4 pt-4 border-t border-chai-brown/10">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-chai-brown font-sans py-2 hover:text-terracotta transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
