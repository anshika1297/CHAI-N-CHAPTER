import nodemailer from 'nodemailer';
import { Page } from '../models/Page.js';
import { Subscriber } from '../models/Subscriber.js';
import { config } from '../config/index.js';

type ContentItem = Record<string, unknown>;

function getStr(o: unknown, key: string): string {
  const v = o && typeof o === 'object' && key in o ? (o as Record<string, unknown>)[key] : undefined;
  return typeof v === 'string' ? v : '';
}

type EmailSettings = {
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

function toAbsoluteImageUrl(img: string | undefined): string {
  if (!img || !String(img).trim()) return '';
  const trimmed = String(img).trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  const base = config.publicSiteUrl.replace(/\/$/, '');
  return trimmed.startsWith('/') ? base + trimmed : base + '/' + trimmed;
}

function wrapBody(html: string): string {
  if (html.includes('<!DOCTYPE') || html.includes('<html')) return html;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:24px;color:#3d3329;background:#faf8f5;">${html}</body></html>`;
}

export type AnnounceResult = { sent: number; total: number };

async function sendToSubscribers(
  subject: string,
  buildHtml: (subscriberEmail: string) => string
): Promise<AnnounceResult> {
  const settings = await getEmailSettings();
  if (!isSmtpConfigured(settings ?? null, config.smtp)) {
    throw new Error('SMTP is not configured. Set SMTP in .env or Admin → Subscriber emails.');
  }
  const subscribers = await Subscriber.find({ status: 'subscribed' }).select('email').lean();
  const total = subscribers.filter((s) => (s.email || '').trim()).length;
  if (total === 0) return { sent: 0, total: 0 };

  const from = settings?.fromEmail?.trim() || settings?.smtpUser?.trim() || config.smtp.from;
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
  for (const sub of subscribers) {
    const to = (sub.email || '').trim();
    if (!to) continue;
    try {
      const html = wrapBody(buildHtml(to));
      await transporter.sendMail({ from, to, subject, html });
      sent++;
    } catch (err) {
      console.error('Content announcement send error for', to, err);
    }
  }
  return { sent, total };
}

// —— Blog (Book review) ——

function buildBlogHtml(post: ContentItem, subscriberEmail: string, bodyTemplate: string | undefined): string {
  const siteUrl = config.publicSiteUrl.replace(/\/$/, '');
  const slug = getStr(post, 'slug') || getStr(post, 'title');
  const link = `${siteUrl}/blog/${encodeURIComponent(slug)}`;
  const title = getStr(post, 'title');
  const excerpt = getStr(post, 'excerpt');
  const imageUrl = toAbsoluteImageUrl(getStr(post, 'image') || (post.image as string | undefined));
  const author = getStr(post, 'author');
  const bookTitle = getStr(post, 'bookTitle');
  const unsubscribeFooter = buildUnsubscribeFooter(siteUrl, subscriberEmail);
  const imageTag = imageUrl
    ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(title)}" width="560" style="max-width:100%;height:auto;border-radius:8px;display:block;" />`
    : '';

  if (bodyTemplate) {
    let html = bodyTemplate
      .replace(/\{\{title\}\}/g, escapeHtml(title))
      .replace(/\{\{excerpt\}\}/g, escapeHtml(excerpt))
      .replace(/\{\{link\}\}/g, escapeHtml(link))
      .replace(/\{\{image\}\}/g, imageTag)
      .replace(/\{\{imageUrl\}\}/g, escapeHtml(imageUrl))
      .replace(/\{\{author\}\}/g, escapeHtml(author))
      .replace(/\{\{bookTitle\}\}/g, escapeHtml(bookTitle))
      .replace(/\{\{unsubscribeUrl\}\}/g, `${siteUrl}/subscribe/unsubscribe?email=${encodeURIComponent(subscriberEmail)}`);
    if (!html.includes('</body>')) html += unsubscribeFooter;
    else html = html.replace('</body>', `${unsubscribeFooter}</body>`);
    return html;
  }

  const imgBlock = imageUrl ? `<p style="margin:0 0 16px;">${imageTag}</p>` : '';
  return `
  <p style="margin:0 0 16px;font-size:18px;">Hi there,</p>
  <p style="margin:0 0 16px;color:#5c4d3d;">A new book review is live:</p>
  ${imgBlock}
  <h2 style="margin:0 0 12px;font-size:22px;color:#3d3329;">${escapeHtml(title)}</h2>
  <p style="margin:0 0 16px;color:#5c4d3d;line-height:1.5;">${escapeHtml(excerpt)}</p>
  <p style="margin:0 0 24px;"><a href="${escapeHtml(link)}" style="display:inline-block;background:#c4704a;color:#fff;padding:12px 20px;text-decoration:none;border-radius:8px;font-weight:600;">Read the review</a></p>
  ${unsubscribeFooter}
  <p style="margin:8px 0 0;font-size:14px;color:#8b7355;">— Chai & Chapter</p>`;
}

