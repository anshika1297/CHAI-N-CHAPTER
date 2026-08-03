import Link from 'next/link';
import { resolveGenreHubForCategory } from '@/lib/genres/resolveCategoryHref';
import type { EditorialContentType } from '@/lib/genres/resolveCategoryHref';
import { tagPathFromLabel } from '@/lib/tags';

type Props = {
  contentType: EditorialContentType;
  category?: string;
  tags?: string[];
};

const SECTION_LINKS: Record<EditorialContentType, { href: string; label: string }[]> = {
  blog: [
    { href: '/recommendations', label: 'Book recommendations' },
    { href: '/books', label: 'Books directory' },
    { href: '/shop', label: 'Shop' },
  ],
  recommendations: [
    { href: '/blog', label: 'Book reviews' },
    { href: '/books', label: 'Books directory' },
    { href: '/shop', label: 'Shop' },
  ],
  musings: [
    { href: '/blog', label: 'Book reviews' },
    { href: '/recommendations', label: 'Recommendations' },
    { href: '/author-spotlight', label: 'Author spotlight' },
  ],
};

/** Contextual outbound links at the end of editorial articles. */
export default function EditorialCrossLinks({ contentType, category, tags = [] }: Props) {
  const genreHub = category ? resolveGenreHubForCategory(category) : null;
  const tagLinks = tags.slice(0, 3).map((t) => ({
    href: tagPathFromLabel(t),
    label: `#${t.trim()}`,
  }));

  const sectionLinks = SECTION_LINKS[contentType];

  return (
    <aside
      className="mb-10 rounded-xl border border-chai-brown/10 bg-cream-light/60 px-5 py-4"
      aria-label="Related sections"
    >
      <p className="font-sans text-xs uppercase tracking-wide text-chai-brown-light mb-3">Keep exploring</p>
      <ul className="flex flex-wrap gap-2 font-sans text-sm">
        {genreHub ? (
          <li>
            <Link href={genreHub.href} className="text-terracotta hover:underline">
              {genreHub.title} genre hub
            </Link>
          </li>
        ) : null}
        {sectionLinks.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-terracotta hover:underline">
              {l.label}
            </Link>
          </li>
        ))}
        <li>
          <Link href="/start-here" className="text-terracotta hover:underline">
            Start here guide
          </Link>
        </li>
        {tagLinks.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sage-dark hover:underline">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
