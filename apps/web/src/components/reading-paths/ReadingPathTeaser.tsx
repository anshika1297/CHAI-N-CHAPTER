'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Map } from 'lucide-react';
import ReadingPathView from './ReadingPathView';
import type { ResolvedReadingPath } from '@/lib/readingPaths/types';

type Props = {
  category?: string;
  tags?: string[];
  className?: string;
};

/** Shows the first matching reading path on review pages (dynamic fetch). */
export default function ReadingPathTeaser({ category, tags = [], className = '' }: Props) {
  const [path, setPath] = useState<ResolvedReadingPath | null>(null);
  const [loaded, setLoaded] = useState(false);

  const key = `${category ?? ''}|${tags.join(',')}`;

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    const params = new URLSearchParams();
    if (category?.trim()) params.set('category', category.trim());
    if (tags.length) params.set('tags', tags.join(','));
    fetch(`/api/reading-paths/match?${params}`)
      .then((res) => (res.ok ? res.json() : { paths: [] }))
      .then((data: { paths?: ResolvedReadingPath[] }) => {
        if (!cancelled) setPath(data.paths?.[0] ?? null);
      })
      .catch(() => {
        if (!cancelled) setPath(null);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [key, category, tags]);

  if (!loaded || !path) return null;

  return (
    <div className={`my-8 sm:my-10 rounded-2xl border border-chai-brown/10 bg-cream-dark/30 p-5 sm:p-7 ${className}`}>
      <ReadingPathView path={path} compact />
      <Link
        href={path.pageHref}
        className="mt-5 inline-flex items-center gap-2 text-sm font-sans font-medium text-terracotta hover:gap-3 transition-all"
      >
        View full reading path
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
