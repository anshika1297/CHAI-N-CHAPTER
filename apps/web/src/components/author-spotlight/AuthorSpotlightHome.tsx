'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getAuthorSpotlightsPublic, type AuthorSpotlightListItem } from '@/lib/api';
import AuthorSpotlightCard from './AuthorSpotlightCard';

const HOME_SPOTLIGHT_LIMIT = 4;

export default function AuthorSpotlightHome() {
  const [spotlights, setSpotlights] = useState<AuthorSpotlightListItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getAuthorSpotlightsPublic()
      .then((data) => {
        const list = (data.spotlights ?? []).slice(0, HOME_SPOTLIGHT_LIMIT);
        if (list.length) setSpotlights(list);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  // Only show when at least one published author spotlight exists
  if (!ready || spotlights.length === 0) return null;

  return (
    <section className="py-6 sm:py-12 md:py-16">
      <div className="site-container">
        <div className="text-center mb-6 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-chai-brown mb-2">Author spotlight</h2>
          <p className="section-subheading mb-4 sm:mb-8">Celebrating writers and voices we love</p>
        </div>

        <ul className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
          {spotlights.map((spotlight, index) => (
            <li key={spotlight.id} className="h-full animate-fade-in-up" style={{ animationDelay: `${index * 80}ms` }}>
              <AuthorSpotlightCard spotlight={spotlight} />
            </li>
          ))}
        </ul>

        <div className="text-center mt-6 sm:mt-8">
          <Link href="/author-spotlight" className="inline-flex items-center gap-2 btn-secondary">
            View all spotlights
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
