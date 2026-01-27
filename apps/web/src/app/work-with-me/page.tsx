import WorkWithMe from '@/components/WorkWithMe';
import { buildMetadata } from '@/lib/metadata';

export const metadata = buildMetadata({
  title: 'Work With Me – Beta Reading, Reviews & More',
  description:
    'Open to authors worldwide who write in English: fiction (all kinds), history & mythology. Beta reading, book reviews, proofreading, author interviews. By Anshika Mishra.',
  path: '/work-with-me',
  keywords: ['beta reading', 'book reviewer', 'author interviews', 'proofreading', 'work with book blogger', 'fiction author services'],
});

export default function WorkWithMePage() {
  return <WorkWithMe />;
}
