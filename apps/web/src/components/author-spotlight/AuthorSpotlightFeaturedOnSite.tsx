import type { AuthorSpotlightBlogLink } from '@/lib/api';
import { groupSpotlightSiteLinks } from '@/lib/spotlightFeaturedContent';
import { resolveBlogLinkPreviews } from '@/lib/resolveInternalLinkPreview';
import InternalLinkPreviewCard from './InternalLinkPreviewCard';
import { SectionHeading, SmartLink } from './utils';
import { FileText } from 'lucide-react';

export default async function AuthorSpotlightFeaturedOnSite({
  links,
}: {
  links: AuthorSpotlightBlogLink[];
}) {
  if (!links.length) return null;

  const groups = groupSpotlightSiteLinks(links);
  const allForPreview = links.filter((l) => l.url?.trim());
  const previews = await resolveBlogLinkPreviews(allForPreview);
  const previewByUrl = new Map(allForPreview.map((l, i) => [l.url.trim(), previews[i]]));

  return (
    <section className="mb-14" aria-labelledby="spotlight-featured-on-site">
      <SectionHeading id="spotlight-featured-on-site">Featured on Chapters.Aur.Chai</SectionHeading>
      <p className="section-subheading mt-2 mb-8">Reviews, lists, and musings connected to this author</p>

      <div className="space-y-10">
        {groups.map((group) => (
          <div key={group.label}>
            <h3 className="font-sans text-sm font-semibold uppercase tracking-wide text-sage-dark mb-4">
              {group.label}
            </h3>
            <ul className="grid gap-4 sm:grid-cols-2">
              {group.links.map((link, i) => {
                const preview = previewByUrl.get(link.url.trim());
                return (
                  <li key={`${group.kind}-${link.url}-${i}`} className="h-full">
                    {preview ? (
                      <InternalLinkPreviewCard preview={preview} />
                    ) : (
                      <SmartLink
                        href={link.url}
                        className="flex items-center gap-3 h-full p-4 rounded-xl bg-cream-light border border-chai-brown/10 hover:border-sage/40 hover:shadow-md transition-all min-h-[5rem]"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage/15 text-sage">
                          <FileText size={18} aria-hidden />
                        </span>
                        <span className="font-body text-chai-brown truncate">{link.title || link.url}</span>
                      </SmartLink>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
