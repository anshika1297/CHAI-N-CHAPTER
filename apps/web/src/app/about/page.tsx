import AboutPageContent from '@/components/about/AboutPageContent';
import { buildMetadata } from '@/lib/metadata';

export const metadata = buildMetadata({
  title: 'About Anshika Mishra – Book Blogger & Critic',
  description:
    'Get to know Anshika Mishra, book blogger and book critic behind Chapters.aur.Chai. My reading journey, how chapters.aur.chai started, and what to expect—fiction, history & mythology from around the world.',
  path: '/about',
  keywords: ['Anshika Mishra', 'book blogger', 'book critic', 'Indian book blogger', 'reading journey'],
});

export default function AboutPage() {
  return <AboutPageContent />;
}
