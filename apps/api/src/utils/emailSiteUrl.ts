import { config } from '../config/index.js';

/** Base URL for article links, unsubscribe, and relative image paths in subscriber emails. */
export function getEmailSiteUrl(): string {
  return config.publicSiteUrl.replace(/\/$/, '');
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

/** Absolute image URL for email HTML; rewrites localhost dev URLs to the public site. */
export function toAbsoluteEmailImageUrl(img: string | undefined): string {
  if (!img || !String(img).trim()) return '';
  const trimmed = String(img).trim();
  const base = getEmailSiteUrl();

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const u = new URL(trimmed);
      if (LOCAL_HOSTS.has(u.hostname)) {
        return `${base}${u.pathname}${u.search}${u.hash}`;
      }
    } catch {
      /* use as-is */
    }
    return trimmed;
  }

  return trimmed.startsWith('/') ? base + trimmed : `${base}/${trimmed}`;
}
