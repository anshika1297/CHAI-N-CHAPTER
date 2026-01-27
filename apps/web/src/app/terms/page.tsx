import TermsPage from '@/components/TermsPage';
import { buildMetadata } from '@/lib/metadata';

export const metadata = buildMetadata({
  title: 'Terms & Conditions',
  description: 'Terms and conditions for using chapters.aur.chai and book blogging services.',
  path: '/terms',
});

export default function Terms() {
  return <TermsPage />;
}
