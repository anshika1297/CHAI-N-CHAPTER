import type { BookSuggestion } from '@/lib/books/nudgeSuggestions';
import RelatedBookNudge from './RelatedBookNudge';

/** Renders one interstitial book nudge at a fixed slot (after a content section). */
export default function BookNudgeAfter({
  suggestions,
  slotIndex,
}: {
  suggestions: BookSuggestion[];
  slotIndex: number;
}) {
  const suggestion = suggestions[slotIndex];
  if (!suggestion) return null;
  return <RelatedBookNudge suggestion={suggestion} index={slotIndex} />;
}
