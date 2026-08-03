import { getFetchBaseUrl } from '@/lib/apiBase';
import { getSubscriberSession } from '@/lib/subscriberSession';

export type ReactionContentType = 'blog' | 'recommendations' | 'musings' | 'author-spotlight';

export type ReactionMeta = {
  id: string;
  emoji: string;
  label: string;
};

export type ReactionSnapshot = {
  counts: Record<string, number>;
  total: number;
  reactions: ReactionMeta[];
  userReaction: string | null;
  summaries: string[];
};

const VOTER_KEY = 'cnc_reaction_voter';

function randomVoterId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().replace(/-/g, '');
  }
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

/** Stable anonymous reader id — one reaction per article per browser. */
export function getReactionVoterKey(): string {
  if (typeof window === 'undefined') return '';
  try {
    let key = localStorage.getItem(VOTER_KEY);
    if (!key || !/^[a-f0-9]{32,64}$/i.test(key)) {
      key = randomVoterId();
      localStorage.setItem(VOTER_KEY, key);
    }
    return key;
  } catch {
    return randomVoterId();
  }
}

function sessionParams(): { voterKey?: string; subscriberToken?: string } {
  const subscriber = getSubscriberSession();
  if (subscriber?.commentToken) {
    return { subscriberToken: subscriber.commentToken };
  }
  const voterKey = getReactionVoterKey();
  return voterKey ? { voterKey } : {};
}

export async function fetchReactions(
  contentType: ReactionContentType,
  contentSlug: string
): Promise<ReactionSnapshot> {
  const params = new URLSearchParams({ contentType, contentSlug });
  const extra = sessionParams();
  if (extra.voterKey) params.set('voterKey', extra.voterKey);
  if (extra.subscriberToken) params.set('subscriberToken', extra.subscriberToken);

  const res = await fetch(`${getFetchBaseUrl()}/api/reactions?${params}`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 30 },
  });
  if (!res.ok) {
    return { counts: {}, total: 0, reactions: [], userReaction: null, summaries: [] };
  }
  return res.json() as Promise<ReactionSnapshot>;
}

export async function submitReaction(input: {
  contentType: ReactionContentType;
  contentSlug: string;
  reactionId: string;
}): Promise<ReactionSnapshot> {
  const extra = sessionParams();
  const res = await fetch(`${getFetchBaseUrl()}/api/reactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ ...input, ...extra }),
  });
  const data = (await res.json().catch(() => ({}))) as ReactionSnapshot & { error?: string };
  if (!res.ok) throw new Error(data.error || 'Failed to save reaction');
  return data;
}
