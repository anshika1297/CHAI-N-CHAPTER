import type { TopicHubDefinition } from './types';

/**
 * Curated topic hub landing pages — extend as editorial strategy grows.
 * Each hub aggregates content by tags, categories, themes, or genres.
 */
export const TOPIC_HUBS: TopicHubDefinition[] = [
  {
    slug: 'fiction',
    title: 'Fiction',
    description:
      'Fiction book reviews, curated lists, and reading guides from Chapters.aur.Chai — honest takes for readers in India, UAE, and worldwide.',
    categories: ['Fiction', 'Romance', 'Mystery', 'Thriller', 'Historical Fiction'],
    tags: ['fiction', 'novel'],
  },
  {
    slug: 'non-fiction',
    title: 'Non-Fiction & Self-Help',
    description:
      'Non-fiction and self-help book reviews and recommendations — practical reads, memoirs, and ideas worth your time.',
    categories: ['Non-Fiction', 'Self-Help'],
    tags: ['non-fiction', 'self-help', 'memoir'],
  },
  {
    slug: 'indian-literature',
    title: 'Indian Literature',
    description:
      'Explore Indian literature through reviews, author spotlights, and curated lists — voices from the subcontinent and diaspora.',
    tags: ['indian literature', 'india', 'south asian'],
    categories: ['Indian Literature'],
    themes: ['India', 'identity', 'diaspora'],
  },
  {
    slug: 'mythology-history',
    title: 'Mythology & History',
    description:
      'Mythology and history book reviews and reading lists — epics, retellings, and narrative non-fiction for curious readers.',
    tags: ['mythology', 'history', 'epic'],
    categories: ['Mythology', 'History'],
  },
  {
    slug: 'book-lists',
    title: 'Curated Book Lists',
    description:
      'Curated book recommendation lists — monthly wrap-ups, genre picks, and themed reading guides by Anshika Mishra.',
    categories: ['Book List', 'Genre Recommendations', 'Monthly Wrap-Up', 'Weekly Wrap-Up', 'Yearly Wrap-Up'],
    tags: ['book list', 'recommendations'],
  },
  {
    slug: 'literary-reflections',
    title: 'Literary Reflections',
    description:
      'Essays, reflections, and musings on reading, writing, and life — Her Musings Verse from Chapters.aur.Chai.',
    categories: ['Reflection', 'Personal', 'Short Story', 'Thoughts', 'Poetry'],
    themes: ['reading', 'writing', 'reflection'],
  },
];

export function getTopicHubBySlug(slug: string): TopicHubDefinition | undefined {
  const s = slug.trim().toLowerCase();
  return TOPIC_HUBS.find((h) => h.slug === s);
}

export function getAllTopicHubSlugs(): string[] {
  return TOPIC_HUBS.map((h) => h.slug);
}
