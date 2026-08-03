import { Page } from '../models/Page.js';
import { config } from '../config/index.js';
import { getEmailSiteUrl } from '../utils/emailSiteUrl.js';
import {
  type EmailSmtpSettings,
  createSmtpTransporter,
  formatSmtpError,
  isSmtpConfigured,
  mergeEmailSmtpSettings,
  resolveFromAddress,
  verifySmtpConnection,
} from './smtpConfig.js';

type Club = { name: string; theme?: string; joinLink?: string };

function getClubsFromContent(content: Record<string, unknown> | null): Club[] {
  if (!content || typeof content !== 'object') return [];
  const pageClubs = content.pageClubs as unknown[] | undefined;
  const clubs = content.clubs as unknown[] | undefined;
  const raw = Array.isArray(pageClubs) ? pageClubs : Array.isArray(clubs) ? clubs : [];
  return raw
    .filter((x): x is Record<string, unknown> => x != null && typeof x === 'object' && typeof (x as { name?: unknown }).name === 'string')
    .map((x) => ({
      name: String(x.name).trim(),
      theme: typeof x.theme === 'string' ? x.theme.trim() : undefined,
      joinLink: typeof x.joinLink === 'string' && x.joinLink.trim() ? x.joinLink.trim() : undefined,
    }))
    .slice(0, 12);
}

function buildUnsubscribeUrl(siteUrl: string, email: string): string {
  return `${siteUrl}/subscribe/unsubscribe?email=${encodeURIComponent(email)}`;
}

function buildUnsubscribeFooter(siteUrl: string, email: string): string {
  const url = buildUnsubscribeUrl(siteUrl, email);
  return `<p style="margin:24px 0 0;font-size:14px;color:#8b7355;">You can <a href="${url}" style="color:#c4704a;">unsubscribe anytime</a> from our emails.</p>`;
}

function buildClubsBlock(clubs: Club[], siteUrl: string): string {
  if (clubs.length === 0) {
    return `<p style="margin:0 0 16px;color:#5c4d3d;">You can always explore our <a href="${siteUrl}/book-clubs" style="color:#c4704a;">book clubs page</a> to see what we offer.</p>`;
  }
  return `
  <p style="margin:0 0 12px;color:#5c4d3d;">Interested in joining a book club? Here are ours:</p>
  <ul style="margin:0 0 16px;padding-left:20px;color:#5c4d3d;">
    ${clubs
      .map(
        (c) =>
          `<li style="margin-bottom:6px;">${
            c.joinLink
              ? `<a href="${escapeHtml(c.joinLink)}" style="color:#c4704a;">${escapeHtml(c.name)}</a>`
              : `<a href="${siteUrl}/book-clubs" style="color:#c4704a;">${escapeHtml(c.name)}</a>`
          }${c.theme ? ` — ${escapeHtml(c.theme)}` : ''}</li>`
      )
      .join('')}
  </ul>
  <p style="margin:0 0 16px;"><a href="${siteUrl}/book-clubs" style="color:#c4704a;font-weight:600;">View all book clubs →</a></p>`;
}

