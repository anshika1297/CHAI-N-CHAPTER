import type { AuthorSpotlightDto } from '@/lib/api';
import ContentAeoSummary from '@/components/content/ContentAeoSummary';
import { buildSpotlightAeoPairs, spotlightFieldsFromRaw } from '@/lib/contentFields';
import { RichOrPlain, SectionHeading } from './utils';

export default function AuthorSpotlightAbout({ spotlight }: { spotlight: AuthorSpotlightDto }) {
  const editorial = spotlightFieldsFromRaw(spotlight);
  const intro = spotlight.introduction?.trim();
  const bio = spotlight.bio?.trim();

  const aeoPairs = buildSpotlightAeoPairs({
    name: spotlight.name,
    tagline: spotlight.tagline,
    ...editorial,
  });

  if (!intro && !bio && !aeoPairs.length) return null;

  return (
    <section className="mb-14" aria-labelledby="spotlight-about">
      <SectionHeading id="spotlight-about">About the author</SectionHeading>

      {intro ? (
        <div className="mt-6 rounded-xl border-l-4 border-terracotta/60 bg-cream-light/80 px-5 py-4">
          <RichOrPlain html={intro} plain={intro} className="" />
        </div>
      ) : null}

      {bio ? (
        <div className={intro ? 'mt-8' : 'mt-6'}>
          <h3 className="font-sans text-sm font-semibold uppercase tracking-wide text-chai-brown mb-2">
            Biography
          </h3>
          <RichOrPlain html={bio} plain={bio} />
        </div>
      ) : null}

      <ContentAeoSummary pairs={aeoPairs} heading="Quick facts" className={intro || bio ? 'mt-8' : 'mt-6'} />
    </section>
  );
}
