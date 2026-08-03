/**
 * @deprecated Use resolveContentItemMetadata from '@/lib/metadata' directly.
 * Kept for backward compatibility during migration.
 */
import { resolveContentItemMetadata } from '@/lib/metadata/content';
import type { ContentKind } from '@/lib/metadata/types';
import type { MetadataParams } from '@/lib/seo';

export type ContentMetadataInput = {
  raw: Record<string, unknown>;
  path: string;
  type: 'article' | 'profile';
  fallbackTitle: string;
  fallbackDescription: string;
  baseKeywords: string[];
  fallbackImage?: string;
  fallbackAuthor?: string;
};

function pathToKind(path: string): ContentKind {
  if (path.startsWith('/recommendations/')) return 'recommendation';
  if (path.startsWith('/musings/')) return 'musing';
  if (path.startsWith('/author-spotlight/')) return 'author-spotlight';
  return 'review';
}

function slugFromPath(path: string): string {
  return path.split('/').filter(Boolean).pop() ?? '';
}

/** @deprecated Use resolveContentItemMetadata */
export function contentItemToMetadataParams(input: ContentMetadataInput): MetadataParams {
  const kind = pathToKind(input.path);
  const slug = slugFromPath(input.path);
  return resolveContentItemMetadata({
    kind,
    slug,
    raw: input.raw,
    staticFallback: {
      title: input.fallbackTitle,
      description: input.fallbackDescription,
      image: input.fallbackImage,
      author: input.fallbackAuthor,
      keywords: input.baseKeywords,
    },
  });
}
