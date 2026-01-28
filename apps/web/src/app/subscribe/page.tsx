import SubscribePageContent from '@/components/subscribe/SubscribePageContent';
import { buildMetadata } from '@/lib/metadata';

export const metadata = buildMetadata({
  title: 'Subscribe – Chapters.aur.Chai',
  description:
    'Subscribe to get book recommendations, blog updates, and reading lists straight to your inbox.',
  path: '/subscribe',
});

export default function SubscribePage() {
  return <SubscribePageContent />;
}
