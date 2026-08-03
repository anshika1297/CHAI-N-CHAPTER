import { resolveListingSocialImage } from './socialImage';
import { resolvePageMetadata } from './resolve';

export function resolveAuthorDirectoryMetadata() {
  return resolvePageMetadata({
    path: '/author-spotlight',
    contentTitle: 'Author spotlight',
    fallbackTitle: 'Author spotlight',
    excerpt:
      'Meet authors we love—profiles, reading recommendations, and curated links from Chapters.aur.Chai. Book blogger Anshika Mishra, India & UAE.',
    fallbackDescription:
      'Author directory on Chapters.aur.Chai — bios, favourite reads, and curated links for readers who want to go deeper.',
    keywords: ['author spotlight', 'author directory', 'book blogger', 'author interviews', 'Anshika Mishra'],
    type: 'website',
    image: resolveListingSocialImage({
      title: 'Author Spotlight',
      category: 'Author Directory',
    }),
  });
}

export function resolveStartHereMetadata() {
  return resolvePageMetadata({
    path: '/start-here',
    seoTitle: 'Start Here — Welcome to Chapters.aur.Chai',
    contentTitle: 'Welcome to Chapters.aur.Chai',
    fallbackTitle: 'Start Here — Welcome to Chapters.aur.Chai',
    seoDescription:
      'New to Chapters.aur.Chai? Explore book reviews, curated recommendations, literary musings, author spotlights, and book clubs — your reading map for India, UAE, and worldwide.',
    excerpt:
      'A space for book reviews, recommendations, literary musings, author spotlights, and conversations around stories that stay with us.',
    fallbackDescription:
      'Your reading map for Chapters.aur.Chai — discover reviews, lists, musings, author spotlights, and book clubs. Book blogger Anshika Mishra, India & UAE.',
    keywords: [
      'start here',
      'Chapters.aur.Chai',
      'book blog guide',
      'book reviews India',
      'book blogger UAE',
      'book recommendations',
      'author spotlights',
      'literary musings',
      'Anshika Mishra',
      'Abu Dhabi book blogger',
    ],
    type: 'website',
    image: resolveListingSocialImage({
      title: 'Welcome to Chapters.aur.Chai',
      category: 'Start Here',
    }),
  });
}
