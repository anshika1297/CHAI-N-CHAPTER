export type SubscriberSession = {
  commentToken: string;
  name: string;
  email: string;
};

const STORAGE_KEY = 'cnc_subscriber_comment_session';

export function getSubscriberSession(): SubscriberSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<SubscriberSession>;
    if (
      typeof data.commentToken === 'string' &&
      data.commentToken &&
      typeof data.name === 'string' &&
      typeof data.email === 'string'
    ) {
      return {
        commentToken: data.commentToken,
        name: data.name,
        email: data.email,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function saveSubscriberSession(session: SubscriberSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSubscriberSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/** Persist comment session returned after subscribe (if present). */
export function saveSubscriberSessionFromSubscribe(result: {
  commentToken?: string;
  subscriberName?: string;
  email?: string;
}, fallbackEmail: string): void {
  if (!result.commentToken) return;
  saveSubscriberSession({
    commentToken: result.commentToken,
    name: result.subscriberName?.trim() || fallbackEmail.split('@')[0] || 'Subscriber',
    email: (result.email ?? fallbackEmail).trim().toLowerCase(),
  });
}
