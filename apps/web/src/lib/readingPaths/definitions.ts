import type { ReadingPathDefinition } from './types';

/**
 * Curated reading paths — each maps to a topic hub for dynamic content resolution.
 * Extend as editorial strategy grows; no CMS required for v1.
 */
export const READING_PATHS: ReadingPathDefinition[] = [
  {
    slug: 'indian-mythology',
    title: 'Indian Mythology Reading Path',
    description:
      'A guided journey through mythology on Chapters.aur.Chai — from beginner-friendly lists to popular reviews, author voices, and deeper picks.',
    topicHubSlug: 'mythology-history',
    steps: [
      {
        step: 1,
        title: 'Beginner-friendly mythology recommendations',
        description: 'Curated lists to help you find an entry point into epics, retellings, and myth-inspired fiction.',
        kinds: ['recommendation'],
        preferTags: ['mythology', 'beginner', 'starter', 'epic'],
        limit: 2,
      },
      {
        step: 2,
        title: 'Popular mythology reviews',
        description: 'Honest reviews of mythology and history books — verdicts, highlights, and whether they are worth your time.',
        kinds: ['review'],
        preferTags: ['mythology', 'history', 'epic'],
        limit: 3,
      },
      {
        step: 3,
        title: 'Author spotlights',
        description: 'Meet writers shaping mythology and historical fiction — interviews, pairings, and where to start.',
        kinds: ['author-spotlight'],
        preferTags: ['mythology', 'history'],
        limit: 2,
      },
      {
        step: 4,
        title: 'Advanced recommendations',
        description: 'Deeper reading lists for when you are ready to go beyond the basics.',
        kinds: ['recommendation'],
        preferTags: ['mythology', 'history', 'advanced'],
        limit: 2,
      },
    ],
  },
  {
    slug: 'indian-literature',
    title: 'Indian Literature Reading Path',
    description:
      'Explore Indian and South Asian voices — curated lists, reviews, author spotlights, and themed recommendations.',
    topicHubSlug: 'indian-literature',
    steps: [
      {
        step: 1,
        title: 'Where to start with Indian literature',
        description: 'Beginner-friendly recommendation lists from the subcontinent and diaspora.',
        kinds: ['recommendation'],
        preferTags: ['indian literature', 'india', 'south asian'],
        limit: 2,
      },
      {
        step: 2,
        title: 'Reviews & honest takes',
        description: 'Book reviews of Indian literature — fiction, memoir, and narrative non-fiction.',
        kinds: ['review'],
        preferTags: ['india', 'indian literature'],
        limit: 3,
      },
      {
        step: 3,
        title: 'Author spotlights',
        description: 'Profiles and interviews with writers we love from India and the diaspora.',
        kinds: ['author-spotlight'],
        preferTags: ['india', 'indian literature'],
        limit: 2,
      },
      {
        step: 4,
        title: 'More curated lists',
        description: 'Themed recommendation posts to keep your TBR full.',
        kinds: ['recommendation'],
        limit: 2,
      },
    ],
  },
  {
    slug: 'fiction-starter',
    title: 'Fiction Starter Reading Path',
    description:
      'New to our fiction coverage? Follow this path from curated lists to reviews, authors, and deeper genre picks.',
    topicHubSlug: 'fiction',
    steps: [
      {
        step: 1,
        title: 'Curated fiction lists',
        description: 'Themed recommendation posts to help you pick your next novel.',
        kinds: ['recommendation'],
        preferTags: ['fiction', 'novel'],
        limit: 2,
      },
      {
        step: 2,
        title: 'Fiction reviews',
        description: 'Honest book reviews across romance, mystery, historical fiction, and more.',
        kinds: ['review'],
        preferTags: ['fiction'],
        limit: 3,
      },
      {
        step: 3,
        title: 'Authors to discover',
        description: 'Author spotlights with reading pairings and favourite reads.',
        kinds: ['author-spotlight'],
        limit: 2,
      },
      {
        step: 4,
        title: 'Go deeper',
        description: 'More lists for readers ready to branch into new genres and voices.',
        kinds: ['recommendation'],
        limit: 2,
      },
    ],
  },
];

export function getReadingPathBySlug(slug: string): ReadingPathDefinition | undefined {
  const s = slug.trim().toLowerCase();
  return READING_PATHS.find((p) => p.slug === s);
}

export function getReadingPathForHub(hubSlug: string): ReadingPathDefinition | undefined {
  const s = hubSlug.trim().toLowerCase();
  return READING_PATHS.find((p) => p.topicHubSlug === s);
}

export function getFeaturedReadingPaths(): ReadingPathDefinition[] {
  return READING_PATHS;
}

export function getAllReadingPathSlugs(): string[] {
  return READING_PATHS.map((p) => p.slug);
}

export function readingPathPagePath(slug: string): string {
  return `/reading-paths/${slug.trim().toLowerCase()}`;
}
