import nodemailer from 'nodemailer';
import { Page } from '../models/Page.js';
import { Subscriber } from '../models/Subscriber.js';
import { config } from '../config/index.js';

export type BookClubPayload = {
  id: string;
  name: string;
  description: string;
  joinLink: string;
  logo?: string;
};

type EmailSettings = {
  fromEmail?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
  bookClubAnnounceSubject?: string;
  bookClubAnnounceBodyHtml?: string;
};

async function getEmailSettings(): Promise<EmailSettings | null> {
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
      bookClubAnnounceSubject: typeof c.bookClubAnnounceSubject === 'string' ? c.bookClubAnnounceSubject.trim() : undefined,
      bookClubAnnounceBodyHtml: typeof c.bookClubAnnounceBodyHtml === 'string' ? c.bookClubAnnounceBodyHtml.trim() : undefined,
    };
  } catch {
    return null;
  }
}

function isSmtpConfigured(settings: { smtpUser?: string; smtpPass?: string } | null, env: typeof config.smtp): boolean {
  if (settings?.smtpUser?.trim() && settings?.smtpPass?.trim()) return true;
  return Boolean(env.host?.trim() && env.user?.trim() && env.pass?.trim());
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildUnsubscribeFooter(siteUrl: string, email: string): string {
  const url = `${siteUrl}/subscribe/unsubscribe?email=${encodeURIComponent(email)}`;
  return `<p style="margin:24px 0 0;font-size:14px;color:#8b7355;">You can <a href="${url}" style="color:#c4704a;">unsubscribe anytime</a> from our emails.</p>`;
}

function toAbsoluteImageUrl(logo: string | undefined): string {
  if (!logo || !logo.trim()) return '';
  const trimmed = logo.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  const base = config.publicSiteUrl.replace(/\/$/, '');
  return trimmed.startsWith('/') ? base + trimmed : base + '/' + trimmed;
}

function buildDefaultAnnouncementHtml(club: BookClubPayload, subscriberEmail: string): string {
  const siteUrl = config.publicSiteUrl.replace(/\/$/, '');
  const imageUrl = toAbsoluteImageUrl(club.logo);
  const joinLink = club.joinLink?.trim() || `${siteUrl}/book-clubs`;
  const imgBlock = imageUrl
    ? `<p style="margin:0 0 16px;"><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(club.name)}" width="560" style="max-width:100%;height:auto;border-radius:8px;display:block;" /></p>`
    : '';
  const unsubscribeFooter = buildUnsubscribeFooter(siteUrl, subscriberEmail);

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:24px;color:#3d3329;background:#faf8f5;">
  <p style="margin:0 0 16px;font-size:18px;">Hi there,</p>
  <p style="margin:0 0 16px;color:#5c4d3d;">We've just added a new book club you might like:</p>
  ${imgBlock}
  <h2 style="margin:0 0 12px;font-size:22px;color:#3d3329;">${escapeHtml(club.name)}</h2>
  <p style="margin:0 0 16px;color:#5c4d3d;line-height:1.5;">${escapeHtml(club.description)}</p>
  <p style="margin:0 0 24px;"><a href="${escapeHtml(joinLink)}" style="display:inline-block;background:#c4704a;color:#fff;padding:12px 20px;text-decoration:none;border-radius:8px;font-weight:600;">Join this book club</a></p>
  ${unsubscribeFooter}
  <p style="margin:8px 0 0;font-size:14px;color:#8b7355;">— Chai & Chapter</p>
</body>
</html>`;
}

function buildAnnouncementHtmlFromTemplate(
  templateHtml: string,
  club: BookClubPayload,
  subscriberEmail: string
): string {
  const siteUrl = config.publicSiteUrl.replace(/\/$/, '');
  const imageUrl = toAbsoluteImageUrl(club.logo);
  const joinLink = club.joinLink?.trim() || `${siteUrl}/book-clubs`;
  const unsubscribeUrl = `${siteUrl}/subscribe/unsubscribe?email=${encodeURIComponent(subscriberEmail)}`;
  const clubImageTag = imageUrl
    ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(club.name)}" width="560" style="max-width:100%;height:auto;border-radius:8px;display:block;" />`
    : '';
  const unsubscribeFooter = buildUnsubscribeFooter(siteUrl, subscriberEmail);

  let html = templateHtml
    .replace(/\{\{clubName\}\}/g, escapeHtml(club.name))
    .replace(/\{\{clubDescription\}\}/g, escapeHtml(club.description))
    .replace(/\{\{clubImage\}\}/g, clubImageTag)
    .replace(/\{\{clubImageUrl\}\}/g, escapeHtml(imageUrl))
    .replace(/\{\{joinLink\}\}/g, escapeHtml(joinLink))
    .replace(/\{\{unsubscribeUrl\}\}/g, unsubscribeUrl);
  if (!html.includes('</body>')) {
    html += unsubscribeFooter;
  } else {
    html = html.replace('</body>', `${unsubscribeFooter}</body>`);
  }
  if (!html.includes('<!DOCTYPE') && !html.includes('<html')) {
    html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:24px;color:#3d3329;background:#faf8f5;">${html}</body></html>`;
  }
  return html;
}

export type AnnounceResult = { sent: number; total: number };

/**
 * Sends a book club announcement email to all subscribers with status 'subscribed'.
 * Email includes club image (if logo set), name, description, and join link.
 * Uses same SMTP config as welcome emails (admin email-settings or env).
 * Returns { sent, total } for confirmation. Throws if SMTP is not configured.
 */
export async function sendBookClubAnnouncementEmail(club: BookClubPayload): Promise<AnnounceResult> {
  const settings = await getEmailSettings();
  if (!isSmtpConfigured(settings ?? null, config.smtp)) {
    throw new Error('SMTP is not configured. Set SMTP in .env or Admin → Subscriber emails.');
  }

  const subscribers = await Subscriber.find({ status: 'subscribed' }).select('email name').lean();
  if (subscribers.length === 0) return { sent: 0, total: 0 };

  const from = settings?.fromEmail?.trim() || settings?.smtpUser?.trim() || config.smtp.from;
  const subjectTemplate = settings?.bookClubAnnounceSubject?.trim();
  const subject = subjectTemplate
    ? subjectTemplate.replace(/\{\{clubName\}\}/g, club.name)
    : `New book club: ${club.name} — Chai & Chapter`;
  const bodyTemplate = settings?.bookClubAnnounceBodyHtml?.trim();
  const useAdminSmtp = Boolean(settings?.smtpUser?.trim() && settings?.smtpPass?.trim());
  const transporterOptions = useAdminSmtp
    ? {
        host: settings!.smtpHost?.trim() || config.smtp.host,
        port: settings!.smtpPort ?? config.smtp.port,
        secure: settings!.smtpSecure ?? config.smtp.secure,
        auth: { user: settings!.smtpUser!.trim(), pass: settings!.smtpPass! },
      }
    : {
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: { user: config.smtp.user, pass: config.smtp.pass },
      };

  const transporter = nodemailer.createTransport(transporterOptions);
  let sent = 0;
  const total = subscribers.filter((s) => (s.email || '').trim()).length;
  for (const sub of subscribers) {
    const to = (sub.email || '').trim();
    if (!to) continue;
    try {
      const html = bodyTemplate
        ? buildAnnouncementHtmlFromTemplate(bodyTemplate, club, to)
        : buildDefaultAnnouncementHtml(club, to);
      await transporter.sendMail({ from, to, subject, html });
      sent++;
    } catch (err) {
      console.error('Book club announcement send error for', to, err);
    }
  }
  return { sent, total };
}
