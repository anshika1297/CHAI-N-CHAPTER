import type { ShopBookMeta, ShopLinkChannel, ShopPurchaseLink } from './types';

const CHANNELS: ShopLinkChannel[] = ['amazon-in', 'amazon-uae', 'publisher', 'goodreads', 'flipkart', 'other'];

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

export function parseShopLinkChannel(raw: unknown): ShopLinkChannel | undefined {
  const c = str(raw);
  return CHANNELS.includes(c as ShopLinkChannel) ? (c as ShopLinkChannel) : undefined;
}

export function sanitizeShopLinksForSave(raw: ShopPurchaseLink[] | undefined): ShopPurchaseLink[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((l) => {
      const label = str(l?.label);
      const url = str(l?.url);
      const channel = parseShopLinkChannel(l?.channel);
      const row: ShopPurchaseLink = { label, url };
      if (channel) row.channel = channel;
      return row;
    })
    .filter((l) => l.label && l.url);
}

export function sanitizeShopBookMeta(raw: ShopBookMeta | undefined | null): ShopBookMeta | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const title = str(raw.title);
  const author = str(raw.author);
  const genre = str(raw.genre);
  const coverImage = str(raw.coverImage);
  const isbn = str(raw.isbn).replace(/[^\dXx-]/g, '');
  const bookSlug = str(raw.bookSlug).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/(^-|-$)/g, '');
  const out: ShopBookMeta = {};
  if (title) out.title = title;
  if (author) out.author = author;
  if (genre) out.genre = genre;
  if (coverImage) out.coverImage = coverImage;
  if (isbn) out.isbn = isbn;
  if (bookSlug) out.bookSlug = bookSlug;
  return Object.keys(out).length ? out : undefined;
}

export function parseShopBookMeta(raw: unknown): ShopBookMeta | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  return sanitizeShopBookMeta(raw as ShopBookMeta);
}

export function parseShopLinksFromRaw(raw: unknown, legacyBuyLink?: string): ShopPurchaseLink[] {
  const out: ShopPurchaseLink[] = [];
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (!item || typeof item !== 'object') continue;
      const o = item as Record<string, unknown>;
      const label = str(o.label);
      const url = str(o.url);
      if (!label || !url) continue;
      const channel = parseShopLinkChannel(o.channel);
      const row: ShopPurchaseLink = { label, url };
      if (channel) row.channel = channel;
      out.push(row);
    }
  }
  const legacy = (legacyBuyLink ?? '').trim();
  if (legacy && !out.some((l) => l.url === legacy)) {
    out.push({ label: 'Buy', url: legacy, channel: 'other' });
  }
  return out;
}
