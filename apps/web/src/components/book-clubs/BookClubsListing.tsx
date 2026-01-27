'use client';

import { useState, useEffect } from 'react';
import BookClubCard from './BookClubCard';
import { getPageSettings } from '@/lib/api';

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
  clubs: [
    { id: '1', name: 'Contemporary Fiction Circle', theme: 'Modern Stories & Real-Life Narratives', description: 'A cozy space for lovers of contemporary fiction. We explore modern stories that reflect our world, discuss character development, and share our thoughts on the latest releases.', logo: '', joinLink: 'https://example.com/join-contemporary', memberCount: 245, meetingFrequency: 'Monthly', nextMeeting: '2024-02-15' },
    { id: '2', name: 'Romance Readers United', theme: 'Love Stories & Happily Ever Afters', description: 'For all the romance enthusiasts! We dive into swoon-worthy love stories, discuss tropes we adore, and celebrate diverse romance novels from around the world.', logo: '', joinLink: 'https://example.com/join-romance', memberCount: 189, meetingFrequency: 'Bi-weekly', nextMeeting: '2024-02-08' },
    { id: '3', name: 'Mystery & Thriller Society', theme: 'Suspense, Twists & Page-Turners', description: 'Join us for spine-chilling discussions! We explore mysteries, psychological thrillers, and crime fiction. Perfect for those who love plot twists and solving mysteries.', logo: '', joinLink: 'https://example.com/join-mystery', memberCount: 312, meetingFrequency: 'Monthly', nextMeeting: '2024-02-20' },
    { id: '4', name: 'Indian Literature Collective', theme: 'Stories from the Subcontinent', description: 'Celebrating the rich tapestry of Indian literature. We read works by Indian authors, explore regional narratives, and discuss the diverse voices shaping contemporary Indian writing.', logo: '', joinLink: 'https://example.com/join-indian-lit', memberCount: 156, meetingFrequency: 'Monthly', nextMeeting: '2024-02-12' },
    { id: '5', name: 'Fantasy & Sci-Fi Enthusiasts', theme: 'Worlds Beyond Imagination', description: 'Escape into magical realms and futuristic worlds! We explore fantasy epics, science fiction adventures, and speculative fiction that transports us to incredible universes.', logo: '', joinLink: 'https://example.com/join-fantasy', memberCount: 278, meetingFrequency: 'Monthly', nextMeeting: '2024-02-18' },
    { id: '6', name: 'Non-Fiction Bookworms', theme: 'Learning & Real Stories', description: 'For curious minds who love learning! We explore biographies, memoirs, self-help, history, and thought-provoking non-fiction that expands our understanding of the world.', logo: '', joinLink: 'https://example.com/join-nonfiction', memberCount: 134, meetingFrequency: 'Monthly', nextMeeting: '2024-02-22' },
  ] as ClubCard[],
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
    <section className="pt-24 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-chai-brown mb-3">{data.pageTitle}</h1>
          <p className="text-terracotta font-body italic text-lg mb-4">{data.pageSubtitle}</p>
          <p className="text-chai-brown-light font-body text-base max-w-2xl mx-auto">{data.pageIntro}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {data.clubs.map((club) => (
            <BookClubCard key={club.id} {...club} />
          ))}
        </div>
        <div className="mt-12 text-center">
          <p className="text-chai-brown-light font-body mb-4">{data.pageCtaText}</p>
          <a href={data.pageCtaHref} className="btn-primary inline-block">{data.pageCtaLabel}</a>
        </div>
      </div>
    </section>
  );
}