export async function sendBlogAnnouncementEmail(post: ContentItem): Promise<AnnounceResult> {
  const settings = await getEmailSettings();
  const subjectTemplate = settings?.blogAnnounceSubject?.trim();
  const title = getStr(post, 'title');
  const subject = subjectTemplate ? subjectTemplate.replace(/\{\{title\}\}/g, title) : `New book review: ${title} — Chai & Chapter`;
  const bodyTemplate = settings?.blogAnnounceBodyHtml?.trim();
  return sendToSubscribers(subject, (email) => buildBlogHtml(post, email, bodyTemplate));
}

// —— Recommendation ——

function buildRecommendationHtml(item: ContentItem, subscriberEmail: string, bodyTemplate: string | undefined): string {
  const siteUrl = config.publicSiteUrl.replace(/\/$/, '');
  const slug = getStr(item, 'slug') || getStr(item, 'title');
  const link = `${siteUrl}/recommendations/${encodeURIComponent(slug)}`;
  const title = getStr(item, 'title');
  const excerpt = getStr(item, 'excerpt');
  const imageUrl = toAbsoluteImageUrl(getStr(item, 'image') || (item.image as string | undefined));
  const author = getStr(item, 'author');
  const unsubscribeFooter = buildUnsubscribeFooter(siteUrl, subscriberEmail);
  const imageTag = imageUrl
    ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(title)}" width="560" style="max-width:100%;height:auto;border-radius:8px;display:block;" />`
    : '';

  if (bodyTemplate) {
    let html = bodyTemplate
      .replace(/\{\{title\}\}/g, escapeHtml(title))
      .replace(/\{\{excerpt\}\}/g, escapeHtml(excerpt))
      .replace(/\{\{link\}\}/g, escapeHtml(link))
      .replace(/\{\{image\}\}/g, imageTag)
      .replace(/\{\{imageUrl\}\}/g, escapeHtml(imageUrl))
      .replace(/\{\{author\}\}/g, escapeHtml(author))
      .replace(/\{\{unsubscribeUrl\}\}/g, `${siteUrl}/subscribe/unsubscribe?email=${encodeURIComponent(subscriberEmail)}`);
    if (!html.includes('</body>')) html += unsubscribeFooter;
    else html = html.replace('</body>', `${unsubscribeFooter}</body>`);
    return html;
  }

  const imgBlock = imageUrl ? `<p style="margin:0 0 16px;">${imageTag}</p>` : '';
  return `
  <p style="margin:0 0 16px;font-size:18px;">Hi there,</p>
  <p style="margin:0 0 16px;color:#5c4d3d;">A new book recommendation list is live:</p>
  ${imgBlock}
  <h2 style="margin:0 0 12px;font-size:22px;color:#3d3329;">${escapeHtml(title)}</h2>
  <p style="margin:0 0 16px;color:#5c4d3d;line-height:1.5;">${escapeHtml(excerpt)}</p>
  <p style="margin:0 0 24px;"><a href="${escapeHtml(link)}" style="display:inline-block;background:#c4704a;color:#fff;padding:12px 20px;text-decoration:none;border-radius:8px;font-weight:600;">Read the list</a></p>
  ${unsubscribeFooter}
  <p style="margin:8px 0 0;font-size:14px;color:#8b7355;">— Chai & Chapter</p>`;
}

