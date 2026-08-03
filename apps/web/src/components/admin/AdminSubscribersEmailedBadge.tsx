import { hasSubscribersBeenEmailed, type SubscribersEmailedFields } from '@/lib/subscribersEmailed';

/** Shows when subscribers were emailed once about this item (first publish only). */
export default function AdminSubscribersEmailedBadge({ item }: { item: SubscribersEmailedFields }) {
  if (!hasSubscribersBeenEmailed(item)) return null;
  return (
    <span
      className="inline-block mt-1 text-xs font-body text-sage bg-sage/10 px-1.5 py-0.5 rounded"
      title="Subscribers were emailed when this was first published"
    >
      Emailed
    </span>
  );
}
