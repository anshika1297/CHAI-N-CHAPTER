import {
  getBlogPostBySlug,
  getMusingBySlug,
  getRecommendationBySlug,
  getImageUrl,
} from '@/lib/api';
import { siteConfig } from '@/lib/seo';

export type InternalContentKind = 'blog' | 'recommendations' | 'musings';

export interface InternalLinkPreview {
  href: string;
  kind: InternalContentKind;
  slug: string;
  title: string;
  description: string;
  image: string;
  category: string;
  readingTime?: number;
  siteLabel: string;
}

const KIND_LABELS: Record<InternalContentKind, string> = {
  blog: 'Book review',
  recommendations: 'Recommendations',
  musings: 'Her Musings Verse',
};

function recordFields(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
}

/** Parse /blog|recommendations|musings/slug from a path or full chaptersaurchai URL. */
export function parseInternalContentUrl(url: string): { kind: InternalContentKind; slug: string; href: string } | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  let pathname = trimmed;
  try {
    if (/^https?:\/\//i.test(trimmed)) {
      const u = new URL(trimmed);
      const host = u.hostname.replace(/^www\./, '');
      const siteHost = new URL(siteConfig.url).hostname.replace(/^www\./, '');
      if (host !== siteHost && host !== 'localhost' && host !== '127.0.0.1') {
        return null;
      }
      pathname = u.pathname;
    }
  } catch {
    return null;
  }

  const match = pathname.match(/^\/(blog|recommendations|musings)\/([^/?#]+)\/?$/i);
  if (!match) return null;

  const kind = match[1].toLowerCase() as InternalContentKind;
  const slug = decodeURIComponent(match[2]);
  if (!slug) return null;

  return { kind, slug, href: `/${kind}/${encodeURIComponent(slug)}` };
}

function previewFromPost(
  kind: InternalContentKind,
  href: string,
  slug: string,
  raw: Record<string, unknown>,
  fallbackTitle: string
): InternalLinkPreview {
  const title = String(raw.title ?? '').trim() || fallbackTitle;
  const excerpt = typeof raw.excerpt === 'string' ? raw.excerpt.trim() : '';
  const intro = typeof raw.intro === 'string' ? raw.intro.trim() : '';
  const description = excerpt || intro || '';
  const imageRaw = typeof raw.image === 'string' ? raw.image : '';
  const category = typeof raw.category === 'string' ? raw.category.trim() : KIND_LABELS[kind];
  const readingTime =
    typeof raw.readingTime === 'number' ? raw.readingTime : Number(raw.readingTime) || undefined;

  return {
    href,
    kind,
    slug,
    title,
    description,
    image: imageRaw ? getImageUrl(imageRaw) : '',
    category,
    readingTime: readingTime && readingTime > 0 ? readingTime : undefined,
    siteLabel: 'chaptersaurchai.com',
  };
}

/** Load OG-style preview data for an on-site content URL (blog / recommendations / musings). */
export async function fetchInternalLinkPreview(
  url: string,
  fallbackTitle = ''
): Promise<InternalLinkPreview | null> {
  const parsed = parseInternalContentUrl(url);
  if (!parsed) return null;

  try {
    if (parsed.kind === 'blog') {
      const { post } = await getBlogPostBySlug(parsed.slug);
      return previewFromPost(parsed.kind, parsed.href, parsed.slug, recordFields(post), fallbackTitle);
    }
    if (parsed.kind === 'recommendations') {
      const { item } = await getRecommendationBySlug(parsed.slug);
      return previewFromPost(parsed.kind, parsed.href, parsed.slug, recordFields(item), fallbackTitle);
    }
    const { item } = await getMusingBySlug(parsed.slug);
    return previewFromPost(parsed.kind, parsed.href, parsed.slug, recordFields(item), fallbackTitle);
  } catch {
    return null;
  }
}

export async function resolveBlogLinkPreviews(
  links: { title: string; url: string }[]
): Promise<(InternalLinkPreview | null)[]> {
  return Promise.all(
    links.map(async (link) => {
      if (!link.url?.trim()) return null;
      const preview = await fetchInternalLinkPreview(link.url, link.title?.trim() || '');
      if (preview) return preview;
      const parsed = parseInternalContentUrl(link.url);
      if (parsed && link.title?.trim()) {
        return {
          href: parsed.href,
          kind: parsed.kind,
          slug: parsed.slug,
          title: link.title.trim(),
          description: '',
          image: '',
          category: KIND_LABELS[parsed.kind],
          siteLabel: 'chaptersaurchai.com',
        };
      }
      return null;
    })
  );
}