export async function sendRecommendationAnnouncementEmail(item: ContentItem): Promise<AnnounceResult> {
  const settings = await getEmailSettings();
  const subjectTemplate = settings?.recommendationAnnounceSubject?.trim();
  const title = getStr(item, 'title');
  const subject = subjectTemplate ? subjectTemplate.replace(/\{\{title\}\}/g, title) : `New book recommendation: ${title} — Chai & Chapter`;
  const bodyTemplate = settings?.recommendationAnnounceBodyHtml?.trim();
  return sendToSubscribers(subject, (email) => buildRecommendationHtml(item, email, bodyTemplate));
}

// —— Musings (Her Musings Verse) ——

function buildMusingsHtml(item: ContentItem, subscriberEmail: string, bodyTemplate: string | undefined): string {
  const siteUrl = config.publicSiteUrl.replace(/\/$/, '');
  const slug = getStr(item, 'slug') || getStr(item, 'title');
  const link = `${siteUrl}/musings/${encodeURIComponent(slug)}`;
  const title = getStr(item, 'title');
  const excerpt = getStr(item, 'excerpt');
  const imageUrl = toAbsoluteImageUrl(getStr(item, 'image') || (item.image as string | undefined));
  const author = getStr(item, 'author');
  const unsubscribeFooter = buildUnsubscribeFooter(siteUrl, subscriberEmail);
  const imageTag = imageUrl
    ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(title)}" width="560" style="max-width:100%;height:auto;border-radius:8px;display:block;" />`
    : '';

  if (bodyTemplate) {
    let html = bodyTemplate
      .replace(/\{\{title\}\}/g, escapeHtml(title))
      .replace(/\{\{excerpt\}\}/g, escapeHtml(excerpt))
      .replace(/\{\{link\}\}/g, escapeHtml(link))
      .replace(/\{\{image\}\}/g, imageTag)
      .replace(/\{\{imageUrl\}\}/g, escapeHtml(imageUrl))
      .replace(/\{\{author\}\}/g, escapeHtml(author))
      .replace(/\{\{unsubscribeUrl\}\}/g, `${siteUrl}/subscribe/unsubscribe?email=${encodeURIComponent(subscriberEmail)}`);
    if (!html.includes('</body>')) html += unsubscribeFooter;
    else html = html.replace('</body>', `${unsubscribeFooter}</body>`);
    return html;
  }

  const imgBlock = imageUrl ? `<p style="margin:0 0 16px;">${imageTag}</p>` : '';
  return `
  <p style="margin:0 0 16px;font-size:18px;">Hi there,</p>
  <p style="margin:0 0 16px;color:#5c4d3d;">A new Her Musings Verse piece is live:</p>
  ${imgBlock}
  <h2 style="margin:0 0 12px;font-size:22px;color:#3d3329;">${escapeHtml(title)}</h2>
  <p style="margin:0 0 16px;color:#5c4d3d;line-height:1.5;">${escapeHtml(excerpt)}</p>
  <p style="margin:0 0 24px;"><a href="${escapeHtml(link)}" style="display:inline-block;background:#c4704a;color:#fff;padding:12px 20px;text-decoration:none;border-radius:8px;font-weight:600;">Read more</a></p>
  ${unsubscribeFooter}
  <p style="margin:8px 0 0;font-size:14px;color:#8b7355;">— Chai & Chapter</p>`;
}

export async function sendMusingsAnnouncementEmail(item: ContentItem): Promise<AnnounceResult> {
  const settings = await getEmailSettings();
  const subjectTemplate = settings?.musingsAnnounceSubject?.trim();
  const title = getStr(item, 'title');
  const subject = subjectTemplate ? subjectTemplate.replace(/\{\{title\}\}/g, title) : `New musing: ${title} — Chai & Chapter`;
  const bodyTemplate = settings?.musingsAnnounceBodyHtml?.trim();
  return sendToSubscribers(subject, (email) => buildMusingsHtml(item, email, bodyTemplate));
}
