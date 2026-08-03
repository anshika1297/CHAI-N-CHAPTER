import { LibraryBook } from '../models/LibraryBook.js';
import { LibraryAuthor } from '../models/LibraryAuthor.js';

export type InsightCard = {
  id: string;
  title: string;
  body: string;
  count: number;
  href: string;
  tone: 'terracotta' | 'sage' | 'muted';
};

export type LibraryInsights = {
  cards: InsightCard[];
  occasions: { name: string; count: number; neverRecommended: number }[];
  enrichment: {
    authorsMissingCountry: number;
    booksMissingTags: number;
    booksMissingThemes: number;
  };
  recentlyRecommended: {
    _id: string;
    title: string;
    author: string;
    lastRecommendedAt: string;
  }[];
  unreadOwnedSample: {
    _id: string;
    title: string;
    author: string;
    status: string;
  }[];
};

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

/**
 * Monday-morning literary strategist brief — actionable gaps & occasion fits.
 */
export async function buildLibraryInsights(): Promise<LibraryInsights> {
  const since60 = daysAgo(60);
  const since90 = daysAgo(90);

  const [
    unreadOwned,
    neverRecommendedRead,
    staleRecPool,
    authorsMissingCountry,
    booksMissingTags,
    booksMissingThemes,
    occasionAgg,
    recentlyRecommended,
    unreadOwnedSample,
  ] = await Promise.all([
    LibraryBook.countDocuments({
      'copies.0': { $exists: true },
      status: { $in: ['want-to-read', 'currently-reading'] },
    }),
    LibraryBook.countDocuments({
      status: 'read',
      $or: [
        { recommendationHistory: { $exists: false } },
        { recommendationHistory: { $size: 0 } },
      ],
    }),
    LibraryBook.countDocuments({
      status: 'read',
      recommendationHistory: {
        $not: { $elemMatch: { date: { $gte: since60 } } },
      },
    }),
    LibraryAuthor.countDocuments({
      $or: [{ country: { $in: ['', null] } }, { country: { $exists: false } }],
    }),
    LibraryBook.countDocuments({
      $or: [{ tags: { $exists: false } }, { tags: { $size: 0 } }],
    }),
    LibraryBook.countDocuments({
      $or: [{ themes: { $exists: false } }, { themes: { $size: 0 } }],
    }),
    LibraryBook.aggregate([
      { $match: { seasonalRecommendation: { $exists: true, $ne: [] } } },
      { $unwind: '$seasonalRecommendation' },
      {
        $group: {
          _id: '$seasonalRecommendation',
          count: { $sum: 1 },
          neverRecommended: {
            $sum: {
              $cond: [
                { $eq: [{ $size: { $ifNull: ['$recommendationHistory', []] } }, 0] },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
    LibraryBook.aggregate([
      { $match: { 'recommendationHistory.0': { $exists: true } } },
      {
        $addFields: {
          lastRecommendedAt: { $max: '$recommendationHistory.date' },
        },
      },
      { $sort: { lastRecommendedAt: -1 } },
      { $limit: 6 },
      { $project: { title: 1, author: 1, lastRecommendedAt: 1 } },
    ]),
    LibraryBook.find({
      'copies.0': { $exists: true },
      status: { $in: ['want-to-read', 'currently-reading'] },
    })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('title author status')
      .lean(),
  ]);

  // Genre gap: genres with books but none recommended in 90 days
  const genreGapAgg = await LibraryBook.aggregate([
    { $match: { status: 'read', genres: { $exists: true, $ne: [] } } },
    { $unwind: '$genres' },
    {
      $group: {
        _id: '$genres',
        total: { $sum: 1 },
        recentRecs: {
          $sum: {
            $cond: [
              {
                $gt: [
                  {
                    $size: {
                      $filter: {
                        input: { $ifNull: ['$recommendationHistory', []] },
                        as: 'h',
                        cond: { $gte: ['$$h.date', since90] },
                      },
                    },
                  },
                  0,
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    { $match: { total: { $gte: 3 }, recentRecs: 0 } },
    { $sort: { total: -1 } },
    { $limit: 3 },
  ]);

  const cards: InsightCard[] = [];

  if (unreadOwned > 0) {
    cards.push({
      id: 'unread-owned',
      title: 'Unread books you own',
      body: 'Sitting on the shelf — good candidates for “owned + unread” recommendations.',
      count: unreadOwned,
      href: '/admin/library/recommend?owned=1&status=want-to-read',
      tone: 'terracotta',
    });
  }

  if (neverRecommendedRead > 0) {
    cards.push({
      id: 'never-recommended',
      title: 'Read, never recommended',
      body: 'You’ve finished these but never used them in a rec list.',
      count: neverRecommendedRead,
      href: '/admin/library/recommend?neverRecommended=1&status=read',
      tone: 'sage',
    });
  }

  if (staleRecPool > 0) {
    cards.push({
      id: 'stale-recs',
      title: 'Not recommended in 60 days',
      body: 'Read books that haven’t appeared in a rec lately — good for rotation.',
      count: staleRecPool,
      href: '/admin/library/recommend?notRecommendedDays=60&status=read',
      tone: 'muted',
    });
  }

  for (const g of genreGapAgg as { _id: string; total: number }[]) {
    cards.push({
      id: `genre-gap-${g._id}`,
      title: `Haven’t posted ${g._id} in 90 days`,
      body: `${g.total} read books in this genre — fresh angle for the feed.`,
      count: g.total,
      href: `/admin/library/recommend?genre=${encodeURIComponent(g._id)}&neverRecommended=1`,
      tone: 'sage',
    });
  }

  if (authorsMissingCountry > 5) {
    cards.push({
      id: 'enrich-authors',
      title: 'Authors missing country',
      body: 'Enrich so nationality filters work for Independence Day / diaspora lists.',
      count: authorsMissingCountry,
      href: '/admin/library/authors',
      tone: 'muted',
    });
  }

  if (booksMissingTags > 10) {
    cards.push({
      id: 'missing-tags',
      title: 'Books without tags',
      body: 'Tag them so Ask + Hook Studio can find occasion fits.',
      count: booksMissingTags,
      href: '/admin/library/books',
      tone: 'muted',
    });
  }

  if (booksMissingThemes > 10) {
    cards.push({
      id: 'missing-themes',
      title: 'Books without themes',
      body: 'Theme tags power Ask + collection fits.',
      count: booksMissingThemes,
      href: '/admin/library/books',
      tone: 'muted',
    });
  }

  // Signature series cards for Phase 3/4 content planning
  const signatureSeries = [
    'Around the World in 52 Books',
    'States Through Stories',
    'The Epic Project',
    'Civilizations Through Books',
    'Roots of Bharat',
  ];
  const sigCounts = await Promise.all(
    signatureSeries.map(async (name) => ({
      name,
      count: await LibraryBook.countDocuments({
        collections: name,
        status: 'read',
        $or: [
          { recommendationHistory: { $exists: false } },
          { recommendationHistory: { $size: 0 } },
        ],
      }),
    }))
  );
  for (const s of sigCounts) {
    if (s.count < 1) continue;
    cards.push({
      id: `sig-${s.name}`,
      title: `${s.count} never-rec’d in “${s.name}”`,
      body: 'Signature series — open Recommend Builder with cooldown.',
      count: s.count,
      href: `/admin/library/recommend?collection=${encodeURIComponent(s.name)}&status=read&neverRecommended=true`,
      tone: 'sage',
    });
  }

  const occasions = (occasionAgg as { _id: string; count: number; neverRecommended: number }[]).map(
    (o) => ({
      name: o._id,
      count: o.count,
      neverRecommended: o.neverRecommended,
    })
  );

  // Surface top occasion as a card if strong
  const topOccasion = occasions[0];
  if (topOccasion && topOccasion.count >= 2) {
    cards.unshift({
      id: 'occasion-top',
      title: `${topOccasion.count} books fit “${topOccasion.name}”`,
      body:
        topOccasion.neverRecommended > 0
          ? `${topOccasion.neverRecommended} never recommended — open Hook Studio or Recommend.`
          : 'Open Hook Studio and ask for this occasion.',
      count: topOccasion.count,
      href: `/admin/library/content?q=${encodeURIComponent(topOccasion.name)}`,
      tone: 'terracotta',
    });
  }

  return {
    cards: cards.slice(0, 12),
    occasions,
    enrichment: {
      authorsMissingCountry,
      booksMissingTags,
      booksMissingThemes,
    },
    recentlyRecommended: (
      recentlyRecommended as {
        _id: unknown;
        title: string;
        author: string;
        lastRecommendedAt: Date;
      }[]
    ).map((b) => ({
      _id: String(b._id),
      title: b.title,
      author: b.author || '',
      lastRecommendedAt: b.lastRecommendedAt
        ? new Date(b.lastRecommendedAt).toISOString()
        : '',
    })),
    unreadOwnedSample: unreadOwnedSample.map((b) => ({
      _id: String(b._id),
      title: b.title,
      author: b.author || '',
      status: b.status,
    })),
  };
}
