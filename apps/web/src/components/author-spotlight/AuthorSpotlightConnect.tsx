import type { AuthorSpotlightDto } from '@/lib/api';
import { ExternalLink, Globe } from 'lucide-react';
import { resolveAuthorConnectLinks } from '@/lib/spotlightConnect';
import { isInternalPath } from './utils';
import Link from 'next/link';
import { SectionHeading } from './utils';

function ConnectLink({
  label,
  url,
  dofollow,
}: {
  label: string;
  url: string;
  dofollow?: boolean;
}) {
  const external = !isInternalPath(url);
  const className =
    'group flex items-center gap-3 p-4 rounded-xl bg-cream-light border border-chai-brown/10 hover:border-terracotta/35 hover:shadow-md transition-all min-h-[3.5rem]';

  const inner = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-chai-brown/8 text-chai-brown group-hover:bg-terracotta/15 group-hover:text-terracotta transition-colors">
        <Globe size={18} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="font-sans text-sm font-medium text-chai-brown block">{label}</span>
        {external ? (
          <span className="font-sans text-xs text-chai-brown-light truncate block">{url.replace(/^https?:\/\//, '')}</span>
        ) : null}
      </span>
      {external ? <ExternalLink size={16} className="text-chai-brown-light shrink-0" aria-hidden /> : null}
    </>
  );

  if (external) {
    return (
      <a
        href={url}
        target="_blank"
        rel={dofollow ? 'noopener' : 'noopener noreferrer'}
        className={className}
      >
        {inner}
      </a>
    );
  }
  return (
    <Link href={url} className={className}>
      {inner}
    </Link>
  );
}

export default function AuthorSpotlightConnect({ spotlight }: { spotlight: AuthorSpotlightDto }) {
  const links = resolveAuthorConnectLinks(spotlight);
  if (!links.length) return null;

  return (
    <section className="mb-14" aria-labelledby="spotlight-connect">
      <SectionHeading id="spotlight-connect">Connect with the author</SectionHeading>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {links.map((link) => (
          <li key={link.url}>
            <ConnectLink label={link.label} url={link.url} dofollow={link.dofollow} />
          </li>
        ))}
      </ul>
    </section>
  );
}
