import UnsubscribePageContent from '@/components/subscribe/UnsubscribePageContent';
import { buildMetadata } from '@/lib/metadata';

export const metadata = buildMetadata({
  title: 'Unsubscribe – Chapters.aur.Chai',
  description: 'Unsubscribe from the newsletter.',
  path: '/subscribe/unsubscribe',
});

export default function UnsubscribePage() {
  return <UnsubscribePageContent />;
}
