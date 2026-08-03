export type ReactionContentType = 'blog' | 'recommendations' | 'musings' | 'author-spotlight';

export type ReactionDefinition = {
  id: string;
  emoji: string;
  label: string;
  /** Optional social proof line, e.g. "{count} readers added this to their TBR." */
  summaryLabel?: (count: number) => string;
};

export const REACTION_CONTENT_TYPES: ReactionContentType[] = [
  'blog',
  'recommendations',
  'musings',
  'author-spotlight',
];

const readers = (n: number) => (n === 1 ? '1 reader' : `${n} readers`);

export const REACTION_CATALOG: Record<ReactionContentType, ReactionDefinition[]> = {
  blog: [
    {
      id: 'tbr',
      emoji: '📚',
      label: 'Added to TBR',
      summaryLabel: (c) => `${readers(c)} added this to their TBR.`,
    },
    {
      id: 'convinced',
      emoji: '⭐',
      label: 'Convinced Me to Read',
      summaryLabel: (c) => `${readers(c)} were convinced to read this.`,
    },
    {
      id: 'love',
      emoji: '❤️',
      label: 'Already Love This Book',
      summaryLabel: (c) => `${readers(c)} already love this book.`,
    },
    {
      id: 'unsure',
      emoji: '🤔',
      label: 'Not Sure Yet',
      summaryLabel: (c) => `${readers(c)} are still on the fence.`,
    },
    {
      id: 'not-for-me',
      emoji: '👎',
      label: 'Not For Me',
    },
  ],
  recommendations: [
    {
      id: 'tbr',
      emoji: '📚',
      label: 'Added to TBR',
      summaryLabel: (c) => `${readers(c)} added books from this list to their TBR.`,
    },
    {
      id: 'need-these',
      emoji: '🔥',
      label: 'Need These Books',
      summaryLabel: (c) => `${readers(c)} need these books.`,
    },
    {
      id: 'great-recs',
      emoji: '❤️',
      label: 'Great Recommendations',
      summaryLabel: (c) => `${readers(c)} loved these recommendations.`,
    },
    {
      id: 'found-new',
      emoji: '✨',
      label: 'Found Something New',
      summaryLabel: (c) => `${readers(c)} found something new here.`,
    },
  ],
  musings: [
    {
      id: 'relatable',
      emoji: '❤️',
      label: 'Relatable',
      summaryLabel: (c) => `${readers(c)} found this relatable.`,
    },
    {
      id: 'beautifully-written',
      emoji: '✨',
      label: 'Beautifully Written',
      summaryLabel: (c) => `${readers(c)} called this beautifully written.`,
    },
    {
      id: 'made-me-think',
      emoji: '💭',
      label: 'Made Me Think',
      summaryLabel: (c) => `${readers(c)} said this made them think.`,
    },
    {
      id: 'reader-mood',
      emoji: '📚',
      label: 'Reader Mood',
      summaryLabel: (c) => `${readers(c)} felt this reader mood.`,
    },
  ],
  'author-spotlight': [
    {
      id: 'explore-author',
      emoji: '❤️',
      label: 'Want to Explore This Author',
      summaryLabel: (c) => `${readers(c)} want to explore this author.`,
    },
    {
      id: 'author-tbr',
      emoji: '📚',
      label: 'Added Author To Reading List',
      summaryLabel: (c) => `${readers(c)} added this author to their reading list.`,
    },
    {
      id: 'interesting-journey',
      emoji: '✨',
      label: 'Interesting Journey',
      summaryLabel: (c) => `${readers(c)} found this journey interesting.`,
    },
  ],
};

export function reactionIdsForType(contentType: ReactionContentType): string[] {
  return REACTION_CATALOG[contentType].map((r) => r.id);
}

export function isValidReaction(contentType: ReactionContentType, reactionId: string): boolean {
  return reactionIdsForType(contentType).includes(reactionId);
}

export function publicReactionMeta(contentType: ReactionContentType): ReactionDefinition[] {
  return REACTION_CATALOG[contentType];
}
