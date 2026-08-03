'use client';

import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { getPageSettings, getImageUrl } from '@/lib/api';
import HeaderSearchBar from '@/components/search/HeaderSearchBar';
import { DEFAULT_HEADER_NAV_LINKS, mergeHeaderNavLinks } from '@/lib/siteNav';

const defaultSiteName = 'Chapters.aur.Chai';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [siteName, setSiteName] = useState(defaultSiteName);
  const [navLinks, setNavLinks] = useState(DEFAULT_HEADER_NAV_LINKS);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [menuPanelTop, setMenuPanelTop] = useState(0);
  const mobileChromeRef = useRef<HTMLDivElement>(null);

  const updateMenuPanelTop = useCallback(() => {
    if (mobileChromeRef.current) {
      setMenuPanelTop(mobileChromeRef.current.getBoundingClientRect().bottom);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useLayoutEffect(() => {
    updateMenuPanelTop();
    window.addEventListener('resize', updateMenuPanelTop);
    return () => window.removeEventListener('resize', updateMenuPanelTop);
  }, [updateMenuPanelTop]);

  useLayoutEffect(() => {
    if (isMenuOpen) updateMenuPanelTop();
  }, [isMenuOpen, updateMenuPanelTop]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMenuOpen]);

  useEffect(() => {
    getPageSettings('header')
      .then(({ content }) => {
        if (content && typeof content === 'object' && !Array.isArray(content)) {
          const c = content as { siteName?: string; navLinks?: { name: string; href: string }[] };
          if (typeof c.siteName === 'string' && c.siteName.trim()) setSiteName(c.siteName.trim());
          if (Array.isArray(c.navLinks) && c.navLinks.length > 0) {
            const saved = c.navLinks
              .filter((l): l is { name: string; href: string } => typeof l?.name === 'string' && typeof l?.href === 'string')
              .map((l) => ({ name: l.name.trim(), href: l.href.trim() || '/' }));
            setNavLinks(mergeHeaderNavLinks(saved));
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

  const resolvedLogo = logoUrl ? getImageUrl(logoUrl) : '';
  const logoSrc = resolvedLogo && resolvedLogo.trim() ? resolvedLogo : '/logo.png';
  const solidHeader = isScrolled || isMenuOpen;

  const logoImage = (
    <span className="relative block w-full h-16 sm:h-20 lg:h-[4.5rem] xl:h-[4.75rem]">
      <Image
        src={logoSrc}
        alt={siteName}
        fill
        className="object-contain object-center lg:object-left"
        sizes="(max-width: 1024px) 55vw, 168px"
        unoptimized
        priority
      />
    </span>
  );

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-cream/95 lg:bg-cream shadow-sm ${
        solidHeader ? 'lg:shadow-sm' : 'lg:shadow-none'
      }`}
    >
      <div className="header-container">
        {/* Mobile: logo row, then search — menu is a fixed scrollable panel below */}
        <div ref={mobileChromeRef} className="lg:hidden pb-2.5">
          <div className="relative flex items-center justify-center pt-2">
            <button
              type="button"
              className="absolute left-0 top-1/2 -translate-y-1/2 text-chai-brown p-2 rounded-lg hover:bg-chai-brown/5 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <Link
              href="/"
              className="flex items-center justify-center w-[58%] max-w-[220px] mx-auto"
              onClick={() => setIsMenuOpen(false)}
            >
              {logoImage}
            </Link>
          </div>

          <div className="mt-2">
            <HeaderSearchBar variant="mobile" onActivate={() => setIsMenuOpen(false)} />
          </div>
        </div>

        {/* Desktop: logo | menu | search — single row, fixed logo width */}
        <div
          className={`hidden lg:flex lg:items-center lg:gap-3 xl:gap-5 2xl:gap-6 transition-[padding] duration-300 ${
            solidHeader ? 'py-1.5' : 'py-2'
          }`}
        >
          <Link
            href="/"
            className="flex shrink-0 items-center w-[7.5rem] xl:w-[9rem] 2xl:w-[10rem]"
          >
            {logoImage}
          </Link>

          <nav
            className="flex flex-1 flex-nowrap items-center justify-center gap-x-1.5 xl:gap-x-2 2xl:gap-x-2.5 min-w-0"
            aria-label="Main navigation"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="nav-link shrink-0 text-xs xl:text-sm whitespace-nowrap px-0.5"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center justify-end w-[7rem] xl:w-[9rem] 2xl:w-[10rem] min-w-0">
            <HeaderSearchBar variant="nav" />
          </div>
        </div>
      </div>

      {/* Mobile nav panel — fixed, fills screen below header, scrollable */}
      {isMenuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-x-0 bottom-0 z-[55] bg-chai-brown/20 lg:hidden cursor-default"
            style={{ top: menuPanelTop }}
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close menu"
          />
          <div
            className="fixed inset-x-0 bottom-0 z-[60] bg-cream border-t border-chai-brown/15 shadow-xl lg:hidden overflow-y-auto overscroll-contain"
            style={{ top: menuPanelTop }}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
          >
            <nav className="site-container py-4 pb-10 flex flex-col" aria-label="Mobile navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-chai-brown font-sans text-base py-3 border-b border-chai-brown/8 hover:text-terracotta transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>
        </>
      ) : null}
    </header>
  );
}
