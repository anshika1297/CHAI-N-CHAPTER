import crypto from 'crypto';
import { ReactionCounts } from '../models/ReactionCounts.js';
import { ReactionVote } from '../models/ReactionVote.js';
import {
  isValidReaction,
  publicReactionMeta,
  reactionIdsForType,
  type ReactionContentType,
} from '../config/reactionTypes.js';
import { commentTargetExists } from './commentContent.js';
import { resolveSubscriberForComment } from './subscriberComment.js';

const CACHE_TTL_MS = 30_000;
const cache = new Map<string, { at: number; data: ReactionSnapshot }>();

export type ReactionSnapshot = {
  counts: Record<string, number>;
  total: number;
  reactions: ReturnType<typeof publicReactionMeta>;
  userReaction: string | null;
  summaries: string[];
};

function cacheKey(contentType: ReactionContentType, contentSlug: string, voterKey?: string): string {
  return `${contentType}:${contentSlug}:${voterKey ?? ''}`;
}

function invalidateCache(contentType: ReactionContentType, contentSlug: string): void {
  const prefix = `${contentType}:${contentSlug}:`;
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

function countsToRecord(counts: Map<string, number> | Record<string, number> | undefined): Record<string, number> {
  const out: Record<string, number> = {};
  if (!counts) return out;
  if (counts instanceof Map) {
    for (const [k, v] of counts.entries()) out[k] = v;
  } else {
    for (const [k, v] of Object.entries(counts)) out[k] = v;
  }
  return out;
}

function buildSummaries(
  contentType: ReactionContentType,
  counts: Record<string, number>
): string[] {
  return publicReactionMeta(contentType)
    .filter((r) => r.summaryLabel && (counts[r.id] ?? 0) > 0)
    .sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0))
    .map((r) => r.summaryLabel!(counts[r.id] ?? 0));
}

function normalizeCounts(
  contentType: ReactionContentType,
  raw: Record<string, number>
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const id of reactionIdsForType(contentType)) {
    out[id] = Math.max(0, Math.floor(raw[id] ?? 0));
  }
  return out;
}

export function resolveReactionVoterKey(input: {
  voterKey?: string;
  subscriberToken?: string;
}): string | null {
  if (input.subscriberToken?.trim()) {
    // Verified at vote time; here we only derive key from token payload without DB hit
    return null; // caller uses async resolveVoterKeyAsync
  }
  const key = typeof input.voterKey === 'string' ? input.voterKey.trim() : '';
  if (/^[a-f0-9]{32,64}$/i.test(key)) return key.slice(0, 64);
  return null;
}

export async function resolveVoterKeyAsync(input: {
  voterKey?: string;
  subscriberToken?: string;
}): Promise<string | null> {
  if (input.subscriberToken?.trim()) {
    const sub = await resolveSubscriberForComment(input.subscriberToken.trim());
    if (sub) return crypto.createHash('sha256').update(`sub:${sub.email}`).digest('hex').slice(0, 64);
  }
  return resolveReactionVoterKey(input);
}

async function loadCountsDoc(contentType: ReactionContentType, contentSlug: string) {
  return ReactionCounts.findOne({ contentType, contentSlug: contentSlug.trim().toLowerCase() }).lean();
}

export async function getReactionSnapshot(
  contentType: ReactionContentType,
  contentSlug: string,
  voterKey?: string
): Promise<ReactionSnapshot> {
  const slug = contentSlug.trim().toLowerCase();
  const ck = cacheKey(contentType, slug, voterKey);
  const hit = cache.get(ck);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data;

  const [countsDoc, userVote] = await Promise.all([
    loadCountsDoc(contentType, slug),
    voterKey
      ? ReactionVote.findOne({ contentType, contentSlug: slug, voterKey }).select('reactionId').lean()
      : Promise.resolve(null),
  ]);

  const rawCounts = countsToRecord(countsDoc?.counts as Map<string, number> | undefined);
  const normalized = normalizeCounts(contentType, rawCounts);
  const total =
    countsDoc?.total ?? Object.values(normalized).reduce((sum, n) => sum + n, 0);
  const counts: Record<string, number> = {};
  for (const id of reactionIdsForType(contentType)) {
    counts[id] = normalized[id] ?? 0;
  }

  const data: ReactionSnapshot = {
    counts,
    total,
    reactions: publicReactionMeta(contentType),
    userReaction: userVote?.reactionId ?? null,
    summaries: buildSummaries(contentType, counts),
  };
  cache.set(ck, { at: Date.now(), data });
  return data;
}

async function bumpCount(
  contentType: ReactionContentType,
  slug: string,
  reactionId: string,
  delta: number
): Promise<void> {
  const inc: Record<string, number> = { [`counts.${reactionId}`]: delta, total: delta };
  await ReactionCounts.findOneAndUpdate(
    { contentType, contentSlug: slug },
    { $inc: inc, $setOnInsert: { contentType, contentSlug: slug } },
    { upsert: true, new: true }
  );
}

export async function setReaction(input: {
  contentType: ReactionContentType;
  contentSlug: string;
  reactionId: string;
  voterKey: string;
}): Promise<ReactionSnapshot> {
  const slug = input.contentSlug.trim().toLowerCase();
  const { contentType, reactionId, voterKey } = input;

  if (!isValidReaction(contentType, reactionId)) {
    throw new Error('Invalid reaction');
  }
  if (!(await commentTargetExists(contentType, slug))) {
    throw new Error('Content not found');
  }

  const existing = await ReactionVote.findOne({ contentType, contentSlug: slug, voterKey });
  if (existing?.reactionId === reactionId) {
    return getReactionSnapshot(contentType, slug, voterKey);
  }

  if (existing) {
    await bumpCount(contentType, slug, existing.reactionId, -1);
    existing.reactionId = reactionId;
    await existing.save();
    await bumpCount(contentType, slug, reactionId, 1);
  } else {
    await ReactionVote.create({
      contentType,
      contentSlug: slug,
      reactionId,
      voterKey,
    });
    await bumpCount(contentType, slug, reactionId, 1);
  }

  invalidateCache(contentType, slug);
  return getReactionSnapshot(contentType, slug, voterKey);
}
