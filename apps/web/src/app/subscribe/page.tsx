import SubscribePageContent from '@/components/subscribe/SubscribePageContent';
import { buildMetadata } from '@/lib/metadata';

export const metadata = buildMetadata({
  title: 'Subscribe – Chapters.aur.Chai',
  description:
    'Subscribe to get book recommendations, blog updates, and reading lists from Anshika Mishra—book blogger & content creator for readers in India & UAE and worldwide.',
  path: '/subscribe',
});

export default function SubscribePage() {
  return <SubscribePageContent />;
}
