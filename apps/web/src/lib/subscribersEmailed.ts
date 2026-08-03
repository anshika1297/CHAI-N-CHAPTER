/** Track one-time subscriber announcement per content item. */

export type SubscribersEmailedFields = {
  subscribersEmailedAt?: string;
};

export function hasSubscribersBeenEmailed(item: SubscribersEmailedFields): boolean {
  return Boolean(item.subscribersEmailedAt?.trim());
}

export function readSubscribersEmailedAt(raw: unknown): string | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const v = (raw as Record<string, unknown>).subscribersEmailedAt;
  if (v instanceof Date) return v.toISOString();
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

export function subscribersEmailedSaveField(at?: string): { subscribersEmailedAt?: string } {
  const v = at?.trim();
  return v ? { subscribersEmailedAt: v } : {};
}
