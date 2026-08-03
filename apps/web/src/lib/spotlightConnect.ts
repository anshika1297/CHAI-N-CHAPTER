import type { AuthorSpotlightDto } from '@/lib/api';

export type AuthorConnectKey =
  | 'website'
  | 'goodreads'
  | 'amazonAuthor'
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'newsletter'
  | 'publisher';

export type ResolvedConnectLink = {
  key: AuthorConnectKey | 'other';
  label: string;
  url: string;
  /** Official author website — use dofollow (no noreferrer). */
  dofollow?: boolean;
};

export const CONNECT_FIELD_META: { key: AuthorConnectKey; label: string }[] = [
  { key: 'website', label: 'Official Website' },
  { key: 'goodreads', label: 'Goodreads' },
  { key: 'amazonAuthor', label: 'Amazon Author Page' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'newsletter', label: 'Newsletter' },
  { key: 'publisher', label: 'Publisher Page' },
];

const LEGACY_LABEL_MAP: Record<string, AuthorConnectKey> = {
  website: 'website',
  'official website': 'website',
  goodreads: 'goodreads',
  amazon: 'amazonAuthor',
  'amazon author': 'amazonAuthor',
  instagram: 'instagram',
  facebook: 'facebook',
  linkedin: 'linkedin',
  newsletter: 'newsletter',
  publisher: 'publisher',
};

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

/** Merge structured connectLinks + legacy free-form socialLinks. */
export function resolveAuthorConnectLinks(spotlight: AuthorSpotlightDto): ResolvedConnectLink[] {
  const seen = new Set<string>();
  const out: ResolvedConnectLink[] = [];

  const push = (link: ResolvedConnectLink) => {
    const key = link.url.toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push(link);
  };

  const connect = spotlight.connectLinks ?? {};
  for (const { key, label } of CONNECT_FIELD_META) {
    const url = str((connect as Record<string, unknown>)[key]);
    if (url) {
      push({
        key,
        label,
        url,
        dofollow: key === 'website',
      });
    }
  }

  for (const row of spotlight.socialLinks ?? []) {
    const url = str(row.url);
    if (!url) continue;
    const labelKey = str(row.label).toLowerCase();
    const mapped = LEGACY_LABEL_MAP[labelKey];
    if (mapped && str((connect as Record<string, unknown>)[mapped])) continue;
    push({
      key: mapped ?? 'other',
      label: str(row.label) || url,
      url,
      dofollow: mapped === 'website',
    });
  }

  return out;
}

export function connectLinksForSchema(spotlight: AuthorSpotlightDto): string[] {
  return resolveAuthorConnectLinks(spotlight).map((l) => l.url);
}

export function officialWebsiteUrl(spotlight: AuthorSpotlightDto): string | undefined {
  const website = str(spotlight.connectLinks?.website);
  if (website) return website;
  const legacy = (spotlight.socialLinks ?? []).find((l) =>
    LEGACY_LABEL_MAP[str(l.label).toLowerCase()] === 'website'
  );
  return legacy?.url?.trim() || undefined;
}
