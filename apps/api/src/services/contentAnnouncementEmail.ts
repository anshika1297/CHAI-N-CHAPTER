import { getEmailSiteUrl, toAbsoluteEmailImageUrl } from '../utils/emailSiteUrl.js';
import { getSubscriberEmailSettings, sendToSubscribers, type AnnounceResult } from './subscriberEmail.js';

export type { AnnounceResult };

type ContentItem = Record<string, unknown>;

function getStr(o: unknown, key: string): string {
  const v = o && typeof o === 'object' && key in o ? (o as Record<string, unknown>)[key] : undefined;
  return typeof v === 'string' ? v : '';
}

async function getEmailSettings() {
  return getSubscriberEmailSettings();
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

// —— Blog (Book review) ——

function buildBlogHtml(post: ContentItem, subscriberEmail: string, bodyTemplate: string | undefined): string {
  const siteUrl = getEmailSiteUrl();
  const slug = getStr(post, 'slug') || getStr(post, 'title');
  const link = `${siteUrl}/blog/${encodeURIComponent(slug)}`;
  const title = getStr(post, 'title');
  const excerpt = getStr(post, 'excerpt');
  const imageUrl = toAbsoluteEmailImageUrl(getStr(post, 'image') || (post.image as string | undefined));
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
  const siteUrl = getEmailSiteUrl();
  const slug = getStr(item, 'slug') || getStr(item, 'title');
  const link = `${siteUrl}/recommendations/${encodeURIComponent(slug)}`;
  const title = getStr(item, 'title');
  const excerpt = getStr(item, 'excerpt');
  const imageUrl = toAbsoluteEmailImageUrl(getStr(item, 'image') || (item.image as string | undefined));
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
  const siteUrl = getEmailSiteUrl();
  const slug = getStr(item, 'slug') || getStr(item, 'title');
  const link = `${siteUrl}/musings/${encodeURIComponent(slug)}`;
  const title = getStr(item, 'title');
  const excerpt = getStr(item, 'excerpt');
  const imageUrl = toAbsoluteEmailImageUrl(getStr(item, 'image') || (item.image as string | undefined));
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
