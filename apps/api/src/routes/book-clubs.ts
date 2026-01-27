import { Router, Request, Response } from 'express';
import { Page } from '../models/Page.js';
import { requireAuth } from '../middlewares/auth.js';

const BOOK_CLUBS_SLUG = 'book-clubs' as const;

const router = Router();

/** GET /api/book-clubs – public, returns stored book-clubs data for display */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const page = await Page.findOne({ slug: BOOK_CLUBS_SLUG });
    if (!page) {
      res.status(200).json({ content: null });
      return;
    }
    res.status(200).json({ content: page.content });
  } catch (err) {
    console.error('GET /api/book-clubs', err);
    res.status(500).json({ error: 'Failed to load book clubs' });
  }
});

/** PUT /api/book-clubs – protected, admin saves book-clubs data */
router.put('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const content = req.body;
  if (content === undefined || content === null) {
    res.status(400).json({ error: 'Missing body' });
    return;
  }
  try {
    const page = await Page.findOneAndUpdate(
      { slug: BOOK_CLUBS_SLUG },
      { content: typeof content === 'object' && !Array.isArray(content) ? content : { content }, updatedAt: new Date() },
      { new: true, upsert: true }
    );
    res.status(200).json({ content: page.content });
  } catch (err) {
    console.error('PUT /api/book-clubs', err);
    res.status(500).json({ error: 'Failed to save book clubs' });
  }
});

export default router;
