import nodemailer from 'nodemailer';
import { Page } from '../models/Page.js';
import { config } from '../config/index.js';

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

function buildWelcomeHtml(subscriberName: string | undefined, clubs: Club[], siteUrl: string): string {
  const greeting = subscriberName ? `Hi ${escapeHtml(subscriberName)},` : 'Hi there,';
  const clubsList =
    clubs.length === 0
      ? `<p style="margin:0 0 16px;color:#5c4d3d;">You can always explore our <a href="${siteUrl}/book-clubs" style="color:#c4704a;">book clubs page</a> to see what we offer.</p>`
      : `
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

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:24px;color:#3d3329;background:#faf8f5;">
  <p style="margin:0 0 16px;font-size:18px;">${greeting}</p>
  <p style="margin:0 0 16px;color:#5c4d3d;">Welcome to the reading list! You'll get book recommendations, blog updates, and reading lists straight to your inbox.</p>
  ${clubsList}
  <p style="margin:24px 0 0;font-size:14px;color:#8b7355;">You can unsubscribe anytime from the link in our emails.</p>
  <p style="margin:8px 0 0;font-size:14px;color:#8b7355;">— Chapters.aur.Chai</p>
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

function isSmtpConfigured(): boolean {
  const { host, user, pass } = config.smtp;
  return Boolean(host?.trim() && user?.trim() && pass?.trim());
}

/**
 * Sends a welcome email to the new subscriber with a list of book clubs.
 * Uses Nodemailer with SMTP. No-op if SMTP host/user/pass are not set.
 */
export async function sendWelcomeEmail(to: string, name?: string): Promise<void> {
  if (!isSmtpConfigured()) {
    return;
  }
  const siteUrl = config.frontendUrl.replace(/\/$/, '');

  let clubs: Club[] = [];
  try {
    const page = await Page.findOne({ slug: 'book-clubs' });
    if (page?.content && typeof page.content === 'object' && !Array.isArray(page.content)) {
      clubs = getClubsFromContent(page.content as Record<string, unknown>);
    }
  } catch (err) {
    console.error('Welcome email: failed to load book clubs', err);
  }

  const html = buildWelcomeHtml(name, clubs, siteUrl);
  try {
    const transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
    await transporter.sendMail({
      from: config.smtp.from,
      to: to.trim(),
      subject: 'Welcome to the reading list — Chapters.aur.Chai',
      html,
    });
  } catch (err) {
    console.error('Welcome email send error', err);
  }
}
