export type ContentUpdateReason = 'content' | 'publish';

export type ContentUpdateEntry = {
  at: string;
  reason: ContentUpdateReason;
};

export type ContentFreshnessFields = {
  updatedAt?: string;
  updateHistory?: ContentUpdateEntry[];
};

function parseDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'string' && value.trim()) {
    const d = new Date(value.trim());
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

export function readContentPublishedAt(raw: Record<string, unknown>): string | undefined {
  const published = parseDate(raw.publishedAt) ?? parseDate(raw.publishDate);
  return published ? published.toISOString() : undefined;
}

export function readContentUpdatedAt(raw: Record<string, unknown>): string | undefined {
  const updated = parseDate(raw.updatedAt);
  return updated ? updated.toISOString() : undefined;
}

export function readUpdateHistory(raw: Record<string, unknown>): ContentUpdateEntry[] {
  if (!Array.isArray(raw.updateHistory)) return [];
  return raw.updateHistory
    .filter((e): e is ContentUpdateEntry => {
      if (!e || typeof e !== 'object') return false;
      const entry = e as ContentUpdateEntry;
      return typeof entry.at === 'string' && Boolean(entry.at.trim());
    })
    .map((e) => ({
      at: e.at.trim(),
      reason: e.reason === 'publish' ? 'publish' : 'content',
    }));
}

/** Whether to show a distinct “Last updated” line (content was revised after publish). */
export function shouldShowLastUpdated(
  publishedAt?: string,
  updatedAt?: string,
  history?: ContentUpdateEntry[]
): boolean {
  if (!updatedAt) return false;
  if (history?.some((e) => e.reason === 'content')) return true;
  if (!publishedAt) return true;
  const p = parseDate(publishedAt);
  const u = parseDate(updatedAt);
  if (!u) return false;
  if (!p) return true;
  return u.getTime() > p.getTime();
}

export function formatPublishedDate(value?: string): string | null {
  const d = value ? parseDate(value) : null;
  if (!d) return null;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

/** “Last Updated: Month Year” */
export function formatLastUpdatedMonthYear(value?: string): string | null {
  const d = value ? parseDate(value) : null;
  if (!d) return null;
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/** ISO date for metadata modifiedTime (prefers updatedAt). */
export function contentModifiedTime(raw: Record<string, unknown>): string | undefined {
  return readContentUpdatedAt(raw);
}
