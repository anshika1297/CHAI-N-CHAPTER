import { collectContentForTopic } from '@/lib/metadata/taxonomy';
import { getTopicHubBySlug } from '@/lib/metadata/topicHubs';
import type { TaggedContentRef } from '@/lib/tags';
import type {
  ReadingPathDefinition,
  ReadingPathItem,
  ReadingPathStepKind,
  ResolvedReadingPath,
  ResolvedReadingPathStep,
} from './types';
import { getReadingPathBySlug, getReadingPathForHub, READING_PATHS } from './definitions';

const EDITORIAL_KINDS: ReadingPathStepKind[] = ['review', 'recommendation', 'author-spotlight', 'musing'];

function norm(s: string): string {
  return s.trim().toLowerCase();
}

function itemKey(item: { kind: string; slug: string }): string {
  return `${item.kind}:${item.slug}`;
}

function toPathItem(ref: TaggedContentRef): ReadingPathItem | null {
  if (!EDITORIAL_KINDS.includes(ref.kind as ReadingPathStepKind)) return null;
  return {
    kind: ref.kind as ReadingPathStepKind,
    slug: ref.slug,
    title: ref.title,
    excerpt: ref.excerpt,
    href: ref.href,
    image: ref.image,
  };
}

function scoreItem(item: TaggedContentRef, preferTags?: string[]): number {
  if (!preferTags?.length) return 0;
  const set = new Set(item.tags.map(norm));
  return preferTags.reduce((acc, t) => acc + (set.has(norm(t)) ? 1 : 0), 0);
}

function pickStepItems(
  pool: TaggedContentRef[],
  kinds: ReadingPathStepKind[],
  preferTags: string[] | undefined,
  limit: number,
  used: Set<string>
): ReadingPathItem[] {
  const candidates = pool
    .filter((item) => kinds.includes(item.kind as ReadingPathStepKind))
    .filter((item) => !used.has(itemKey(item)))
    .map((item) => ({ item, score: scoreItem(item, preferTags) }))
    .sort((a, b) => b.score - a.score);

  const picked: ReadingPathItem[] = [];
  for (const { item } of candidates) {
    if (picked.length >= limit) break;
    const mapped = toPathItem(item);
    if (!mapped) continue;
    picked.push(mapped);
    used.add(itemKey(item));
  }
  return picked;
}

export async function resolveReadingPath(defn: ReadingPathDefinition): Promise<ResolvedReadingPath | null> {
  const hub = getTopicHubBySlug(defn.topicHubSlug);
  if (!hub) return null;

  const collected = await collectContentForTopic(defn.topicHubSlug);
  const pool = (collected?.items ?? []).filter((i) =>
    EDITORIAL_KINDS.includes(i.kind as ReadingPathStepKind)
  );

  const used = new Set<string>();
  const steps: ResolvedReadingPathStep[] = [];

  for (const stepDef of [...defn.steps].sort((a, b) => a.step - b.step)) {
    const items = pickStepItems(pool, stepDef.kinds, stepDef.preferTags, stepDef.limit ?? 3, used);
    steps.push({
      step: stepDef.step,
      title: stepDef.title,
      description: stepDef.description,
      items,
    });
  }

  const hasContent = steps.some((s) => s.items.length > 0);
  if (!hasContent) return null;

  return {
    slug: defn.slug,
    title: defn.title,
    description: defn.description,
    topicHubSlug: defn.topicHubSlug,
    topicHubHref: `/topics/${defn.topicHubSlug}`,
    pageHref: `/reading-paths/${defn.slug}`,
    steps,
  };
}

export async function resolveReadingPathBySlug(slug: string): Promise<ResolvedReadingPath | null> {
  const defn = getReadingPathBySlug(slug);
  if (!defn) return null;
  return resolveReadingPath(defn);
}

export async function resolveReadingPathForHub(hubSlug: string): Promise<ResolvedReadingPath | null> {
  const defn = getReadingPathForHub(hubSlug);
  if (!defn) return null;
  return resolveReadingPath(defn);
}

function contentMatchesHub(
  hubSlug: string,
  category?: string,
  tags: string[] = []
): boolean {
  const hub = getTopicHubBySlug(hubSlug);
  if (!hub) return false;
  const tagSet = new Set(tags.map(norm));
  if (hub.tags?.some((t) => tagSet.has(norm(t)))) return true;
  const cat = norm(category ?? '');
  if (cat && hub.categories?.some((c) => norm(c) === cat)) return true;
  return false;
}

/** Find reading paths relevant to a review's category and tags. */
export function matchReadingPathsForReview(category?: string, tags: string[] = []): ReadingPathDefinition[] {
  return READING_PATHS.filter((path) => contentMatchesHub(path.topicHubSlug, category, tags));
}

export async function resolveReadingPathsForReview(
  category?: string,
  tags: string[] = []
): Promise<ResolvedReadingPath[]> {
  const matches = matchReadingPathsForReview(category, tags);
  const resolved = await Promise.all(matches.map((p) => resolveReadingPath(p)));
  return resolved.filter((p): p is ResolvedReadingPath => p != null);
}
