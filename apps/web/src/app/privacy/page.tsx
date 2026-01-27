import PrivacyPage from '@/components/PrivacyPage';
import { buildMetadata } from '@/lib/metadata';

export const metadata = buildMetadata({
  title: 'Privacy Policy',
  description: 'Privacy policy for Chapters.aur.Chai (chaptersaurchai.com) and how we handle your personal information.',
  path: '/privacy',
});

export default function Privacy() {
  return <PrivacyPage />;
}
