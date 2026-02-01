'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getPageSettings, getImageUrl } from '@/lib/api';

const defaultHome = {
  welcomeText: 'Welcome to my cozy corner',
  headingLine1: 'Where Chai Meets',
  headingLine2: 'Stories',
  introText: "Hello, I'm Anshika — a book lover, chai enthusiast, and storyteller at heart. Join me as I share honest book reviews, curated recommendations, and reflections from my reading journey.",
  stats: [
    { value: '50+', label: 'Book Reviews' },
    { value: '2K+', label: 'Readers' },
    { value: '3', label: 'Book Clubs' },
  ],
  ctaPrimary: 'Read My Story',
  ctaPrimaryHref: '/about',
  ctaSecondary: 'Explore Blogs',
  ctaSecondaryHref: '/blog',
  imageUrl: '',
};

export default function Hero() {
  const [data, setData] = useState(defaultHome);

  useEffect(() => {
    getPageSettings('home')
      .then(({ content }) => {
        if (content && typeof content === 'object' && !Array.isArray(content)) {
          const c = content as Record<string, unknown>;
          setData({
            welcomeText: (typeof c.welcomeText === 'string' && c.welcomeText.trim() ? c.welcomeText : defaultHome.welcomeText),
            headingLine1: (typeof c.headingLine1 === 'string' && c.headingLine1.trim() ? c.headingLine1 : defaultHome.headingLine1),
            headingLine2: (typeof c.headingLine2 === 'string' && c.headingLine2.trim() ? c.headingLine2 : defaultHome.headingLine2),
            introText: (typeof c.introText === 'string' && c.introText.trim() ? c.introText : defaultHome.introText),
            stats: Array.isArray(c.stats) && c.stats.length > 0
              ? (c.stats as { value?: string; label?: string }[])
                  .filter((s): s is { value: string; label: string } => typeof s?.value === 'string' && typeof s?.label === 'string')
                  .map((s) => ({ value: s.value.trim(), label: s.label.trim() }))
              : defaultHome.stats,
            ctaPrimary: (typeof c.ctaPrimary === 'string' && c.ctaPrimary.trim() ? c.ctaPrimary : defaultHome.ctaPrimary),
            ctaPrimaryHref: (typeof c.ctaPrimaryHref === 'string' && c.ctaPrimaryHref.trim() ? c.ctaPrimaryHref : defaultHome.ctaPrimaryHref),
            ctaSecondary: (typeof c.ctaSecondary === 'string' && c.ctaSecondary.trim() ? c.ctaSecondary : defaultHome.ctaSecondary),
            ctaSecondaryHref: (typeof c.ctaSecondaryHref === 'string' && c.ctaSecondaryHref.trim() ? c.ctaSecondaryHref : defaultHome.ctaSecondaryHref),
            imageUrl: typeof c.imageUrl === 'string' ? c.imageUrl : '',
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="pt-24 sm:pt-28 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto w-full">
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 items-center">
          <div className="order-1 md:order-1 animate-fade-in w-full max-w-xs mx-auto md:max-w-md lg:max-w-lg">
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-20 h-20 bg-sage/30 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-terracotta/20 rounded-full blur-2xl" />
              <div className="relative rounded-2xl overflow-hidden shadow-2xl w-full">
                <div className="aspect-square bg-chai-brown relative flex items-center justify-center">
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)' }} />
                  {data.imageUrl ? (
                    <img src={getImageUrl(data.imageUrl)} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="relative z-10 text-center px-4">
                      <p className="font-serif text-lg text-cream/90 font-medium">Author Image</p>
                      <p className="font-body text-xs text-cream/70 mt-2">Placeholder</p>
                    </div>
                  )}
                  <div className="absolute bottom-3 right-3 w-10 h-10 bg-cream/80 rounded-full shadow-md flex items-center justify-center animate-float z-20">
                    <span className="text-lg">☕</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="order-2 md:order-2 text-center md:text-left animate-fade-in-up">
            <p className="text-terracotta font-body italic text-lg mb-4">{data.welcomeText}</p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif text-chai-brown mb-4 sm:mb-6 leading-tight">
              {data.headingLine1}
              <span className="block text-terracotta">{data.headingLine2}</span>
            </h1>
            <p className="text-chai-brown-light font-body text-base sm:text-lg leading-relaxed mb-6 sm:mb-8 max-w-lg mx-auto md:mx-0">
              {data.introText}
            </p>
            <div className="flex flex-col xs:flex-row sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start">
              <Link href={data.ctaPrimaryHref} className="btn-primary">
                {data.ctaPrimary}
              </Link>
              <Link href={data.ctaSecondaryHref} className="btn-secondary">
                {data.ctaSecondary}
              </Link>
            </div>
            <div className="mt-6 sm:mt-8 flex justify-center md:justify-start gap-6 sm:gap-8">
              {data.stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-2xl sm:text-3xl font-serif text-chai-brown">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-chai-brown-light">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
