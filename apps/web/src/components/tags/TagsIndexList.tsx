'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { TagIndexEntry } from '@/lib/tags';

type Props = {
  initialTags: TagIndexEntry[];
};

export default function TagsIndexList({ initialTags }: Props) {
  const [tags, setTags] = useState(initialTags);
  const [loading, setLoading] = useState(initialTags.length === 0);

  useEffect(() => {
    if (initialTags.length > 0) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/tags', { headers: { Accept: 'application/json' } });
        if (!res.ok) return;
        const data = (await res.json()) as { tags?: TagIndexEntry[] };
        if (!cancelled && Array.isArray(data.tags) && data.tags.length > 0) {
          setTags(data.tags);
        }
      } catch {
        /* keep empty state */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialTags.length]);

  if (loading) {
    return <p className="font-body text-chai-brown-light">Loading tags…</p>;
  }

  if (tags.length === 0) {
    return (
      <p className="font-body text-chai-brown-light">Tags will appear as you add them in the CMS.</p>
    );
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <li key={tag.slug}>
          <Link
            href={`/tags/${tag.slug}`}
            className="inline-flex items-center gap-2 rounded-full border border-chai-brown/15 bg-cream-light px-4 py-2 font-body text-sm text-chai-brown hover:border-terracotta/40 transition-colors"
          >
            {tag.label}
            <span className="text-chai-brown-light">({tag.count})</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
