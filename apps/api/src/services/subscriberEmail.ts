import { Page } from '../models/Page.js';
import { Subscriber } from '../models/Subscriber.js';
import { config } from '../config/index.js';
import { createSmtpTransporter, isSmtpConfigured, resolveFromAddress } from './smtpConfig.js';

export type AnnounceResult = {
  sent: number;
  total: number;
  /** True when ANNOUNCE_TEST_ONLY is set (development only). */
  testMode?: boolean;
  testEmail?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Recipients for announce emails. In development, ANNOUNCE_TEST_ONLY sends to one inbox only. */
export async function resolveAnnouncementRecipients(): Promise<{
  recipients: string[];
  testMode: boolean;
  testEmail?: string;
}> {
  const testEmail = process.env.ANNOUNCE_TEST_ONLY?.trim();
  if (testEmail && config.nodeEnv !== 'production') {
    if (!EMAIL_RE.test(testEmail)) {
      throw new Error(`Invalid ANNOUNCE_TEST_ONLY email: "${testEmail}"`);
    }
    console.warn(`[announce] Test mode — sending only to ${testEmail} (not all subscribers)`);
    return { recipients: [testEmail], testMode: true, testEmail };
  }

  const subscribers = await Subscriber.find({ status: 'subscribed' }).select('email').lean();
  const recipients = subscribers.map((s) => (s.email || '').trim()).filter(Boolean);
  return { recipients, testMode: false };
}

export type SubscriberEmailSettings = {
  fromEmail?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
  blogAnnounceSubject?: string;
  blogAnnounceBodyHtml?: string;
  recommendationAnnounceSubject?: string;
  recommendationAnnounceBodyHtml?: string;
  musingsAnnounceSubject?: string;
  musingsAnnounceBodyHtml?: string;
};

export async function getSubscriberEmailSettings(): Promise<SubscriberEmailSettings | null> {
  try {
    const page = await Page.findOne({ slug: 'email-settings' });
    if (!page?.content || typeof page.content !== 'object' || Array.isArray(page.content)) return null;
    const c = page.content as Record<string, unknown>;
    const port = c.smtpPort;
    return {
      fromEmail: typeof c.fromEmail === 'string' ? c.fromEmail.trim() : undefined,
      smtpHost: typeof c.smtpHost === 'string' ? c.smtpHost.trim() : undefined,
      smtpPort: typeof port === 'number' ? port : typeof port === 'string' ? parseInt(String(port), 10) : undefined,
      smtpSecure: c.smtpSecure === true || c.smtpSecure === 'true',
      smtpUser: typeof c.smtpUser === 'string' ? c.smtpUser.trim() : undefined,
      smtpPass: typeof c.smtpPass === 'string' ? c.smtpPass : undefined,
      blogAnnounceSubject: typeof c.blogAnnounceSubject === 'string' ? c.blogAnnounceSubject.trim() : undefined,
      blogAnnounceBodyHtml: typeof c.blogAnnounceBodyHtml === 'string' ? c.blogAnnounceBodyHtml.trim() : undefined,
      recommendationAnnounceSubject: typeof c.recommendationAnnounceSubject === 'string' ? c.recommendationAnnounceSubject.trim() : undefined,
      recommendationAnnounceBodyHtml: typeof c.recommendationAnnounceBodyHtml === 'string' ? c.recommendationAnnounceBodyHtml.trim() : undefined,
      musingsAnnounceSubject: typeof c.musingsAnnounceSubject === 'string' ? c.musingsAnnounceSubject.trim() : undefined,
      musingsAnnounceBodyHtml: typeof c.musingsAnnounceBodyHtml === 'string' ? c.musingsAnnounceBodyHtml.trim() : undefined,
    };
  } catch {
    return null;
  }
}

export function wrapAnnouncementBody(html: string): string {
  if (html.includes('<!DOCTYPE') || html.includes('<html')) return html;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:24px;color:#3d3329;background:#faf8f5;">${html}</body></html>`;
}

/** Send one HTML email to subscribed recipients (or ANNOUNCE_TEST_ONLY in development). */
export async function sendToSubscribers(
  subject: string,
  buildHtml: (subscriberEmail: string) => string
): Promise<AnnounceResult> {
  const settings = await getSubscriberEmailSettings();
  if (!isSmtpConfigured(settings ?? null, config.smtp)) {
    throw new Error('SMTP is not configured. Set SMTP in .env or Admin → Subscriber emails.');
  }

  const { recipients, testMode, testEmail } = await resolveAnnouncementRecipients();
  const total = recipients.length;
  if (total === 0) return { sent: 0, total: 0, testMode, testEmail };

  const from = resolveFromAddress(settings ?? null, config.smtp);
  const { transporter } = createSmtpTransporter(settings ?? null, config.smtp);
  const mailSubject = testMode ? `[TEST] ${subject}` : subject;
  let sent = 0;
  for (const to of recipients) {
    try {
      const html = wrapAnnouncementBody(buildHtml(to));
      await transporter.sendMail({ from, to, subject: mailSubject, html });
      sent++;
    } catch (err) {
      console.error('Subscriber email send error for', to, err);
    }
  }
  return { sent, total, testMode, testEmail };
}
