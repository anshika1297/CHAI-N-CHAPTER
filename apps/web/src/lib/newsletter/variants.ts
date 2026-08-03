export type NewsletterVariant =
  | 'review'
  | 'recommendation'
  | 'musing'
  | 'author-spotlight'
  | 'homepage'
  | 'start-here'
  | 'topic-hub'
  | 'genre-hub';

export type NewsletterCopy = {
  headline: string;
  subline: string;
};

export const NEWSLETTER_COPY: Record<NewsletterVariant, NewsletterCopy> = {
  review: {
    headline: 'Enjoyed this review?',
    subline: 'Get future reviews and recommendations delivered to your inbox.',
  },
  recommendation: {
    headline: 'Love discovering books?',
    subline: 'Subscribe for weekly recommendations.',
  },
  musing: {
    headline: 'Enjoy literary reflections and reading life content?',
    subline: 'Join the newsletter.',
  },
  'author-spotlight': {
    headline: 'Want more author discoveries?',
    subline: 'Subscribe for author spotlights, reviews, and reading pairings in your inbox.',
  },
  homepage: {
    headline: 'Join the reading list',
    subline: 'Book reviews, curated recommendations, and literary updates — straight to your inbox.',
  },
  'start-here': {
    headline: 'Enjoyed exploring?',
    subline: 'Subscribe for reviews, recommendations, literary discussions, and bookish updates.',
  },
  'topic-hub': {
    headline: 'Keep exploring this topic',
    subline: 'Subscribe for new reviews and lists in this genre delivered to your inbox.',
  },
  'genre-hub': {
    headline: 'Love this genre?',
    subline: 'Subscribe for future recommendations and reviews in your inbox.',
  },
};

export function topicHubCopy(hubTitle?: string): NewsletterCopy {
  if (!hubTitle?.trim()) return NEWSLETTER_COPY['topic-hub'];
  return {
    headline: `Love ${hubTitle}?`,
    subline: 'Subscribe for new reviews, lists, and reading guides in this topic.',
  };
}

export function genreHubCopy(genreTitle?: string): NewsletterCopy {
  if (!genreTitle?.trim()) return NEWSLETTER_COPY['genre-hub'];
  return {
    headline: `Love ${genreTitle} books?`,
    subline: 'Subscribe for future recommendations and reviews in this genre.',
  };
}
