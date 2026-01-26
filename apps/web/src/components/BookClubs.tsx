'use client';

import Link from 'next/link';
import { ArrowRight, Instagram, MessageCircle, Users } from 'lucide-react';

// Dummy data for now
const bookClubs = [
  {
    name: 'The Chai Circle',
    description: 'A cozy community for slow readers who love to discuss books over virtual chai sessions.',
    platform: 'instagram',
    members: '500+',
    focus: 'Fiction & Literary',
  },
  {
    name: 'Desi Readers Club',
    description: 'Celebrating South Asian literature and authors. Monthly reads featuring diverse voices.',
    platform: 'whatsapp',
    members: '300+',
    focus: 'Indian Literature',
  },
  {
    name: 'Romance Readers United',
    description: 'For those who believe in happily-ever-afters. We read and swoon together!',
    platform: 'instagram',
    members: '400+',
    focus: 'Romance',
  },
];

const platformIcons = {
  instagram: Instagram,
  whatsapp: MessageCircle,
};

export default function BookClubs() {
  return (
    <section className="py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-chai-brown text-cream">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif mb-2">Book Clubs</h2>
          <p className="text-terracotta-light font-body italic text-lg mb-4">
            Join our reading communities
          </p>
          <p className="text-cream/80 max-w-2xl mx-auto">
            Find your tribe! Join one of our book clubs and connect with fellow readers 
            who share your love for stories.
          </p>
        </div>

        {/* Clubs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {bookClubs.map((club, index) => {
            const PlatformIcon = platformIcons[club.platform as keyof typeof platformIcons] || Users;
            
            return (
              <div 
                key={club.name}
                className="bg-cream/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-cream/15 transition-all duration-300 group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Platform badge */}
                <div className="flex items-center gap-2 mb-4">
                  <PlatformIcon size={18} className="text-terracotta-light" />
                  <span className="text-xs uppercase tracking-wider text-cream/60">
                    {club.platform}
                  </span>
                </div>

                <h3 className="font-serif text-xl mb-2 group-hover:text-terracotta-light transition-colors">
                  {club.name}
                </h3>
                
                <p className="text-cream/70 text-sm mb-4 leading-relaxed">
                  {club.description}
                </p>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-sage-light">{club.focus}</span>
                  <span className="text-cream/60">{club.members} members</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link 
            href="/book-clubs" 
            className="inline-flex items-center gap-2 bg-cream text-chai-brown px-6 py-3 rounded-full font-sans font-medium hover:bg-cream-dark transition-all duration-300 hover:shadow-lg"
          >
            Explore All Book Clubs
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
