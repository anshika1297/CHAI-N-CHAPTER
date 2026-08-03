import { getApiBaseUrlForClient } from '@/lib/runtime';

export type NewsletterEvent = 'impression' | 'submit' | 'success';

/** Build subscribe `source` for subscriber attribution in admin. */
export function buildSubscribeSource(placement: string, slug?: string): string {
  const base = placement.trim();
  if (!slug?.trim()) return base;
  return `${base}:${slug.trim()}`;
}

/** Fire-and-forget newsletter funnel event (impression → submit → success). */
export function trackNewsletterEvent(event: NewsletterEvent, placement: string): void {
  if (typeof window === 'undefined') return;
  try {
    const base = getApiBaseUrlForClient();
    const url = `${base}/api/analytics/newsletter`;
    const body = JSON.stringify({ event, placement });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
      return;
    }
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}
