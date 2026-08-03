import { FileText, ExternalLink } from 'lucide-react';
import type { AuthorSpotlightBlogLink } from '@/lib/api';
import { resolveBlogLinkPreviews } from '@/lib/resolveInternalLinkPreview';
import InternalLinkPreviewCard from './InternalLinkPreviewCard';
import { isInternalPath, SectionHeading, SmartLink } from './utils';

function SimpleSiteLinkRow({ title, url }: { title: string; url: string }) {
  const external = !isInternalPath(url);
  return (
    <SmartLink
      href={url}
      className="group flex items-center gap-3 p-4 rounded-xl bg-cream-light border border-chai-brown/10 hover:border-sage/40 hover:shadow-md transition-all"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage/15 text-sage">
        {external ? <ExternalLink size={18} /> : <FileText size={18} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="font-body text-chai-brown group-hover:text-sage transition-colors block truncate">
          {title || url}
        </span>
        {external ? (
          <span className="font-sans text-xs text-chai-brown-light truncate block">{url}</span>
        ) : null}
      </span>
    </SmartLink>
  );
}

export default async function AuthorSpotlightSiteLinks({ links }: { links: AuthorSpotlightBlogLink[] }) {
  if (!links.length) return null;

  const previews = await resolveBlogLinkPreviews(links);

  return (
    <section className="mb-14" aria-labelledby="spotlight-on-site">
      <SectionHeading id="spotlight-on-site">On this site</SectionHeading>
      <p className="section-subheading mt-2 mb-6">More to read on Chapters.aur.Chai</p>
      <ul className="space-y-4">
        {links.map((l, i) => {
          const preview = previews[i];
          return (
            <li key={`${l.url}-${i}`}>
              {preview ? (
                <InternalLinkPreviewCard preview={preview} />
              ) : (
                <SimpleSiteLinkRow title={l.title?.trim() || l.url} url={l.url} />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
