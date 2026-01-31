import { Router, Request, Response } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { sendTestEmail } from '../services/welcomeEmail.js';

const router = Router();

/** POST /api/test-email – protected, send one test email to the given address (for SMTP testing). */
router.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const to = typeof req.body?.to === 'string' ? req.body.to.trim() : '';
  if (!to) {
    res.status(400).json({ error: 'Body must include "to" (email address).' });
    return;
  }
  try {
    await sendTestEmail(to);
    res.status(200).json({ message: 'Test email sent. Check the inbox (and spam) for ' + to });
  } catch (err) {
    console.error('POST /api/test-email', err);
    const message = err instanceof Error ? err.message : 'Failed to send test email';
    res.status(500).json({ error: message });
  }
});

export default router;
