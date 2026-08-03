import { Router, Request, Response } from 'express';
import { Page } from '../models/Page.js';
import { AuthorSpotlight, IAuthorSpotlight } from '../models/AuthorSpotlight.js';
import { VisitorStats, VISITOR_STATS_SINGLETON_ID } from '../models/VisitorStats.js';
import { filterPublishedPageItems } from '../utils/pageContentPublish.js';

const router = Router();

function countPublished(items: unknown): number {
  if (!Array.isArray(items)) return 0;
  return filterPublishedPageItems(items as Record<string, unknown>[]).length;
}

function isPubliclyVisible(doc: IAuthorSpotlight): boolean {
  if (!doc.isPublished) return false;
  if (!doc.publishDate) return true;
  return new Date(doc.publishDate) <= new Date();
}

/** GET /api/site/stats – public published content counts for homepage hero, etc. */
router.get('/stats', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [blogPage, recsPage, musingsPage, bookClubsPage, visitorStats, spotlights] = await Promise.all([
      Page.findOne({ slug: 'blog' }).lean(),
      Page.findOne({ slug: 'recommendations' }).lean(),
      Page.findOne({ slug: 'musings' }).lean(),
      Page.findOne({ slug: 'book-clubs' }).lean(),
      VisitorStats.findById(VISITOR_STATS_SINGLETON_ID).lean(),
      AuthorSpotlight.find({ isPublished: true }).lean(),
    ]);

    const blogContent = blogPage?.content as { posts?: unknown[] } | undefined;
    const recsContent = recsPage?.content as { items?: unknown[] } | undefined;
    const musingsContent = musingsPage?.content as { items?: unknown[] } | undefined;
    const clubsContent = bookClubsPage?.content as { clubs?: unknown[]; pageClubs?: unknown[] } | undefined;

    const clubList = Array.isArray(clubsContent?.pageClubs)
      ? clubsContent.pageClubs
      : Array.isArray(clubsContent?.clubs)
        ? clubsContent.clubs
        : [];

    res.status(200).json({
      reviews: countPublished(blogContent?.posts),
      recommendations: countPublished(recsContent?.items),
      musings: countPublished(musingsContent?.items),
      bookClubs: clubList.length,
      authorSpotlights: spotlights.filter((s) => isPubliclyVisible(s as unknown as IAuthorSpotlight)).length,
      readers: visitorStats?.totalVisitors ?? 0,
    });
  } catch (err) {
    console.error('GET /api/site/stats', err);
    res.status(500).json({
      reviews: 0,
      recommendations: 0,
      musings: 0,
      bookClubs: 0,
      authorSpotlights: 0,
      readers: 0,
    });
  }
});

export default router;
