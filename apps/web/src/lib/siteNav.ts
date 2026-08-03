export type NavLink = { name: string; href: string };

/** Primary header — keep compact so the logo and nav don't overlap on desktop. */
export const DEFAULT_HEADER_NAV_LINKS: NavLink[] = [
  { name: 'Home', href: '/' },
  { name: 'Start Here', href: '/start-here' },
  { name: 'About Me', href: '/about' },
  { name: 'Book Reviews', href: '/blog' },
  { name: 'Book Recommendations', href: '/recommendations' },
  { name: 'Her Musings Verse', href: '/musings' },
  { name: 'Author spotlight', href: '/author-spotlight' },
  { name: 'Books', href: '/books' },
  { name: 'Book Clubs', href: '/book-clubs' },
  { name: 'Work With Me', href: '/work-with-me' },
];

/** Discover hubs — footer & in-content strips, not the main header bar. */
export const DISCOVER_NAV_LINKS: NavLink[] = [
  { name: 'Genres', href: '/genres' },
  { name: 'Topics', href: '/topics' },
  { name: 'Tags', href: '/tags' },
  { name: 'Books', href: '/books' },
];

/** @deprecated Desktop header now shows full link names from CMS/defaults. */
export const HEADER_NAV_SHORT_LABELS: Record<string, string> = {
  '/': 'Home',
  '/start-here': 'Start Here',
  '/about': 'About',
  '/blog': 'Reviews',
  '/recommendations': 'Lists',
  '/musings': 'Musings',
  '/author-spotlight': 'Authors',
  '/books': 'Books',
  '/book-clubs': 'Clubs',
  '/work-with-me': 'Work With Me',
};

export function headerNavLabel(link: NavLink): string {
  const key = normalizeHref(link.href);
  return HEADER_NAV_SHORT_LABELS[key] ?? link.name;
}

/** Paths that must not appear in the compact header (even if saved in CMS). */
const HEADER_NAV_EXCLUDE = new Set(['/genres', '/topics', '/tags', '/shop']);

function normalizeHref(href: string): string {
  const trimmed = href.trim() || '/';
  if (trimmed === '/') return '/';
  return trimmed.replace(/\/+$/, '') || '/';
}

function isHeaderNavLink(link: NavLink): boolean {
  return !HEADER_NAV_EXCLUDE.has(normalizeHref(link.href));
}

/** Merge CMS nav with defaults so new routes appear even on older saved header configs. */
export function mergeHeaderNavLinks(saved: NavLink[]): NavLink[] {
  const savedByHref = new Map<string, NavLink>();
  for (const link of saved) {
    const name = link.name?.trim();
    const href = link.href?.trim() || '/';
    if (!name) continue;
    savedByHref.set(normalizeHref(href), { name, href });
  }

  const merged: NavLink[] = [];
  const used = new Set<string>();

  for (const def of DEFAULT_HEADER_NAV_LINKS) {
    const key = normalizeHref(def.href);
    const existing = savedByHref.get(key);
    const candidate = existing ?? def;
    if (isHeaderNavLink(candidate)) {
      merged.push(candidate);
    }
    used.add(key);
  }

  for (const link of saved) {
    const key = normalizeHref(link.href);
    if (!used.has(key)) {
      const candidate = { name: link.name.trim(), href: link.href.trim() || '/' };
      if (isHeaderNavLink(candidate)) {
        merged.push(candidate);
      }
      used.add(key);
    }
  }

  return merged;
}
