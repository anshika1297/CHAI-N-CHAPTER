import Image from 'next/image';
import { getImageUrl, type AuthorSpotlightDto } from '@/lib/api';
import ContentFreshnessDates from '@/components/content/ContentFreshnessDates';
import AuthorSpotlightShare from './AuthorSpotlightShare';

export default function AuthorSpotlightHero({ spotlight }: { spotlight: AuthorSpotlightDto }) {
  const profileSrc = getImageUrl(spotlight.profileImage);

  return (
    <header className="relative -mx-2.5 sm:-mx-3 lg:-mx-4 xl:-mx-5 mb-10 sm:mb-14">
      <div className="rounded-2xl bg-gradient-to-br from-sage/25 via-cream to-terracotta/15 border border-chai-brown/10 shadow-md">
        <div className="px-4 sm:px-10 pt-8 pb-6 sm:pt-12 sm:pb-10 flex flex-col md:flex-row gap-6 sm:gap-10 items-center md:items-end">
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 shrink-0 rounded-full overflow-hidden ring-4 ring-cream shadow-lg bg-cream">
            {profileSrc ? (
              <Image
                src={profileSrc}
                alt={spotlight.name}
                fill
                className="object-cover object-top"
                priority
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-sage/20 font-serif text-4xl text-chai-brown/40">
                {spotlight.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 text-center md:text-left min-w-0">
            <p className="font-sans text-xs uppercase tracking-[0.2em] text-sage-dark mb-2">Author spotlight</p>
            <h1 className="font-serif text-2xl sm:text-4xl md:text-5xl text-chai-brown break-words">{spotlight.name}</h1>
            {spotlight.tagline ? (
              <p className="mt-3 font-body text-base sm:text-xl text-terracotta italic leading-relaxed max-w-2xl mx-auto md:mx-0 break-words">
                {spotlight.tagline}
              </p>
            ) : null}
            <ContentFreshnessDates
              raw={{
                publishDate: spotlight.publishDate,
                updatedAt: spotlight.updatedAt,
                updateHistory: spotlight.updateHistory,
              }}
              showLastUpdated={false}
              className="mt-4"
            />
            <AuthorSpotlightShare authorName={spotlight.name} tagline={spotlight.tagline} />
            {spotlight.genres?.length ? (
              <ul className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
                {spotlight.genres.map((g) => (
                  <li
                    key={g}
                    className="font-sans text-xs px-3 py-1 rounded-full bg-cream/90 text-chai-brown border border-chai-brown/10"
                  >
                    {g}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
