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
  const smtp = req.body?.smtp;
  const overrides =
    smtp && typeof smtp === 'object' && !Array.isArray(smtp)
      ? {
          fromEmail: typeof smtp.fromEmail === 'string' ? smtp.fromEmail : undefined,
          smtpHost: typeof smtp.smtpHost === 'string' ? smtp.smtpHost : undefined,
          smtpPort: typeof smtp.smtpPort === 'number' ? smtp.smtpPort : typeof smtp.smtpPort === 'string' ? parseInt(smtp.smtpPort, 10) : undefined,
          smtpSecure: smtp.smtpSecure === true || smtp.smtpSecure === 'true',
          smtpUser: typeof smtp.smtpUser === 'string' ? smtp.smtpUser : undefined,
          smtpPass: typeof smtp.smtpPass === 'string' ? smtp.smtpPass : undefined,
        }
      : undefined;

  try {
    const meta = await sendTestEmail(to, overrides);
    res.status(200).json({
      message: `Test email sent from ${meta.from} via ${meta.host}:${meta.port}. Check inbox and spam for ${to}.`,
    });
  } catch (err) {
    console.error('POST /api/test-email', err);
    const message = err instanceof Error ? err.message : 'Failed to send test email';
    res.status(500).json({ error: message });
  }
});

export default router;
