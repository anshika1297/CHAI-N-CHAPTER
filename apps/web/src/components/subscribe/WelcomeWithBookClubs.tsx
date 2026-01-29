'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getBookClubs } from '@/lib/api';
import { BookOpen } from 'lucide-react';

type Club = {
  id: string;
  name: string;
  theme?: string;
  description?: string;
  joinLink?: string;
};

function parseClubs(content: unknown): Club[] {
  if (!content || typeof content !== 'object' || Array.isArray(content)) return [];
  const c = content as { pageClubs?: unknown[]; clubs?: unknown[] };
  const raw = Array.isArray(c.pageClubs) ? c.pageClubs : Array.isArray(c.clubs) ? c.clubs : [];
  return raw
    .filter((x): x is Record<string, unknown> => x != null && typeof x === 'object' && typeof (x as { name?: unknown }).name === 'string')
    .map((x) => ({
      id: String(x.id ?? x.name),
      name: String(x.name).trim(),
      theme: typeof x.theme === 'string' ? x.theme.trim() : undefined,
      joinLink: typeof x.joinLink === 'string' && x.joinLink.trim() ? x.joinLink.trim() : undefined,
    }))
    .slice(0, 12);
}

export default function WelcomeWithBookClubs() {
  const [clubs, setClubs] = useState<Club[]>([]);

  useEffect(() => {
    getBookClubs()
      .then(({ content }) => setClubs(parseClubs(content)))
      .catch(() => {});
  }, []);

  return (
    <div className="bg-cream-light border border-chai-brown/10 rounded-2xl p-8 text-left">
      <p className="text-terracotta font-body text-lg mb-2">
        ✓ Welcome! You’re subscribed. We’ll send you book recommendations, blog updates, and reading lists.
      </p>
      <p className="text-chai-brown-light text-sm mb-4">
        You can unsubscribe at any time from the link in our emails.
      </p>
      <a href="/subscribe/unsubscribe" className="text-chai-brown-light text-sm hover:text-terracotta underline">
        Unsubscribe
      </a>

      {clubs.length > 0 && (
        <div className="mt-8 pt-6 border-t border-chai-brown/10">
          <h3 className="font-serif text-lg text-chai-brown mb-2 flex items-center gap-2">
            <BookOpen size={20} className="text-terracotta" />
            Interested in joining a book club?
          </h3>
          <p className="text-chai-brown-light text-sm mb-4">
            We have {clubs.length} book club{clubs.length !== 1 ? 's' : ''} you might like. Click to learn more or join.
          </p>
          <ul className="space-y-2">
            {clubs.map((club) => (
              <li key={club.id}>
                {club.joinLink ? (
                  <a
                    href={club.joinLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-terracotta font-body text-sm hover:underline"
                  >
                    {club.name}
                    {club.theme ? ` — ${club.theme}` : ''}
                  </a>
                ) : (
                  <Link
                    href="/book-clubs"
                    className="text-terracotta font-body text-sm hover:underline"
                  >
                    {club.name}
                    {club.theme ? ` — ${club.theme}` : ''}
                  </Link>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-4">
            <Link
              href="/book-clubs"
              className="text-terracotta font-body text-sm font-medium hover:underline"
            >
              View all book clubs →
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
