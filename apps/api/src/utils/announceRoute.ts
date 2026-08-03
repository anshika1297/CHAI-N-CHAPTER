import type { Request, Response } from 'express';
import type { AnnounceResult } from '../services/subscriberEmail.js';
import { findPublishedPageItemBySlug } from './pageAnnounce.js';
import { assertNotYetEmailed, markPageItemSubscribersEmailed } from './markSubscribersEmailed.js';

export function announceResultMessage(result: AnnounceResult): string {
  const { sent, total, testMode, testEmail } = result;
  if (testMode && testEmail) {
    if (sent === 1) {
      return `Test announcement sent to ${testEmail} only (ANNOUNCE_TEST_ONLY). Real subscribers were not emailed.`;
    }
    if (total === 0) return 'ANNOUNCE_TEST_ONLY is set but no recipient configured.';
    return `Failed to send test announcement to ${testEmail}. Check server logs and SMTP.`;
  }
  if (total === 0) return 'No subscribers to send to. Add subscribers first (Subscribe page).';
  if (sent === total) return `Announcement sent to ${sent} subscriber${sent === 1 ? '' : 's'}.`;
  return `Sent to ${sent} of ${total} subscribers. ${total - sent} failed (check server logs).`;
}

export function createPageItemAnnounceHandler(
  pageSlug: 'blog' | 'recommendations' | 'musings',
  send: (item: Record<string, unknown>) => Promise<AnnounceResult>
) {
  return async (req: Request, res: Response): Promise<void> => {
    const slug = typeof req.body?.slug === 'string' ? req.body.slug.trim() : '';
    if (!slug) {
      res.status(400).json({ error: 'Body must include "slug".' });
      return;
    }
    try {
      const item = await findPublishedPageItemBySlug(pageSlug, slug);
      assertNotYetEmailed(item);
      const result = await send(item);
      if (result.sent > 0 || (result.testMode && result.sent === 1)) {
        await markPageItemSubscribersEmailed(pageSlug, slug);
      }
      res.status(200).json({ ...result, message: announceResultMessage(result) });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send announcement';
      const status = message.includes('draft') || message.includes('not found') ? 400 : 500;
      console.error(`POST /api/${pageSlug}/announce`, err);
      res.status(status).json({ error: message });
    }
  };
}
