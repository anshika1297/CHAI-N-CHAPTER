/** Shared helpers for subscriber announcement emails (auto on first publish). */

import { isContentPublished } from './contentPublish';
import { hasSubscribersBeenEmailed, type SubscribersEmailedFields } from './subscribersEmailed';

export type AnnounceResponse = { sent: number; total: number; message?: string };

export function isFirstPublish<T extends SubscribersEmailedFields & { isPublished?: boolean }>(
  before: T,
  after: T
): boolean {
  return !isContentPublished(before) && isContentPublished(after) && !hasSubscribersBeenEmailed(before);
}

/** Auto-send once when content goes live for the first time. Returns feedback text or null. */
export async function tryAutoAnnounceOnFirstPublish<
  T extends SubscribersEmailedFields & { isPublished?: boolean },
>(
  before: T,
  after: T,
  announce: () => Promise<AnnounceResponse>
): Promise<string | null> {
  if (!isFirstPublish(before, after)) return null;
  try {
    const result = await announce();
    return formatAnnounceFeedback(result).text;
  } catch (e) {
    return `Subscriber email failed: ${e instanceof Error ? e.message : 'unknown'}`;
  }
}

/** For items without publish state (e.g. new book clubs). */
export async function tryAutoAnnounceOnce<T extends SubscribersEmailedFields>(
  item: T,
  announce: () => Promise<AnnounceResponse>
): Promise<string | null> {
  if (hasSubscribersBeenEmailed(item)) return null;
  try {
    const result = await announce();
    return formatAnnounceFeedback(result).text;
  } catch (e) {
    return `Subscriber email failed: ${e instanceof Error ? e.message : 'unknown'}`;
  }
}

export function formatAnnounceFeedback(result: AnnounceResponse): { type: 'success' | 'error'; text: string } {
  if (result.message) return { type: 'success', text: result.message };
  const { sent, total } = result;
  if (total === 0) {
    return { type: 'success', text: 'No subscribers to send to. Add subscribers first (Subscribe page).' };
  }
  if (sent === total) {
    return { type: 'success', text: `Announcement sent to ${sent} subscriber${sent === 1 ? '' : 's'}.` };
  }
  return {
    type: 'success',
    text: `Sent to ${sent} of ${total} subscribers. ${total - sent} failed (check server logs).`,
  };
}

export async function confirmAndAnnounce(
  label: string,
  announce: () => Promise<AnnounceResponse>
): Promise<{ type: 'success' | 'error'; text: string } | null> {
  if (!confirm(`Send an email to all subscribers about "${label}"?`)) return null;
  try {
    const result = await announce();
    return formatAnnounceFeedback(result);
  } catch (e) {
    return { type: 'error', text: e instanceof Error ? e.message : 'Failed to send announcement' };
  }
}
