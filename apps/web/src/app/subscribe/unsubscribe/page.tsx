import UnsubscribePageContent from '@/components/subscribe/UnsubscribePageContent';
import { buildMetadata } from '@/lib/metadata';

export const metadata = buildMetadata({
  title: 'Unsubscribe',
  description: 'Unsubscribe from the Chapters.aur.Chai newsletter.',
  path: '/subscribe/unsubscribe',
  noIndex: true,
});

export default function UnsubscribePage() {
  return <UnsubscribePageContent />;
}
