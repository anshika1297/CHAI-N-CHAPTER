import type { ReadNextItem, ReadNextVariant } from '@/lib/readNext';
import ReadNextNudge from './ReadNextNudge';

export default function ReadNextNudgeAfter({
  items,
  variant,
  slotIndex,
}: {
  items: ReadNextItem[];
  variant: ReadNextVariant;
  slotIndex: number;
}) {
  const item = items[slotIndex];
  if (!item) return null;
  return <ReadNextNudge item={item} variant={variant} index={slotIndex} />;
}
