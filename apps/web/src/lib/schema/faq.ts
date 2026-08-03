import type { ContentFaqItem } from '@/lib/contentFields';
import { SCHEMA_CONTEXT, compact } from './utils';
import type { JsonLdObject } from './types';

/** Merge FAQ/AEO groups into one list — dedupes by question (case-insensitive). */
export function mergeFaqItems(...groups: ContentFaqItem[][]): ContentFaqItem[] {
  const seen = new Set<string>();
  const out: ContentFaqItem[] = [];
  for (const group of groups) {
    for (const item of group) {
      const question = item.question.trim();
      const answer = item.answer.trim();
      if (!question || !answer) continue;
      const key = question.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ question, answer });
    }
  }
  return out;
}

/** Strip HTML for JSON-LD FAQ answers. */
export function stripHtmlForSchema(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function buildFaqPageSchema(items: ContentFaqItem[]): JsonLdObject | null {
  const valid = items.filter((i) => i.question.trim() && i.answer.trim());
  if (!valid.length) return null;
  return compact({
    '@context': SCHEMA_CONTEXT,
    '@type': 'FAQPage',
    mainEntity: valid.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: stripHtmlForSchema(item.answer) },
    })),
  });
}
