/** Audit trail entry when publishable content changes. */
export type ContentUpdateReason = 'content' | 'publish';

export type ContentUpdateEntry = {
  /** ISO-8601 timestamp */
  at: string;
  reason: ContentUpdateReason;
};

/** Freshness fields stored on Page JSON items and AuthorSpotlight documents. */
export type ContentFreshnessFields = {
  updatedAt?: string;
  updateHistory?: ContentUpdateEntry[];
};

export const UPDATE_HISTORY_MAX = 50;
