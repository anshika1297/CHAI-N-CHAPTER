'use client';

import { useState, useEffect } from 'react';
import BookClubCard from './BookClubCard';
import { getPageSettings } from '@/lib/api';
import ExploreHubLinks from '@/components/content/ExploreHubLinks';

type ClubCard = {
  id: string;
  name: string;
  theme: string;
  description: string;
  logo: string;
  joinLink: string;
  memberCount: number;
  meetingFrequency: string;
  nextMeeting?: string;
};

const defaultPage = {
  pageTitle: 'Book Clubs',
  pageSubtitle: 'Join our community of passionate readers',
  pageIntro: "Connect with fellow book lovers, share your thoughts, and discover new stories together. Each club has its own unique theme and vibe. Find your perfect reading community!",
  pageCtaText: "Don't see a club that matches your interests?",
  pageCtaHref: '/contact',
  pageCtaLabel: 'Suggest a New Book Club',
  clubs: [] as ClubCard[],
};

function toClubCard(x: Record<string, unknown>): ClubCard | null {
  if (typeof x?.name !== 'string' || typeof x?.description !== 'string') return null;
  return {
    id: String(x.id ?? x.name),
    name: String(x.name).trim(),
    theme: typeof x.theme === 'string' ? x.theme.trim() : '',
    description: String(x.description).trim(),
    logo: typeof x.logo === 'string' ? x.logo : '',
    joinLink: typeof x.joinLink === 'string' && x.joinLink.trim() ? x.joinLink.trim() : '#',
    memberCount: typeof x.memberCount === 'number' ? x.memberCount : Number(x.memberCount) || 0,
    meetingFrequency: typeof x.meetingFrequency === 'string' ? x.meetingFrequency.trim() : 'Monthly',
    nextMeeting: typeof x.nextMeeting === 'string' && x.nextMeeting.trim() ? x.nextMeeting : undefined,
  };
}

export default function BookClubsListing() {
  const [data, setData] = useState(defaultPage);

  useEffect(() => {
    getPageSettings('book-clubs')
      .then(({ content }) => {
        if (content && typeof content === 'object' && !Array.isArray(content)) {
          const c = content as {
            pageTitle?: string;
            pageSubtitle?: string;
            pageIntro?: string;
            pageCtaText?: string;
            pageCtaHref?: string;
            pageCtaLabel?: string;
            pageClubs?: Record<string, unknown>[];
            clubs?: Record<string, unknown>[];
          };
          const next = { ...defaultPage };
          if (typeof c.pageTitle === 'string' && c.pageTitle.trim()) next.pageTitle = c.pageTitle.trim();
          if (typeof c.pageSubtitle === 'string' && c.pageSubtitle.trim()) next.pageSubtitle = c.pageSubtitle.trim();
          if (typeof c.pageIntro === 'string' && c.pageIntro.trim()) next.pageIntro = c.pageIntro.trim();
          if (typeof c.pageCtaText === 'string' && c.pageCtaText.trim()) next.pageCtaText = c.pageCtaText.trim();
          if (typeof c.pageCtaHref === 'string' && c.pageCtaHref.trim()) next.pageCtaHref = c.pageCtaHref.trim();
          if (typeof c.pageCtaLabel === 'string' && c.pageCtaLabel.trim()) next.pageCtaLabel = c.pageCtaLabel.trim();
          const rawClubs = Array.isArray(c.pageClubs) ? c.pageClubs : Array.isArray(c.clubs) ? c.clubs : [];
          const clubs = rawClubs.map(toClubCard).filter((x): x is ClubCard => x != null);
          if (clubs.length) next.clubs = clubs;
          setData(next);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="pt-24 pb-12 sm:pb-16 min-h-screen">
      <div className="site-container">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-chai-brown mb-3">{data.pageTitle}</h1>
          <p className="text-terracotta font-body italic text-lg mb-4">{data.pageSubtitle}</p>
          <p className="text-chai-brown-light font-body text-base max-w-2xl mx-auto">{data.pageIntro}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {data.clubs.length > 0 ? (
            data.clubs.map((club) => (
              <BookClubCard key={club.id} {...club} />
            ))
          ) : (
            <p className="col-span-full text-center font-body text-chai-brown-light py-12">
              Book clubs are being set up — check back soon or{' '}
              <a href="/contact" className="text-terracotta hover:underline">suggest one</a>.
            </p>
          )}
        </div>
        <div className="mt-12 text-center">
          <p className="text-chai-brown-light font-body mb-4">{data.pageCtaText}</p>
          <a href={data.pageCtaHref} className="btn-primary inline-block">{data.pageCtaLabel}</a>
        </div>
        <ExploreHubLinks intro="Explore reviews, recommendations, and reading guides" />
      </div>
    </section>
  );
}
