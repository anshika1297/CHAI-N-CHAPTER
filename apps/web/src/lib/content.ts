/**
 * Content metadata for SEO. Used by generateMetadata in blog, recommendations, musings.
 * Replace with API/DB lookups when you have a backend.
 *
 * Site-wide focus: India & UAE (Abu Dhabi). Book blogger, content creator, literary services.
 * Per-post keywords: merged with site-wide primaryKeywords + extendedKeywords in buildMetadata.
 */

export type ContentMeta = {
  title: string;
  description: string;
  image?: string;
  publishedTime?: string;
  author?: string;
  /** Per-post SEO keywords; merged with site-wide keywords in buildMetadata. */
  keywords?: string[];
};

// Slug → metadata. Align with admin default slugs; when you have an API, fetch by slug instead.
const BLOG_META: Record<string, ContentMeta> = {
  'art-of-slow-living': {
    title: 'The Art of Slow Living: Finding Peace in Pages',
    description:
      'A beautiful meditation on slowing down and finding joy in the simple act of reading. Book review by Anshika Mishra.',
    image: '',
    publishedTime: '2024-01-15',
    author: 'Anshika Mishra',
    keywords: ['slow living', 'mindfulness', 'Marie Kondo', 'self-help', 'mindful reading', 'The Art of Slow Living'],
  },
  'finding-hygge-winter-reads': {
    title: 'Finding Hygge in Hardcover: Winter Reads',
    description:
      "As the winter settles in, there's nothing quite like curling up with a warm cup of chai and these cozy reads.",
    image: '',
    publishedTime: '2024-01-10',
    author: 'Anshika Mishra',
    keywords: ['winter reads', 'hygge', 'cozy reads', 'seasonal book list', 'winter books'],
  },
  'stories-that-stayed': {
    title: 'Stories That Stayed: My All-Time Favorites',
    description:
      'Some books leave an imprint on your soul. Here are the stories that I carry with me.',
    image: '',
    publishedTime: '2024-01-05',
    author: 'Anshika Mishra',
    keywords: ['favorite books', 'all-time reads', 'book list', 'reading journey'],
  },
  'journey-indian-literature': {
    title: 'A Journey Through Indian Literature',
    description:
      'Exploring the rich tapestry of Indian storytelling, from ancient epics to contemporary voices.',
    image: '',
    publishedTime: '2023-12-28',
    author: 'Anshika Mishra',
    keywords: ['Indian literature', 'Arundhati Roy', 'The God of Small Things', 'South Asian literature', 'Indian authors'],
  },
};

const RECO_META: Record<string, ContentMeta> = {
  'cozy-winter-reads': {
    title: 'Cozy Winter Reads: Books to Curl Up With',
    description:
      "As the temperature drops, there's nothing better than a warm blanket, hot chai, and these cozy reads.",
    image: '',
    publishedTime: '2024-01-20',
    author: 'Anshika Mishra',
    keywords: ['winter reads', 'cozy reads', 'book list', 'seasonal recommendations', 'Taylor Jenkins Reid', 'Evelyn Hugo'],
  },
  'january-2024-wrapup': {
    title: 'January 2024 Wrap-Up: My Reading Journey',
    description:
      "January was a month of discovery! I read 8 incredible books across genres. Here's what kept me turning pages.",
    image: '',
    publishedTime: '2024-02-01',
    author: 'Anshika Mishra',
    keywords: ['monthly wrap-up', 'January reads', 'reading wrap-up', 'book recommendations 2024'],
  },
};

const MUSING_META: Record<string, ContentMeta> = {
  'art-of-reading-in-silence': {
    title: 'The Art of Reading in Silence',
    description:
      "In a world full of noise, there's something sacred about the quiet moments spent with a book.",
    image: '',
    publishedTime: '2024-01-22',
    author: 'Anshika Mishra',
    keywords: ['reading in silence', 'mindful reading', 'reflection', 'quiet reading', 'literary musings'],
  },
  'letter-to-younger-reading-self': {
    title: 'A Letter to My Younger Reading Self',
    description:
      "Dear 15-year-old me, I wish I could tell you that the books you're reading now will shape who you become.",
    image: '',
    publishedTime: '2024-01-18',
    author: 'Anshika Mishra',
    keywords: ['letter to younger self', 'reading journey', 'personal essay', 'books that shaped me'],
  },
  'coffee-shop-chronicles-chapter-one': {
    title: 'The Coffee Shop Chronicles: Chapter One',
    description:
      'She sat in the corner, a worn copy of "The Seven Husbands of Evelyn Hugo" in her hands.',
    image: '',
    publishedTime: '2024-01-15',
    author: 'Anshika Mishra',
    keywords: ['short story', 'coffee shop', 'fiction', 'Evelyn Hugo', 'literary fiction'],
  },
  'why-i-read-last-page-first': {
    title: 'Why I Read the Last Page First',
    description:
      "I know, I know. It's a cardinal sin in the bookish community. But hear me out.",
    image: '',
    publishedTime: '2024-01-12',
    author: 'Anshika Mishra',
    keywords: ['reading habits', 'bookish confessions', 'thoughts', 'reading community'],
  },
};

export function getBlogMeta(slug: string): ContentMeta | null {
  return BLOG_META[slug] ?? null;
}

export function getRecommendationMeta(slug: string): ContentMeta | null {
  return RECO_META[slug] ?? null;
}

export function getMusingMeta(slug: string): ContentMeta | null {
  return MUSING_META[slug] ?? null;
}
