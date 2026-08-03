'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  fetchReactions,
  submitReaction,
  type ReactionContentType,
  type ReactionSnapshot,
} from '@/lib/reactions';

type Props = {
  contentType: ReactionContentType;
  slug: string;
};

export default function ReaderReactions({ contentType, slug }: Props) {
  const [data, setData] = useState<ReactionSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await fetchReactions(contentType, slug);
      setData(snapshot);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [contentType, slug]);

  useEffect(() => {
    load();
  }, [load]);

  const handleReact = async (reactionId: string) => {
    if (pendingId || data?.userReaction === reactionId) return;
    setError(null);
    setPendingId(reactionId);

    const prev = data;
    if (prev) {
      const optimistic: ReactionSnapshot = {
        ...prev,
        userReaction: reactionId,
        counts: { ...prev.counts },
        total: prev.total,
      };
      if (prev.userReaction && optimistic.counts[prev.userReaction]) {
        optimistic.counts[prev.userReaction] = Math.max(0, optimistic.counts[prev.userReaction] - 1);
        optimistic.total = Math.max(0, optimistic.total - 1);
      }
      optimistic.counts[reactionId] = (optimistic.counts[reactionId] ?? 0) + 1;
      optimistic.total += 1;
      setData(optimistic);
    }

    try {
      const snapshot = await submitReaction({ contentType, contentSlug: slug, reactionId });
      setData(snapshot);
    } catch (err) {
      setData(prev);
      setError(err instanceof Error ? err.message : 'Could not save reaction');
    } finally {
      setPendingId(null);
    }
  };

  const reactions = data?.reactions ?? [];
  const summaries = data?.summaries ?? [];

  return (
    <section
      className="mb-10 pt-8 border-t border-chai-brown/10"
      aria-labelledby="reader-reactions-heading"
    >
      <h2 id="reader-reactions-heading" className="font-serif text-xl sm:text-2xl text-chai-brown mb-1">
        Reader reactions
      </h2>
      <p className="font-body text-sm text-chai-brown-light mb-5">
        Tap a reaction — no comment needed.
        {data && data.total > 0 ? (
          <span className="ml-1 text-chai-brown">
            {data.total} reaction{data.total === 1 ? '' : 's'} so far.
          </span>
        ) : null}
      </p>

      {loading && !data ? (
        <div
          className="flex flex-wrap gap-2"
          aria-busy="true"
          aria-label="Loading reactions"
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-11 sm:h-12 w-28 sm:w-36 rounded-full bg-chai-brown/8 animate-pulse"
            />
          ))}
        </div>
      ) : reactions.length > 0 ? (
        <div
          role="group"
          aria-label="Choose a reader reaction"
          className="flex flex-wrap gap-2 sm:gap-2.5 -mx-0.5"
        >
          {reactions.map((reaction) => {
            const count = data?.counts[reaction.id] ?? 0;
            const selected = data?.userReaction === reaction.id;
            const busy = pendingId === reaction.id;
            return (
              <button
                key={reaction.id}
                type="button"
                onClick={() => handleReact(reaction.id)}
                disabled={Boolean(pendingId)}
                aria-pressed={selected}
                aria-label={`${reaction.label}${count > 0 ? `, ${count} readers` : ''}`}
                className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full border text-left transition-all duration-200 min-h-[44px] touch-manipulation ${
                  selected
                    ? 'border-terracotta bg-terracotta/12 text-chai-brown shadow-sm ring-2 ring-terracotta/25'
                    : 'border-chai-brown/15 bg-white/80 text-chai-brown hover:border-terracotta/40 hover:bg-cream-light'
                } ${busy ? 'opacity-70' : ''}`}
              >
                <span className="text-lg sm:text-xl leading-none shrink-0" aria-hidden>
                  {reaction.emoji}
                </span>
                <span className="flex flex-col min-w-0">
                  <span className="font-sans text-xs sm:text-sm font-medium leading-tight truncate max-w-[9rem] sm:max-w-none">
                    {reaction.label}
                  </span>
                  {count > 0 ? (
                    <span className="font-sans text-[10px] sm:text-xs text-chai-brown-light tabular-nums">
                      {count}
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {error ? (
        <p className="mt-3 text-sm text-red-600 font-body" role="alert">
          {error}
        </p>
      ) : null}

      {summaries.length > 0 ? (
        <ul className="mt-5 space-y-1.5" aria-label="Reaction highlights">
          {summaries.slice(0, 3).map((line) => (
            <li key={line} className="font-body text-sm text-chai-brown/85 flex items-start gap-2">
              <span className="text-terracotta shrink-0" aria-hidden>
                ·
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
