import { getFetchBaseUrl } from '@/lib/apiBase';

export type ReadNextItem = {
  slug: string;
  title: string;
  category: string;
  readingTime: number;
  image: string;
};

export type ReadNextVariant = 'blog' | 'recommendations' | 'musings' | 'author-spotlight';

export const READ_NEXT_COUNT = 4;

const READ_NEXT_PATH: Record<ReadNextVariant, (slug: string) => string> = {
  blog: (slug) => `/api/blog/posts/${encodeURIComponent(slug)}/read-next`,
  recommendations: (slug) => `/api/recommendations/${encodeURIComponent(slug)}/read-next`,
  musings: (slug) => `/api/musings/${encodeURIComponent(slug)}/read-next`,
  'author-spotlight': (slug) => `/api/author-spotlight/${encodeURIComponent(slug)}/read-next`,
};

function parseReadNextItems(data: unknown): ReadNextItem[] {
  const items = (data as { items?: unknown })?.items;
  if (!Array.isArray(items)) return [];
  return items.filter(
    (i): i is ReadNextItem =>
      typeof i?.slug === 'string' &&
      typeof i?.title === 'string' &&
      typeof i?.category === 'string' &&
      typeof i?.readingTime === 'number'
  );
}

/** Related content ranked: tags → author → category → newest. Excludes current slug server-side. */
export async function fetchReadNext(
  variant: ReadNextVariant,
  slug: string,
  limit = READ_NEXT_COUNT
): Promise<ReadNextItem[]> {
  if (!slug.trim()) return [];
  try {
    const params = new URLSearchParams({ limit: String(limit) });
    const res = await fetch(`${getFetchBaseUrl()}${READ_NEXT_PATH[variant](slug)}?${params}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return parseReadNextItems(await res.json());
  } catch {
    return [];
  }
}
