const GOODREADS_RE = /goodreads\.com/i;
const BUY_URL_RE =
  /amazon\.|amzn\.|flipkart\.|bookshop\.org|books\.google|penguinrandomhouse|harpercollins|simonandschuster|macmillan|audible\.|kobo\.|barnesandnoble/i;

const CHANNELS = ['amazon-in', 'amazon-uae', 'publisher', 'goodreads', 'flipkart', 'other'] as const;
export type ShopLinkChannel = (typeof CHANNELS)[number];

export type ShopPurchaseLink = { label: string; url: string; channel?: ShopLinkChannel };

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function record(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

export function legacyBuyLinkFromBookLink(bookLink: string): string | undefined {
  if (!bookLink || GOODREADS_RE.test(bookLink)) return undefined;
  if (BUY_URL_RE.test(bookLink)) return bookLink;
  return undefined;
}

export function parseShopLinksFromRaw(raw: unknown, legacyBuyLink?: string): ShopPurchaseLink[] {
  const out: ShopPurchaseLink[] = [];
  if (Array.isArray(raw)) {
    for (const item of raw) {
      const o = record(item);
      if (!o) continue;
      const label = str(o.label);
      const url = str(o.url);
      if (!label || !url) continue;
      const ch = str(o.channel);
      const row: ShopPurchaseLink = { label, url };
      if (CHANNELS.includes(ch as ShopLinkChannel)) row.channel = ch as ShopLinkChannel;
      out.push(row);
    }
  }
  const legacy = (legacyBuyLink ?? '').trim();
  if (legacy && !out.some((l) => l.url === legacy)) {
    out.push({ label: 'Buy', url: legacy, channel: 'other' });
  }
  return out;
}

export function parseShopBookMeta(raw: unknown): {
  title?: string;
  author?: string;
  genre?: string;
  coverImage?: string;
  isbn?: string;
  bookSlug?: string;
} {
  const o = record(raw);
  if (!o) return {};
  const bookSlug = str(o.bookSlug).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/(^-|-$)/g, '');
  return {
    title: str(o.title) || undefined,
    author: str(o.author) || undefined,
    genre: str(o.genre) || undefined,
    coverImage: str(o.coverImage) || undefined,
    isbn: str(o.isbn).replace(/[^\dXx-]/g, '') || undefined,
    bookSlug: bookSlug || undefined,
  };
}

export function readTags(raw: Record<string, unknown>): string[] {
  const tags = raw.tags ?? raw.seoKeywords;
  if (!Array.isArray(tags)) return [];
  return tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean);
}
