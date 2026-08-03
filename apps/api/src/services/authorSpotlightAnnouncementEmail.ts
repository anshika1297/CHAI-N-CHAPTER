import type { IAuthorSpotlight } from '../models/AuthorSpotlight.js';
import { getEmailSiteUrl, toAbsoluteEmailImageUrl } from '../utils/emailSiteUrl.js';
import { sendToSubscribers, type AnnounceResult } from './subscriberEmail.js';

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

function buildHtml(spotlight: IAuthorSpotlight, subscriberEmail: string): string {
  const siteUrl = getEmailSiteUrl();
  const link = `${siteUrl}/author-spotlight/${encodeURIComponent(spotlight.slug)}`;
  const name = spotlight.name?.trim() || 'Author';
  const tagline = spotlight.tagline?.trim() || '';
  const imageUrl = toAbsoluteEmailImageUrl(spotlight.profileImage || spotlight.ogImage);
  const imgBlock = imageUrl
    ? `<p style="margin:0 0 16px;"><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(name)}" width="560" style="max-width:100%;height:auto;border-radius:8px;display:block;" /></p>`
    : '';
  const unsubscribeFooter = buildUnsubscribeFooter(siteUrl, subscriberEmail);

  return `
  <p style="margin:0 0 16px;font-size:18px;">Hi there,</p>
  <p style="margin:0 0 16px;color:#5c4d3d;">A new Author Spotlight is live on Chapters.aur.Chai:</p>
  ${imgBlock}
  <h2 style="margin:0 0 8px;font-size:22px;color:#3d3329;">${escapeHtml(name)}</h2>
  ${tagline ? `<p style="margin:0 0 16px;color:#5c4d3d;font-style:italic;">${escapeHtml(tagline)}</p>` : ''}
  <p style="margin:0 0 24px;"><a href="${escapeHtml(link)}" style="display:inline-block;background:#c4704a;color:#fff;padding:12px 20px;text-decoration:none;border-radius:8px;font-weight:600;">Read the spotlight</a></p>
  ${unsubscribeFooter}
  <p style="margin:8px 0 0;font-size:14px;color:#8b7355;">— Chapters.aur.Chai</p>`;
}

export async function sendAuthorSpotlightAnnouncementEmail(spotlight: IAuthorSpotlight): Promise<AnnounceResult> {
  const name = spotlight.name?.trim() || 'Author';
  const subject = `New Author Spotlight: ${name} — Chapters.aur.Chai`;
  return sendToSubscribers(subject, (email) => buildHtml(spotlight, email));
}
