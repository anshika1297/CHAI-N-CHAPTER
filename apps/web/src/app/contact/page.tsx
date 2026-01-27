import ContactPage from '@/components/ContactPage';
import { buildMetadata } from '@/lib/metadata';

export const metadata = buildMetadata({
  title: 'Contact – Chapters.aur.Chai',
  description:
    'Get in touch with Anshika Mishra, book blogger and book critic. Chat about books, share recommendations, or say hello.',
  path: '/contact',
});

export default function Contact() {
  return <ContactPage />;
}
