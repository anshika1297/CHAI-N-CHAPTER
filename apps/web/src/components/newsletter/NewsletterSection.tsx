'use client';

import NewsletterSignup from './NewsletterSignup';
import {
  NEWSLETTER_COPY,
  genreHubCopy,
  topicHubCopy,
  type NewsletterCopy,
  type NewsletterVariant,
} from '@/lib/newsletter/variants';

type Props = {
  variant: NewsletterVariant;
  placement: string;
  topicTitle?: string;
  contentSlug?: string;
  id?: string;
  showNameField?: boolean;
};

/** Full-width newsletter block for homepage, Start Here, and topic hubs. */
export default function NewsletterSection({
  variant,
  placement,
  topicTitle,
  contentSlug,
  id = 'newsletter',
  showNameField = false,
}: Props) {
  const copy: NewsletterCopy =
    variant === 'topic-hub'
      ? topicHubCopy(topicTitle)
      : variant === 'genre-hub'
        ? genreHubCopy(topicTitle)
        : NEWSLETTER_COPY[variant];

  return (
    <section
      id={id}
      className="py-12 sm:py-16 bg-gradient-to-b from-cream-dark/50 to-cream"
      aria-label="Newsletter signup"
    >
      <div className="site-container max-w-3xl">
        <NewsletterSignup
          copy={copy}
          placement={placement}
          contentSlug={contentSlug}
          layout="section"
          showNameField={showNameField}
        />
      </div>
    </section>
  );
}
