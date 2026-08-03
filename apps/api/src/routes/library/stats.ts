import { Router, Request, Response } from 'express';
import { LibraryBook } from '../../models/LibraryBook.js';
import { LibraryAuthor } from '../../models/LibraryAuthor.js';
import { requireAuth } from '../../middlewares/auth.js';
import { buildLibraryInsights } from '../../services/libraryInsights.js';

const router = Router();
router.use(requireAuth);

/** GET /api/library/stats — dashboard summary + Monday-morning insights. */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalBooks,
      booksRead,
      currentlyReading,
      wantToRead,
      booksOwned,
      totalAuthors,
      recentlyAdded,
      topGenresAgg,
      readNeverReviewed,
      byLocationAgg,
      insights,
    ] = await Promise.all([
      LibraryBook.countDocuments({}),
      LibraryBook.countDocuments({ status: 'read' }),
      LibraryBook.countDocuments({ status: 'currently-reading' }),
      LibraryBook.countDocuments({ status: 'want-to-read' }),
      LibraryBook.countDocuments({ 'copies.0': { $exists: true } }),
      LibraryAuthor.countDocuments({}),
      LibraryBook.find().sort({ createdAt: -1 }).limit(6).select('title author coverImage slug status').lean(),
      LibraryBook.aggregate([
        { $unwind: '$genres' },
        { $group: { _id: '$genres', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      LibraryBook.countDocuments({
        status: 'read',
        $or: [{ 'contentLinks.blog': { $in: ['', null] } }, { contentLinks: { $exists: false } }],
      }),
      LibraryBook.aggregate([
        { $unwind: '$copies' },
        { $match: { 'copies.location': { $nin: ['', null] } } },
        { $group: { _id: '$copies.location', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      buildLibraryInsights(),
    ]);

    res.status(200).json({
      totals: {
        totalBooks,
        booksRead,
        currentlyReading,
        wantToRead,
        booksOwned,
        totalAuthors,
        readNeverReviewed,
      },
      recentlyAdded,
      topGenres: (topGenresAgg as { _id: string; count: number }[]).map((g) => ({
        name: g._id,
        count: g.count,
      })),
      byLocation: (byLocationAgg as { _id: string; count: number }[]).map((l) => ({
        name: l._id,
        count: l.count,
      })),
      insights,
    });
  } catch (err) {
    console.error('GET /api/library/stats', err);
    res.status(500).json({ error: 'Failed to load library stats' });
  }
});

export default router;
