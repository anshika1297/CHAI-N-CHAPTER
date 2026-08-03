import Link from 'next/link';

const DEFAULT_LINKS = [
  { href: '/start-here', label: 'Start Here' },
  { href: '/genres', label: 'Genres' },
  { href: '/topics', label: 'Topics' },
  { href: '/tags', label: 'Tags' },
  { href: '/books', label: 'Books' },
  { href: '/author-spotlight', label: 'Author Spotlight' },
] as const;

type Props = {
  intro?: string;
  className?: string;
  links?: readonly { href: string; label: string }[];
};

/** Sitewide internal-link strip for listing and utility pages — strengthens hub connectivity. */
export default function ExploreHubLinks({
  intro = 'Explore more on Chapters.aur.Chai',
  className = '',
  links = DEFAULT_LINKS,
}: Props) {
  return (
    <footer className={`mt-12 pt-8 border-t border-chai-brown/10 text-center ${className}`}>
      {intro ? <p className="font-body text-sm text-chai-brown-light mb-4">{intro}</p> : null}
      <nav aria-label="Explore site sections">
        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 font-sans text-sm">
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="text-terracotta hover:underline">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </footer>
  );
}
