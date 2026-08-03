import {
  formatLastUpdatedMonthYear,
  formatPublishedDate,
  readContentPublishedAt,
  readContentUpdatedAt,
  readUpdateHistory,
  shouldShowLastUpdated,
} from '@/lib/contentFreshness';

type Props = {
  raw: Record<string, unknown>;
  className?: string;
  /** When false, only the published date is shown (no “Last updated”). */
  showLastUpdated?: boolean;
};

/** Published date + optional “Last updated: Month Year” for editorial content. */
export default function ContentFreshnessDates({ raw, className = '', showLastUpdated = true }: Props) {
  const publishedAt = readContentPublishedAt(raw);
  const updatedAt = readContentUpdatedAt(raw);
  const history = readUpdateHistory(raw);
  const publishedLabel = formatPublishedDate(publishedAt);
  const updatedLabel = formatLastUpdatedMonthYear(updatedAt);
  const showUpdated = showLastUpdated && shouldShowLastUpdated(publishedAt, updatedAt, history);

  if (!publishedLabel && !showUpdated) return null;

  return (
    <div className={`font-sans text-xs text-chai-brown-light ${className}`}>
      {publishedLabel ? (
        <time dateTime={publishedAt} className="block sm:inline">
          Published {publishedLabel}
        </time>
      ) : null}
      {showUpdated && updatedLabel ? (
        <span className={publishedLabel ? 'block sm:inline sm:before:content-["·"] sm:before:mx-2' : ''}>
          <time dateTime={updatedAt} className="text-chai-brown/80">
            Last updated {updatedLabel}
          </time>
        </span>
      ) : null}
    </div>
  );
}
