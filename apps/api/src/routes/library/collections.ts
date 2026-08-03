import { Router, Request, Response } from 'express';
import { LibraryBook } from '../../models/LibraryBook.js';
import { LibraryTaxonomy } from '../../models/LibraryTaxonomy.js';
import { requireAuth } from '../../middlewares/auth.js';
import { librarySlugify } from '../../config/libraryEnums.js';

const router = Router();
router.use(requireAuth);

/** Editorial pillars for Signature Collections UI. */
export const COLLECTION_PILLARS: Record<string, string> = {
  'India Bookshelf': 'India Bookshelf',
  'World Bookshelf': 'World Bookshelf',
  'Roots of Bharat': 'Roots of Bharat',
  'Mood Reads': 'Mood Reads',
  'Heartbreaking Reads': 'Mood Reads',
  'Comfort Reads': 'Mood Reads',
  'Dark & Atmospheric': 'Mood Reads',
  'Page-Turners': 'Mood Reads',
  'Slow Literary': 'Mood Reads',
  'Around the World in 52 Books': 'Signature',
  'States Through Stories': 'Signature',
  'The Epic Project': 'Signature',
  'Civilizations Through Books': 'Signature',
  'Partition Stories': 'India Bookshelf',
  'Indian Literary Fiction': 'India Bookshelf',
  'Indian Historical Fiction': 'India Bookshelf',
  'Indian Mythology Retellings': 'Roots of Bharat',
  'East Asia Shelf': 'World Bookshelf',
  'Middle East & North Africa': 'World Bookshelf',
  'European Shelf': 'World Bookshelf',
  'African Shelf': 'World Bookshelf',
  'Americas Shelf': 'World Bookshelf',
  'Women Writers': 'Women Shelves',
  'Women-Centric Reads': 'Women Shelves',
  'For Women Readers': 'Women Shelves',
  'Indian Women Writers': 'India Bookshelf',
};

const SIGNATURE = [
  'Around the World in 52 Books',
  'States Through Stories',
  'The Epic Project',
  'Civilizations Through Books',
];

/**
 * GET /api/library/collections
 * Browse collections with book counts + never-recommended counts for content planning.
 */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const agg = await LibraryBook.aggregate<{
      _id: string;
      count: number;
      neverRecommended: number;
      readCount: number;
    }>([
      { $unwind: '$collections' },
      {
        $group: {
          _id: '$collections',
          count: { $sum: 1 },
          neverRecommended: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: [{ $ifNull: ['$recommendationHistory', []] }, []] },
                    { $eq: [{ $size: { $ifNull: ['$recommendationHistory', []] } }, 0] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          readCount: {
            $sum: { $cond: [{ $eq: ['$status', 'read'] }, 1, 0] },
          },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const items = agg
      .filter((a) => a._id && String(a._id).trim())
      .map((a) => {
        const name = String(a._id);
        const pillar = COLLECTION_PILLARS[name] || (SIGNATURE.includes(name) ? 'Signature' : 'Other');
        return {
          name,
          pillar,
          signature: SIGNATURE.includes(name) || pillar === 'Signature' || name.startsWith('Epic ·') || name.startsWith('Civilization ·') || name.endsWith('Stories'),
          count: a.count,
          neverRecommended: a.neverRecommended,
          readCount: a.readCount,
          recommendHref: `/admin/library/recommend?collection=${encodeURIComponent(name)}&status=read&neverRecommended=true`,
          hooksHref: `/admin/library/content?mode=list&q=${encodeURIComponent(name)}`,
          booksHref: `/admin/library/books?collection=${encodeURIComponent(name)}`,
        };
      });

    const byPillar: Record<string, typeof items> = {};
    for (const item of items) {
      byPillar[item.pillar] = byPillar[item.pillar] || [];
      byPillar[item.pillar].push(item);
    }

    res.status(200).json({
      totalCollections: items.length,
      signature: SIGNATURE,
      items,
      byPillar,
    });
  } catch (err) {
    console.error('GET /api/library/collections', err);
    res.status(500).json({ error: 'Failed to load collections' });
  }
});

/**
 * GET /api/library/collections/calendar
 * Lightweight content-calendar suggestions from signature series (never-recommended first).
 */
router.get('/calendar', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = Math.min(12, Math.max(1, parseInt(String(req.query.limit || '8'), 10) || 8));
    const weeks: {
      series: string;
      angle: string;
      books: { _id: string; title: string; author: string; country?: string }[];
    }[] = [];

    const seriesPlans: { series: string; angle: string; match: RegExp | string }[] = [
      { series: 'Around the World in 52 Books', angle: 'One country this week', match: 'Around the World in 52 Books' },
      { series: 'States Through Stories', angle: 'One Indian state/region', match: 'States Through Stories' },
      { series: 'The Epic Project', angle: 'One epic character focus', match: /^Epic ·/ },
      { series: 'Civilizations Through Books', angle: 'One civilization lens', match: /^Civilization ·/ },
      { series: 'Roots of Bharat', angle: 'Mythology / civilizational memory', match: 'Roots of Bharat' },
      { series: 'Mood Reads', angle: 'Heartbreaking or comfort lane', match: 'Heartbreaking Reads' },
    ];

    for (const plan of seriesPlans) {
      const filter =
        typeof plan.match === 'string'
          ? { collections: plan.match }
          : { collections: { $regex: plan.match } };
      const docs = await LibraryBook.find({
        ...filter,
        status: 'read',
        $or: [
          { recommendationHistory: { $exists: false } },
          { recommendationHistory: { $size: 0 } },
        ],
      })
        .sort({ rating: -1, title: 1 })
        .limit(limit)
        .select('title author country')
        .lean();

      weeks.push({
        series: plan.series,
        angle: plan.angle,
        books: docs.map((d) => ({
          _id: String(d._id),
          title: d.title,
          author: d.author || '',
          country: d.country || undefined,
        })),
      });
    }

    res.status(200).json({ weeks });
  } catch (err) {
    console.error('GET /api/library/collections/calendar', err);
    res.status(500).json({ error: 'Failed to build calendar suggestions' });
  }
});

