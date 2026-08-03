import { resolveListingSocialImage } from '@/lib/metadata/socialImage';
import { resolvePageMetadata } from '@/lib/metadata/resolve';
import type { ReadingPathDefinition } from './types';
import { readingPathPagePath } from './definitions';

export function resolveReadingPathMetadata(defn: ReadingPathDefinition) {
  const path = readingPathPagePath(defn.slug);
  const stepSummary = defn.steps.map((s) => s.title).join(' · ');
  const longDescription = `${defn.description} ${stepSummary}.`;
  const trimmedDescription =
    longDescription.length > 155 ? `${longDescription.slice(0, 152).trim()}…` : longDescription;

  return resolvePageMetadata({
    path,
    seoTitle: defn.title,
    contentTitle: defn.title,
    fallbackTitle: defn.title,
    seoDescription: trimmedDescription,
    excerpt: defn.description,
    fallbackDescription: defn.description,
    keywords: [
      'reading path',
      'book reading guide',
      defn.slug.replace(/-/g, ' '),
      'Chapters.aur.Chai',
      'book reviews',
      'book recommendations',
    ],
    type: 'website',
    image: resolveListingSocialImage({
      title: defn.title,
      category: 'Reading Path',
    }),
  });
}