function buildWelcomeHtml(subscriberName: string | undefined, clubs: Club[], siteUrl: string, subscriberEmail: string): string {
  const greeting = subscriberName ? `Hi ${escapeHtml(subscriberName)},` : 'Hi there,';
  const clubsList = buildClubsBlock(clubs, siteUrl);
  const unsubscribeFooter = buildUnsubscribeFooter(siteUrl, subscriberEmail);

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:24px;color:#3d3329;background:#faf8f5;">
  <p style="margin:0 0 16px;font-size:18px;">${greeting}</p>
  <p style="margin:0 0 16px;color:#5c4d3d;">Welcome to the reading list! You'll get book recommendations, blog updates, and reading lists straight to your inbox.</p>
  ${clubsList}
  ${unsubscribeFooter}
  <p style="margin:8px 0 0;font-size:14px;color:#8b7355;">— Chai & Chapter</p>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

type EmailSettings = EmailSmtpSettings & {
  subject?: string;
  bodyHtml?: string;
  signature?: string;
};

export async function getEmailSettings(): Promise<EmailSettings | null> {
  try {
    const page = await Page.findOne({ slug: 'email-settings' });
    if (!page?.content || typeof page.content !== 'object' || Array.isArray(page.content)) return null;
    const c = page.content as Record<string, unknown>;
    const port = c.smtpPort;
    return {
      fromEmail: typeof c.fromEmail === 'string' ? c.fromEmail.trim() : undefined,
      subject: typeof c.subject === 'string' ? c.subject.trim() : undefined,
      bodyHtml: typeof c.bodyHtml === 'string' ? c.bodyHtml : undefined,
      signature: typeof c.signature === 'string' ? c.signature : undefined,
      smtpHost: typeof c.smtpHost === 'string' ? c.smtpHost.trim() : undefined,
      smtpPort: typeof port === 'number' ? port : typeof port === 'string' ? parseInt(String(port), 10) : undefined,
      smtpSecure: c.smtpSecure === true || c.smtpSecure === 'true',
      smtpUser: typeof c.smtpUser === 'string' ? c.smtpUser.trim() : undefined,
      smtpPass: typeof c.smtpPass === 'string' ? c.smtpPass : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Sends a welcome email to the new subscriber.
 * Uses admin-configured email settings (from, subject, body, signature, and optionally SMTP) when set; otherwise env (SMTP_*).
 * No-op if neither admin SMTP nor env SMTP is configured.
 */
export async function sendWelcomeEmail(to: string, name?: string): Promise<void> {
  const settings = await getEmailSettings();
  if (!isSmtpConfigured(settings ?? null, config.smtp)) {
    return;
  }
  const siteUrl = getEmailSiteUrl();

  let clubs: Club[] = [];
  try {
    const page = await Page.findOne({ slug: 'book-clubs' });
    if (page?.content && typeof page.content === 'object' && !Array.isArray(page.content)) {
      clubs = getClubsFromContent(page.content as Record<string, unknown>);
    }
  } catch (err) {
    console.error('Welcome email: failed to load book clubs', err);
  }

  const from = resolveFromAddress(settings, config.smtp);
  const subject = settings?.subject?.trim() || 'Welcome to the reading list — Chapters.aur.Chai';

  const unsubscribeUrl = buildUnsubscribeUrl(siteUrl, to);
  const unsubscribeFooter = buildUnsubscribeFooter(siteUrl, to);

  let html: string;
  if (settings?.bodyHtml?.trim()) {
    const nameReplaced = settings.bodyHtml
      .replace(/\{\{name\}\}/g, name ? escapeHtml(name) : 'there')
      .replace(/\{\{bookClubs\}\}/g, buildClubsBlock(clubs, siteUrl))
      .replace(/\{\{unsubscribeUrl\}\}/g, unsubscribeUrl);
    const withSignature = settings.signature?.trim()
      ? nameReplaced + '\n' + settings.signature
      : nameReplaced;
    html = withSignature.includes('<!DOCTYPE') || withSignature.includes('<html')
      ? withSignature
      : `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:24px;color:#3d3329;background:#faf8f5;">${withSignature}</body></html>`;
    // Append unsubscribe footer so every email has an unsubscribe link (best practice)
    html = html.replace('</body>', `${unsubscribeFooter}</body>`);
  } else {
    html = buildWelcomeHtml(name, clubs, siteUrl, to);
    if (settings?.signature?.trim()) {
      html = html.replace('</body>', `${settings.signature}</body>`);
    }
  }

  try {
    const { transporter } = createSmtpTransporter(settings, config.smtp);
    await transporter.sendMail({
      from,
      to: to.trim(),
      subject,
      html,
    });
  } catch (err) {
    console.error('Welcome email send error', formatSmtpError(err));
  }
}

/**
 * Sends a simple test email to the given address. Uses the same SMTP config as welcome emails (env or admin).
 * No-op if SMTP is not configured. Throws on send failure so the caller can respond with an error.
 */
export async function sendTestEmail(
  to: string,
  overrides?: Partial<EmailSmtpSettings> | null
): Promise<{ from: string; host: string; port: number }> {
  const saved = await getEmailSettings();
  const settings = mergeEmailSmtpSettings(saved, overrides);
  if (!isSmtpConfigured(settings, config.smtp)) {
    throw new Error(
      'SMTP is not configured. Fill in SMTP host, user, and password in Admin → Subscriber emails, click Save, then try again.'
    );
  }

  await verifySmtpConnection(settings, config.smtp);
  const from = resolveFromAddress(settings, config.smtp);
  const { transporter, meta } = createSmtpTransporter(settings, config.smtp);

  try {
    await transporter.sendMail({
      from,
      to: to.trim(),
      subject: 'Test email — Chapters.aur.Chai',
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:24px;color:#3d3329;background:#faf8f5;">
  <p style="margin:0 0 16px;font-size:18px;">This is a test email.</p>
  <p style="margin:0 0 16px;color:#5c4d3d;">If you received this, subscriber emails from <strong>read@chaptersaurchai.com</strong> are working. Check spam/promotions if you do not see it in the inbox.</p>
  <p style="margin:8px 0 0;font-size:13px;color:#8b7355;">Sent via ${meta.host}:${meta.port} as ${from}</p>
  <p style="margin:24px 0 0;font-size:14px;color:#8b7355;">— Chapters.aur.Chai</p>
</body>
</html>`,
    });
  } catch (err) {
    throw new Error(formatSmtpError(err));
  }

  return { from, host: meta.host, port: meta.port };
}