/**
 * POST /api/library/collections/seed
 * Ensure Signature + pillar collection names exist in Master Data taxonomy.
 */
router.post('/seed', async (_req: Request, res: Response): Promise<void> => {
  const names = [
    ...SIGNATURE,
    'India Bookshelf',
    'World Bookshelf',
    'Roots of Bharat',
    'Mood Reads',
    'Heartbreaking Reads',
    'Comfort Reads',
    'Dark & Atmospheric',
    'Page-Turners',
    'Slow Literary',
    'Partition Stories',
    'Indian Literary Fiction',
    'Indian Historical Fiction',
    'Indian Mythology Retellings',
    'Indian Women Writers',
    'Women Writers',
    'Women-Centric Reads',
    'For Women Readers',
    'East Asia Shelf',
    'Middle East & North Africa',
    'Kerala Stories',
    'Bengal Stories',
    'Kashmir Stories',
    'Rajasthan Stories',
    'Tamil Nadu Stories',
    'Gujarat Stories',
    'Assam & Northeast Stories',
    'Maharashtra Stories',
    'Punjab Stories',
    'Civilization · Greece',
    'Civilization · Rome',
    'Civilization · Egypt',
    'Civilization · Persia',
    'Civilization · China',
    'Civilization · Japan',
    'Epic · Karna',
    'Epic · Kunti',
    'Epic · Gandhari',
    'Epic · Mandodari',
    'Epic · Bhishma',
    'Epic · Draupadi',
    'Epic · Sita',
  ];

  let created = 0;
  try {
    for (const name of names) {
      const slug = librarySlugify(name);
      const exists = await LibraryTaxonomy.exists({ type: 'collection', slug });
      if (exists) continue;
      const pillar = COLLECTION_PILLARS[name] || (name.startsWith('Epic ·') || name.startsWith('Civilization ·') ? 'Signature' : 'Other');
      await LibraryTaxonomy.create({
        type: 'collection',
        name,
        slug,
        description: pillar === 'Signature' ? `Signature series · ${pillar}` : `Editorial pillar · ${pillar}`,
        meta: { pillar },
      });
      created++;
    }
    res.status(200).json({ created, total: names.length });
  } catch (err) {
    console.error('POST /api/library/collections/seed', err);
    res.status(500).json({ error: 'Failed to seed collections' });
  }
});

export default router;
