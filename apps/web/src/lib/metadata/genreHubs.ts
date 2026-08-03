import type { GenreHubDefinition } from './types';
import { dynamicGenreHubFromSlug } from '@/lib/genres/dynamicHub';

/**
 * Curated genre pillar pages — extend as editorial strategy grows.
 * Matching uses genres[], categories, tags, themes, and book catalog fields.
 */
export const GENRE_HUBS: GenreHubDefinition[] = [
  {
    slug: 'indian-mythology',
    title: 'Indian Mythology',
    titleSuffix: 'Books',
    description:
      'Explore reviews, recommendations, author spotlights, and discussions around Indian mythology literature — epics, retellings, and myth-inspired fiction on Chapters.aur.Chai.',
    genres: ['Indian Mythology', 'Mythology'],
    categories: ['Mythology'],
    tags: ['mythology', 'indian mythology', 'epic', 'mahabharata', 'ramayana'],
    bookGenres: ['Indian Mythology', 'Mythology'],
    relatedGenres: ['historical-fiction', 'classics', 'literary-fiction'],
    topicHubSlug: 'mythology-history',
    readingPathSlug: 'indian-mythology',
    popularityRank: 1,
  },
  {
    slug: 'historical-fiction',
    title: 'Historical Fiction',
    titleSuffix: 'Books',
    description:
      'Historical fiction book reviews, curated lists, and author spotlights — past eras brought to life through story.',
    genres: ['Historical Fiction'],
    categories: ['Historical Fiction'],
    tags: ['historical fiction', 'history'],
    bookGenres: ['Historical Fiction'],
    relatedGenres: ['literary-fiction', 'classics', 'indian-mythology'],
    topicHubSlug: 'fiction',
    popularityRank: 2,
  },
  {
    slug: 'literary-fiction',
    title: 'Literary Fiction',
    titleSuffix: 'Books',
    description:
      'Literary fiction reviews and recommendations — character-driven novels, prize winners, and prose worth savouring.',
    genres: ['Literary Fiction'],
    categories: ['Literary Fiction'],
    tags: ['literary fiction', 'literary'],
    bookGenres: ['Literary Fiction'],
    relatedGenres: ['contemporary-fiction', 'classics', 'historical-fiction'],
    topicHubSlug: 'fiction',
    popularityRank: 3,
  },
  {
    slug: 'contemporary-fiction',
    title: 'Contemporary Fiction',
    titleSuffix: 'Books',
    description:
      'Contemporary fiction book reviews and reading lists — modern novels, fresh voices, and stories of today.',
    genres: ['Contemporary Fiction', 'Fiction'],
    categories: ['Fiction'],
    tags: ['contemporary fiction', 'fiction', 'novel'],
    bookGenres: ['Contemporary Fiction', 'Fiction'],
    relatedGenres: ['literary-fiction', 'romance', 'mystery'],
    topicHubSlug: 'fiction',
    popularityRank: 4,
  },
  {
    slug: 'classics',
    title: 'Classics',
    titleSuffix: 'Books',
    description:
      'Classic literature reviews and recommendations — timeless novels, enduring authors, and books every reader should know.',
    genres: ['Classics'],
    categories: ['Classics'],
    tags: ['classics', 'classic literature'],
    bookGenres: ['Classics'],
    relatedGenres: ['literary-fiction', 'historical-fiction', 'indian-mythology'],
    topicHubSlug: 'fiction',
    popularityRank: 5,
  },
  {
    slug: 'romance',
    title: 'Romance',
    titleSuffix: 'Books',
    description:
      'Romance book reviews and curated lists — love stories, happy endings, and romantic fiction worth your time.',
    genres: ['Romance'],
    categories: ['Romance'],
    tags: ['romance'],
    bookGenres: ['Romance'],
    relatedGenres: ['contemporary-fiction', 'literary-fiction'],
    topicHubSlug: 'fiction',
    popularityRank: 6,
  },
  {
    slug: 'mystery',
    title: 'Mystery & Thriller',
    titleSuffix: 'Books',
    description:
      'Mystery and thriller book reviews — whodunits, suspense, and page-turners for curious readers.',
    genres: ['Mystery', 'Thriller'],
    categories: ['Mystery', 'Thriller'],
    tags: ['mystery', 'thriller', 'crime'],
    bookGenres: ['Mystery', 'Thriller'],
    relatedGenres: ['contemporary-fiction', 'historical-fiction'],
    topicHubSlug: 'fiction',
    popularityRank: 7,
  },
];

export function getGenreHubBySlug(slug: string): GenreHubDefinition | undefined {
  const s = slug.trim().toLowerCase();
  const curated = GENRE_HUBS.find((h) => h.slug === s);
  if (curated) return curated;
  if (!s || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) return undefined;
  return dynamicGenreHubFromSlug(s);
}

export function getAllGenreHubSlugs(): string[] {
  return GENRE_HUBS.map((h) => h.slug);
}

export function genreHubDisplayTitle(hub: GenreHubDefinition): string {
  const suffix = hub.titleSuffix?.trim();
  return suffix ? `${hub.title} ${suffix}` : hub.title;
}
