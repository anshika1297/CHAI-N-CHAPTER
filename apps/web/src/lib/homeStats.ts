import { getFetchBaseUrl } from '@/lib/apiBase';

export type PublicSiteStats = {
  reviews: number;
  recommendations: number;
  musings: number;
  bookClubs: number;
  authorSpotlights: number;
  readers: number;
};

export type HeroStat = { value: string; label: string };

export const DEFAULT_HERO_STATS: HeroStat[] = [
  { value: '—', label: 'Book Reviews' },
  { value: '—', label: 'Book Recommendations' },
  { value: '—', label: 'Readers' },
  { value: '—', label: 'Book Clubs' },
];

const HERO_STAT_ORDER: (keyof PublicSiteStats)[] = ['reviews', 'recommendations', 'readers', 'bookClubs'];

const LABEL_TO_KEY: Record<string, keyof PublicSiteStats> = {
  'book reviews': 'reviews',
  'book review': 'reviews',
  reviews: 'reviews',
  recommendations: 'recommendations',
  'book recommendations': 'recommendations',
  'book recommendation': 'recommendations',
  musings: 'musings',
  'her musings verse': 'musings',
  'book clubs': 'bookClubs',
  'book club': 'bookClubs',
  'author spotlight': 'authorSpotlights',
  'author spotlights': 'authorSpotlights',
  readers: 'readers',
  visitors: 'readers',
};

/** Format counts for hero display (e.g. 2100 → 2.1K). */
export function formatStatCount(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `${m >= 10 ? Math.round(m) : m.toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (n >= 1000) {
    const k = n / 1000;
    return `${k >= 10 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, '')}K`;
  }
  return String(n);
}

export async function fetchPublicSiteStats(): Promise<PublicSiteStats | null> {
  try {
    const res = await fetch(`${getFetchBaseUrl()}/api/site/stats`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as PublicSiteStats;
    return data;
  } catch {
    return null;
  }
}

/** Merge CMS stats with the four default hero stats (adds Book Recommendations if missing). */
export function resolveHeroStats(saved?: HeroStat[]): HeroStat[] {
  if (!saved?.length) return DEFAULT_HERO_STATS;

  const byKey = new Map<keyof PublicSiteStats, HeroStat>();
  for (const stat of saved) {
    const label = stat.label?.trim();
    if (!label) continue;
    const key = LABEL_TO_KEY[label.toLowerCase()];
    if (key && !byKey.has(key)) {
      byKey.set(key, { value: stat.value?.trim() || '—', label });
    }
  }

  return HERO_STAT_ORDER.map((key) => {
    const fallback = DEFAULT_HERO_STATS.find((d) => LABEL_TO_KEY[d.label.toLowerCase()] === key)!;
    return byKey.get(key) ?? fallback;
  });
}

/** Replace stat values using live counts; labels stay from CMS. Unmatched labels keep manual values. */
export function applyLiveHeroStats(stats: HeroStat[], counts: PublicSiteStats): HeroStat[] {
  return stats.map((stat) => {
    const key = LABEL_TO_KEY[stat.label.trim().toLowerCase()];
    if (!key) return stat;
    const n = counts[key];
    if (typeof n !== 'number' || n < 0) return stat;
    return { ...stat, value: formatStatCount(n) };
  });
}
