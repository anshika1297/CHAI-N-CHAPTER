import { Router, Request, Response } from 'express';
import { Comment, type CommentContentType, type CommentStatus } from '../models/Comment.js';
import { requireAuth } from '../middlewares/auth.js';
import { commentLimiter } from '../middlewares/rateLimiter.js';
import {
  getApprovedCommentCount,
  getApprovedComments,
  submitComment,
} from '../services/comments.js';
import { resolveSubscriberForComment } from '../services/subscriberComment.js';

const router = Router();

const CONTENT_TYPES: CommentContentType[] = ['blog', 'recommendations', 'musings', 'author-spotlight'];
const STATUSES: CommentStatus[] = ['pending', 'approved', 'rejected', 'spam'];

function parseContentType(raw: unknown): CommentContentType | null {
  const v = typeof raw === 'string' ? raw.trim() : '';
  return CONTENT_TYPES.includes(v as CommentContentType) ? (v as CommentContentType) : null;
}

/** GET /api/comments?contentType=&contentSlug= — approved threaded comments */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const contentType = parseContentType(req.query.contentType);
  const contentSlug = typeof req.query.contentSlug === 'string' ? req.query.contentSlug.trim() : '';
  if (!contentType || !contentSlug) {
    res.status(400).json({ error: 'contentType and contentSlug are required' });
    return;
  }
  try {
    const [comments, count] = await Promise.all([
      getApprovedComments(contentType, contentSlug),
      getApprovedCommentCount(contentType, contentSlug),
    ]);
    res.status(200).json({ comments, count });
  } catch (err) {
    console.error('GET /api/comments', err);
    res.status(500).json({ error: 'Failed to load comments' });
  }
});

/** GET /api/comments/count?contentType=&contentSlug= */
router.get('/count', async (req: Request, res: Response): Promise<void> => {
  const contentType = parseContentType(req.query.contentType);
  const contentSlug = typeof req.query.contentSlug === 'string' ? req.query.contentSlug.trim() : '';
  if (!contentType || !contentSlug) {
    res.status(400).json({ error: 'contentType and contentSlug are required' });
    return;
  }
  try {
    const count = await getApprovedCommentCount(contentType, contentSlug);
    res.status(200).json({ count });
  } catch (err) {
    console.error('GET /api/comments/count', err);
    res.status(500).json({ error: 'Failed to load count' });
  }
});

/** POST /api/comments — public submit (moderated) */
router.post('/', commentLimiter, async (req: Request, res: Response): Promise<void> => {
  const body = req.body ?? {};
  const contentType = parseContentType(body.contentType);
  const contentSlug = typeof body.contentSlug === 'string' ? body.contentSlug.trim() : '';
  const subscriberToken =
    typeof body.subscriberToken === 'string' ? body.subscriberToken.trim() : '';
  let name = typeof body.name === 'string' ? body.name.trim() : '';
  let email = typeof body.email === 'string' ? body.email.trim() : '';
  const text = typeof body.body === 'string' ? body.body.trim() : '';
  const parentId = typeof body.parentId === 'string' ? body.parentId.trim() : undefined;
  const website = typeof body.website === 'string' ? body.website : undefined;

  if (!contentType || !contentSlug) {
    res.status(400).json({ error: 'contentType and contentSlug are required' });
    return;
  }

  if (subscriberToken) {
    const subscriber = await resolveSubscriberForComment(subscriberToken);
    if (!subscriber) {
      res.status(401).json({ error: 'Subscriber session expired. Verify your email or post as a guest.' });
      return;
    }
    name = subscriber.name;
    email = subscriber.email;
  } else {
    if (!name || name.length < 2) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Valid email is required' });
      return;
    }
  }
  if (!text || text.length < 3) {
    res.status(400).json({ error: 'Comment is too short' });
    return;
  }

  try {
    const result = await submitComment({
      contentType,
      contentSlug,
      parentId,
      name,
      email,
      body: text,
      website,
      ip: req.ip,
      userAgent: req.get('user-agent') ?? '',
    });
    res.status(201).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to submit comment';
    const status = message === 'Content not found' ? 404 : message.includes('parent') || message.includes('depth') ? 400 : 500;
    if (status === 500) console.error('POST /api/comments', err);
    res.status(status).json({ error: message });
  }
});

/** GET /api/comments/admin — moderation queue */
router.get('/admin', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit), 10) || 20));
  const statusRaw = typeof req.query.status === 'string' ? req.query.status : 'pending';
  const filter =
    statusRaw === 'all' ? {} : STATUSES.includes(statusRaw as CommentStatus) ? { status: statusRaw } : { status: 'pending' };

  try {
    const [items, total, pendingTotal] = await Promise.all([
      Comment.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Comment.countDocuments(filter),
      Comment.countDocuments({ status: 'pending' }),
    ]);
    res.status(200).json({
      list: items.map((doc) => ({
        id: String(doc._id),
        contentType: doc.contentType,
        contentSlug: doc.contentSlug,
        parentId: doc.parentId ? String(doc.parentId) : null,
        name: doc.name,
        email: doc.email,
        body: doc.body,
        status: doc.status,
        createdAt: doc.createdAt,
      })),
      total,
      pendingTotal,
      page,
      limit,
    });
  } catch (err) {
    console.error('GET /api/comments/admin', err);
    res.status(500).json({ error: 'Failed to load comments' });
  }
});

/** PATCH /api/comments/admin/:id — approve / reject / spam */
router.patch('/admin/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const status = typeof req.body?.status === 'string' ? req.body.status : '';
  if (!STATUSES.includes(status as CommentStatus)) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }
  try {
    const doc = await Comment.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!doc) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }
    res.status(200).json({ id: String(doc._id), status: doc.status });
  } catch (err) {
    console.error('PATCH /api/comments/admin/:id', err);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

/** DELETE /api/comments/admin/:id */
router.delete('/admin/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const doc = await Comment.findByIdAndDelete(req.params.id);
    if (!doc) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }
    await Comment.deleteMany({ parentId: doc._id });
    res.status(200).json({ deleted: true });
  } catch (err) {
    console.error('DELETE /api/comments/admin/:id', err);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

export default router;
