const GOODREADS_RE = /goodreads\.com/i;
const BUY_URL_RE =
  /amazon\.|amzn\.|flipkart\.|bookshop\.org|books\.google|penguinrandomhouse|harpercollins|simonandschuster|macmillan|audible\.|kobo\.|barnesandnoble/i;

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function record(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function legacyBuyLinkFromBookLink(bookLink: string): string | undefined {
  if (!bookLink || GOODREADS_RE.test(bookLink)) return undefined;
  if (BUY_URL_RE.test(bookLink)) return bookLink;
  return undefined;
}

function normalizeShopLinks(raw: unknown, legacyBuyLink?: string): boolean {
  if (Array.isArray(raw)) {
    for (const item of raw) {
      const o = record(item);
      if (o && str(o.label) && str(o.url)) return true;
    }
  }
  const legacy = (legacyBuyLink ?? '').trim();
  return Boolean(legacy);
}

/** True when a review has explicit shop links or a legacy retailer URL in bookLink/buyLink. */
export function reviewHasShopLinks(raw: Record<string, unknown>): boolean {
  const explicitBuy = str(raw.buyLink);
  const legacyBuy = explicitBuy || legacyBuyLinkFromBookLink(str(raw.bookLink)) || '';
  return normalizeShopLinks(raw.shopLinks, legacyBuy);
}

export function arrayHasShopLinks(raw: unknown): boolean {
  if (!Array.isArray(raw)) return false;
  return raw.some((item) => {
    const o = record(item);
    return o && str(o.label) && str(o.url);
  });
}

/** Recommendation list book — shopLinks or legacy Amazon in bookLink/buyLink. */
export function listBookHasShopLinks(book: Record<string, unknown>): boolean {
  const explicitBuy = str(book.buyLink);
  const legacyBuy = explicitBuy || legacyBuyLinkFromBookLink(str(book.bookLink)) || '';
  return normalizeShopLinks(book.shopLinks, legacyBuy);
}
