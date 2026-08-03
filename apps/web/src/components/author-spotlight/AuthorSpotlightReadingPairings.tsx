import Link from 'next/link';
import { ArrowRightLeft } from 'lucide-react';
import type { AuthorSpotlightReadingPairing } from '@/lib/api';
import { isInternalPath, SectionHeading, SmartLink } from './utils';

export default function AuthorSpotlightReadingPairings({
  pairings,
}: {
  pairings: AuthorSpotlightReadingPairing[];
}) {
  if (!pairings.length) return null;

  return (
    <section className="mb-14" aria-labelledby="spotlight-pairings">
      <SectionHeading id="spotlight-pairings">Reading pairings</SectionHeading>
      <p className="section-subheading mt-2 mb-8">If you liked one story, try these next</p>
      <ul className="space-y-5">
        {pairings.map((p, i) => (
          <li
            key={i}
            className="relative p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-cream-light to-cream border border-chai-brown/10 shadow-sm"
          >
            <ArrowRightLeft size={20} className="text-terracotta/70 mb-3" aria-hidden />
            <p className="font-body text-sm text-chai-brown-light">
              If you liked <span className="text-chai-brown font-medium">{p.ifYouLiked}</span>…
            </p>
            <p className="mt-2 font-serif text-xl sm:text-2xl text-chai-brown">
              {p.internalUrl && isInternalPath(p.internalUrl) ? (
                <Link href={p.internalUrl} className="hover:text-sage transition-colors">
                  {p.recommendedTitle}
                </Link>
              ) : (
                p.recommendedTitle
              )}
            </p>
            <p className="mt-3 font-body text-chai-brown/85 leading-relaxed whitespace-pre-wrap">{p.reason}</p>
            {p.internalUrl && !isInternalPath(p.internalUrl) ? (
              <p className="mt-3">
                <SmartLink href={p.internalUrl} className="font-sans text-sm text-sage font-medium hover:underline">
                  Open link →
                </SmartLink>
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
