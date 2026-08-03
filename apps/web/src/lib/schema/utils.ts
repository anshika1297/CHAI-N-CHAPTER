import { canonicalUrl, ogImageUrl } from '@/lib/seo';

/** Remove undefined/null keys so Google receives clean JSON-LD. */
export function compact(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...obj };
  for (const key of Object.keys(out)) {
    const v = out[key];
    if (v === undefined || v === null || v === '') {
      delete out[key];
    } else if (Array.isArray(v)) {
      const filtered = v.filter((x) => x !== undefined && x !== null && x !== '');
      if (filtered.length) out[key] = filtered;
      else delete out[key];
    } else if (typeof v === 'object') {
      const nested = compact(v as Record<string, unknown>);
      if (Object.keys(nested).length) out[key] = nested;
      else delete out[key];
    }
  }
  return out;
}

export function absImage(path?: string): string | undefined {
  if (!path?.trim()) return undefined;
  return ogImageUrl(path.startsWith('http') ? path : path);
}

export function pageUrl(path: string): string {
  return canonicalUrl(path);
}

export const SCHEMA_CONTEXT = 'https://schema.org';
