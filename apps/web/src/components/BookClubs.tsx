'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Instagram, MessageCircle, Users } from 'lucide-react';
import { getPageSettings } from '@/lib/api';

const defaultSection = {
  sectionTitle: 'Book Clubs',
  sectionSubtitle: 'Join our reading communities',
  sectionIntro: "Find your tribe! Join one of our book clubs and connect with fellow readers who share your love for stories.",
  sectionCtaText: 'Explore All Book Clubs',
  sectionCtaHref: '/book-clubs',
  clubs: [
    { name: 'The Chai Circle', description: 'A cozy community for slow readers who love to discuss books over virtual chai sessions.', platform: 'instagram', members: '500+', focus: 'Fiction & Literary' },
    { name: 'Desi Readers Club', description: 'Celebrating South Asian literature and authors. Monthly reads featuring diverse voices.', platform: 'whatsapp', members: '300+', focus: 'Indian Literature' },
    { name: 'Romance Readers United', description: 'For those who believe in happily-ever-afters. We read and swoon together!', platform: 'instagram', members: '400+', focus: 'Romance' },
  ] as { name: string; description: string; platform: string; members: string; focus: string }[],
};

const platformIcons: Record<string, typeof Instagram> = {
  instagram: Instagram,
  whatsapp: MessageCircle,
};

export default function BookClubs() {
  const [section, setSection] = useState(defaultSection);

  useEffect(() => {
    getPageSettings('book-clubs')
      .then(({ content }) => {
        if (content && typeof content === 'object' && !Array.isArray(content)) {
          const c = content as {
            sectionTitle?: string;
            sectionSubtitle?: string;
            sectionIntro?: string;
            sectionCtaText?: string;
            sectionCtaHref?: string;
            clubs?: { name?: string; description?: string; platform?: string; members?: string; focus?: string }[];
          };
          const next: typeof defaultSection = { ...defaultSection };
          if (typeof c.sectionTitle === 'string' && c.sectionTitle.trim()) next.sectionTitle = c.sectionTitle.trim();
          if (typeof c.sectionSubtitle === 'string' && c.sectionSubtitle.trim()) next.sectionSubtitle = c.sectionSubtitle.trim();
          if (typeof c.sectionIntro === 'string' && c.sectionIntro.trim()) next.sectionIntro = c.sectionIntro.trim();
          if (typeof c.sectionCtaText === 'string' && c.sectionCtaText.trim()) next.sectionCtaText = c.sectionCtaText.trim();
          if (typeof c.sectionCtaHref === 'string' && c.sectionCtaHref.trim()) next.sectionCtaHref = c.sectionCtaHref.trim();
          if (Array.isArray(c.clubs) && c.clubs.length > 0) {
            next.clubs = c.clubs
              .filter((x): x is Record<string, unknown> => x != null && typeof x === 'object' && typeof (x as { name?: unknown }).name === 'string' && typeof (x as { description?: unknown }).description === 'string')
              .map((x) => {
                const name = String(x.name).trim();
                const description = String(x.description).trim();
                const theme = typeof x.theme === 'string' ? x.theme.trim() : '';
                const memberCount = typeof x.memberCount === 'number' ? x.memberCount : (typeof x.memberCount === 'string' ? Number(x.memberCount) : 0);
                return {
                  name,
                  description,
                  platform: (typeof x.platform === 'string' ? x.platform : theme || 'instagram').toLowerCase(),
                  members: typeof x.members === 'string' ? x.members : (memberCount ? String(memberCount) + '+' : '—'),
                  focus: typeof x.focus === 'string' ? x.focus : theme,
                };
              });
          }
          setSection(next);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-chai-brown text-cream">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif mb-2">{section.sectionTitle}</h2>
          <p className="text-terracotta-light font-body italic text-lg mb-4">{section.sectionSubtitle}</p>
          <p className="text-cream/80 max-w-2xl mx-auto">{section.sectionIntro}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {section.clubs.map((club, index) => {
            const PlatformIcon = platformIcons[club.platform] || Users;
            return (
              <div key={club.name} className="bg-cream/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-cream/15 transition-all duration-300 group">
                <div className="flex items-center gap-2 mb-4">
                  <PlatformIcon size={18} className="text-terracotta-light" />
                  <span className="text-xs uppercase tracking-wider text-cream/60">{club.platform}</span>
                </div>
                <h3 className="font-serif text-xl mb-2 group-hover:text-terracotta-light transition-colors">{club.name}</h3>
                <p className="text-cream/70 text-sm mb-4 leading-relaxed">{club.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-sage-light">{club.focus}</span>
                  <span className="text-cream/60">{club.members} members</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="text-center">
          <Link href={section.sectionCtaHref} className="inline-flex items-center gap-2 bg-cream text-chai-brown px-6 py-3 rounded-full font-sans font-medium hover:bg-cream-dark transition-all duration-300 hover:shadow-lg">
            {section.sectionCtaText}
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
