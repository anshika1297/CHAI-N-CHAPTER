import { Router, Request, Response } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { User } from '../models/User.js';
import { Subscriber } from '../models/Subscriber.js';
import { Message } from '../models/Message.js';
import { Page } from '../models/Page.js';
import { VisitorStats, VISITOR_STATS_SINGLETON_ID } from '../models/VisitorStats.js';

const router = Router();

/** GET /api/dashboard/stats – protected. Returns real-time counts from DB. */
router.get('/stats', requireAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const [userCount, totalSubscribers, totalMessages, unreadMessages, visitorStats, blogPage, recsPage, musingsPage, bookClubsPage] = await Promise.all([
      User.countDocuments(),
      Subscriber.countDocuments({ status: 'subscribed' }),
      Message.countDocuments(),
      Message.countDocuments({ read: false }),
      VisitorStats.findById(VISITOR_STATS_SINGLETON_ID).lean(),
      Page.findOne({ slug: 'blog' }).lean(),
      Page.findOne({ slug: 'recommendations' }).lean(),
      Page.findOne({ slug: 'musings' }).lean(),
      Page.findOne({ slug: 'book-clubs' }).lean(),
    ]);

    const totalVisitors = visitorStats?.totalVisitors ?? 0;
    const monthlyVisitors = visitorStats?.monthlyVisitors ?? 0;

    const blogContent = blogPage?.content as { posts?: unknown[] } | undefined;
    const recsContent = recsPage?.content as { items?: unknown[] } | undefined;
    const musingsContent = musingsPage?.content as { items?: unknown[] } | undefined;
    const bookClubsContent = bookClubsPage?.content as { clubs?: unknown[]; pageClubs?: unknown[] } | undefined;

    const blogPosts = Array.isArray(blogContent?.posts) ? blogContent.posts.length : 0;
    const recsItems = Array.isArray(recsContent?.items) ? recsContent.items.length : 0;
    const musingsItems = Array.isArray(musingsContent?.items) ? musingsContent.items.length : 0;
    const bookClubs = Array.isArray(bookClubsContent?.pageClubs) ? bookClubsContent.pageClubs.length : Array.isArray(bookClubsContent?.clubs) ? bookClubsContent.clubs.length : 0;

    const stats = {
      totalVisitors,
      monthlyVisitors,
      totalPosts: blogPosts,
      totalRecommendations: recsItems,
      totalMusings: musingsItems,
      totalBookClubs: bookClubs,
      totalSubscribers,
      totalMessages,
      unreadMessages,
      totalAdminUsers: userCount,
    };
    res.status(200).json(stats);
  } catch (err) {
    console.error('GET /api/dashboard/stats', err);
    res.status(500).json({
      totalVisitors: 0,
      monthlyVisitors: 0,
      totalPosts: 0,
      totalRecommendations: 0,
      totalMusings: 0,
      totalBookClubs: 0,
      totalSubscribers: 0,
      totalMessages: 0,
      unreadMessages: 0,
      totalAdminUsers: 0,
    });
  }
});

export default router;
