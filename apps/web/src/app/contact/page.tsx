import ContactPage from '@/components/ContactPage';
import { buildMetadata } from '@/lib/metadata';

export const metadata = buildMetadata({
  title: 'Contact – Chapters.aur.Chai',
  description:
    'Get in touch with Anshika Mishra, book blogger & content creator. For readers, authors, publishers & lit fest committees in India & UAE—collaborations, literary services, or just say hello.',
  path: '/contact',
});

export default function Contact() {
  return <ContactPage />;
}
