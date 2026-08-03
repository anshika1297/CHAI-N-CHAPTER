import { AuthorSpotlight, type IAuthorSpotlight } from '../models/AuthorSpotlight.js';

export type SpotlightReadNextCard = {
  slug: string;
  title: string;
  category: string;
  readingTime: number;
  image: string;
};

const CACHE_MS = 5 * 60 * 1000;
let cache: { at: number; items: IAuthorSpotlight[] } | null = null;

function isVisible(doc: IAuthorSpotlight): boolean {
  if (!doc.isPublished) return false;
  if (!doc.publishDate) return true;
  return new Date(doc.publishDate) <= new Date();
}

function genreOverlap(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const setB = new Set(b.map((g) => g.toLowerCase()));
  let n = 0;
  for (const g of a) {
    if (setB.has(g.toLowerCase())) n += 1;
  }
  return n;
}

function tagOverlap(a: string[] | undefined, b: string[] | undefined): number {
  const ta = (a ?? []).map((t) => t.toLowerCase());
  const tb = (b ?? []).map((t) => t.toLowerCase());
  return genreOverlap(ta, tb);
}

async function loadPublished(): Promise<IAuthorSpotlight[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.items;
  const docs = await AuthorSpotlight.find({ isPublished: true })
    .sort({ displayOrder: 1, publishDate: -1, name: 1 })
    .lean();
  const items = docs.filter((d) => isVisible(d as unknown as IAuthorSpotlight)) as unknown as IAuthorSpotlight[];
  cache = { at: Date.now(), items };
  return items;
}

export function invalidateSpotlightReadNextCache(): void {
  cache = null;
}

export async function resolveSpotlightReadNext(
  currentSlug: string,
  limit = 4
): Promise<SpotlightReadNextCard[]> {
  const safeLimit = Math.min(8, Math.max(1, limit));
  const key = currentSlug.trim().toLowerCase();
  const all = await loadPublished();
  const current = all.find((s) => s.slug === key);
  if (!current) return [];

  const candidates = all.filter((s) => s.slug !== key);
  const picked = new Set<string>();
  const selected: IAuthorSpotlight[] = [];

  const pick = (pool: IAuthorSpotlight[]) => {
    for (const item of pool) {
      if (selected.length >= safeLimit) break;
      if (picked.has(item.slug)) continue;
      picked.add(item.slug);
      selected.push(item);
    }
  };

  const byDate = (a: IAuthorSpotlight, b: IAuthorSpotlight) => {
    const da = a.publishDate ? new Date(a.publishDate).getTime() : 0;
    const db = b.publishDate ? new Date(b.publishDate).getTime() : 0;
    return db - da;
  };

  if ((current.genres?.length ?? 0) > 0) {
    pick(
      [...candidates]
        .filter((s) => genreOverlap(current.genres ?? [], s.genres ?? []) > 0)
        .sort(
          (a, b) =>
            genreOverlap(current.genres ?? [], b.genres ?? []) -
              genreOverlap(current.genres ?? [], a.genres ?? []) || byDate(a, b)
        )
    );
  }

  if (selected.length < safeLimit && (current.tags?.length ?? 0) > 0) {
    pick(
      [...candidates]
        .filter((s) => !picked.has(s.slug) && tagOverlap(current.tags, s.tags) > 0)
        .sort((a, b) => tagOverlap(current.tags, b.tags) - tagOverlap(current.tags, a.tags) || byDate(a, b))
    );
  }

  if (selected.length < safeLimit) {
    pick([...candidates].filter((s) => !picked.has(s.slug)).sort(byDate));
  }

  return selected.map((s) => ({
    slug: s.slug,
    title: s.name,
    category: (s.genres?.[0] ?? 'Author').trim(),
    readingTime: 8,
    image: s.profileImage ?? '',
  }));
}
