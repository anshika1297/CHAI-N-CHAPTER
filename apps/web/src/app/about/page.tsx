import AboutPageContent from '@/components/about/AboutPageContent';
import { buildMetadata } from '@/lib/metadata';

export const metadata = buildMetadata({
  title: 'About Anshika Mishra – Book Blogger, Content Creator & Literary Services',
  description:
    'Get to know Anshika Mishra, book blogger and content creator behind Chapters.aur.Chai. Based in Abu Dhabi. My reading journey, literary services, and what to expect—fiction, history & mythology for readers, authors & publishers in India & UAE.',
  path: '/about',
  keywords: ['Anshika Mishra', 'book blogger', 'content creator', 'Indian book blogger', 'UAE book blogger', 'Abu Dhabi', 'literary services', 'reading journey'],
});

export default function AboutPage() {
  return <AboutPageContent />;
}
