import { Router, Request, Response } from 'express';
import { REACTION_CONTENT_TYPES, type ReactionContentType } from '../config/reactionTypes.js';
import { reactionLimiter } from '../middlewares/rateLimiter.js';
import {
  getReactionSnapshot,
  resolveVoterKeyAsync,
  setReaction,
} from '../services/reactions.js';

const router = Router();

function parseContentType(raw: unknown): ReactionContentType | null {
  const v = typeof raw === 'string' ? raw.trim() : '';
  return REACTION_CONTENT_TYPES.includes(v as ReactionContentType) ? (v as ReactionContentType) : null;
}

/** GET /api/reactions?contentType=&contentSlug=&voterKey= */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const contentType = parseContentType(req.query.contentType);
  const contentSlug = typeof req.query.contentSlug === 'string' ? req.query.contentSlug.trim() : '';
  const voterKey =
    typeof req.query.voterKey === 'string' ? req.query.voterKey.trim() : undefined;
  const subscriberToken =
    typeof req.query.subscriberToken === 'string' ? req.query.subscriberToken.trim() : undefined;

  if (!contentType || !contentSlug) {
    res.status(400).json({ error: 'contentType and contentSlug are required' });
    return;
  }

  try {
    const resolvedKey = (await resolveVoterKeyAsync({ voterKey, subscriberToken })) ?? voterKey;
    const snapshot = await getReactionSnapshot(contentType, contentSlug, resolvedKey || undefined);
    res.status(200).json(snapshot);
  } catch (err) {
    console.error('GET /api/reactions', err);
    res.status(500).json({ error: 'Failed to load reactions' });
  }
});

/** POST /api/reactions — one reaction per reader per article */
router.post('/', reactionLimiter, async (req: Request, res: Response): Promise<void> => {
  const body = req.body ?? {};
  const contentType = parseContentType(body.contentType);
  const contentSlug = typeof body.contentSlug === 'string' ? body.contentSlug.trim() : '';
  const reactionId = typeof body.reactionId === 'string' ? body.reactionId.trim() : '';
  const voterKey = typeof body.voterKey === 'string' ? body.voterKey.trim() : undefined;
  const subscriberToken =
    typeof body.subscriberToken === 'string' ? body.subscriberToken.trim() : undefined;

  if (!contentType || !contentSlug || !reactionId) {
    res.status(400).json({ error: 'contentType, contentSlug, and reactionId are required' });
    return;
  }

  const resolvedKey = await resolveVoterKeyAsync({ voterKey, subscriberToken });
  if (!resolvedKey) {
    res.status(400).json({ error: 'A reader session is required to react' });
    return;
  }

  try {
    const snapshot = await setReaction({
      contentType,
      contentSlug,
      reactionId,
      voterKey: resolvedKey,
    });
    res.status(200).json(snapshot);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save reaction';
    const status =
      message === 'Content not found' ? 404 : message === 'Invalid reaction' ? 400 : 500;
    if (status === 500) console.error('POST /api/reactions', err);
    res.status(status).json({ error: message });
  }
});

export default router;
