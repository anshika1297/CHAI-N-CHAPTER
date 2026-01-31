import { Router, Request, Response } from 'express';
import { Page } from '../models/Page.js';
import { requireAuth } from '../middlewares/auth.js';
import { rewriteImageUrlsInObject } from './upload.js';
import { sendBookClubAnnouncementEmail, type BookClubPayload } from '../services/bookClubAnnouncementEmail.js';

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
    const content = rewriteImageUrlsInObject(page.content) as typeof page.content;
    res.status(200).json({ content });
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

/** POST /api/book-clubs/announce – protected, send book club announcement to all subscribers. Body: { bookClubId: string } */
router.post('/announce', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const bookClubId = typeof req.body?.bookClubId === 'string' ? req.body.bookClubId.trim() : '';
  if (!bookClubId) {
    res.status(400).json({ error: 'Missing body.bookClubId' });
    return;
  }
  try {
    const page = await Page.findOne({ slug: BOOK_CLUBS_SLUG });
    if (!page?.content || typeof page.content !== 'object' || Array.isArray(page.content)) {
      res.status(404).json({ error: 'Book clubs page not found' });
      return;
    }
    const content = page.content as Record<string, unknown>;
    const raw = Array.isArray(content.pageClubs) ? content.pageClubs : Array.isArray(content.clubs) ? content.clubs : [];
    const club = raw.find(
      (c: unknown) => c != null && typeof c === 'object' && String((c as { id?: unknown }).id) === bookClubId
    ) as Record<string, unknown> | undefined;
    if (!club || typeof club.name !== 'string' || typeof club.description !== 'string') {
      res.status(404).json({ error: 'Book club not found' });
      return;
    }
    const joinLink = typeof club.joinLink === 'string' && club.joinLink.trim() ? club.joinLink.trim() : '';
    const payload: BookClubPayload = {
      id: String(club.id),
      name: String(club.name).trim(),
      description: String(club.description).trim(),
      joinLink,
      logo: typeof club.logo === 'string' ? club.logo.trim() : undefined,
    };
    const result = await sendBookClubAnnouncementEmail(payload);
    res.status(200).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send announcement';
    console.error('POST /api/book-clubs/announce', err);
    res.status(500).json({ error: message });
  }
});

export default router;
