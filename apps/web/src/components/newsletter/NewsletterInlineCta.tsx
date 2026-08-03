'use client';

import NewsletterSignup from './NewsletterSignup';
import { NEWSLETTER_COPY, type NewsletterVariant } from '@/lib/newsletter/variants';

type Props = {
  variant: NewsletterVariant;
  placement: string;
  contentSlug?: string;
  className?: string;
};

/** Contextual inline CTA for article / spotlight pages. */
export default function NewsletterInlineCta({ variant, placement, contentSlug, className }: Props) {
  return (
    <section className={`my-8 sm:my-10 ${className ?? ''}`} aria-label="Newsletter signup">
      <NewsletterSignup
        copy={NEWSLETTER_COPY[variant]}
        placement={placement}
        contentSlug={contentSlug}
        layout="inline"
      />
    </section>
  );
}
