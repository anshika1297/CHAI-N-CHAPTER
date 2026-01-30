import WorkWithMe from '@/components/WorkWithMe';
import { buildMetadata } from '@/lib/metadata';

export const metadata = buildMetadata({
  title: 'Work With Me – Beta Reading, Reviews & Literary Services | India & UAE',
  description:
    'Book blogger & content creator Anshika Mishra—literary services for authors, publishers & lit fest committees. Beta reading, book reviews, proofreading, author interviews. Based in Abu Dhabi. Open to authors worldwide who write in English.',
  path: '/work-with-me',
  keywords: ['beta reading', 'book reviewer', 'author interviews', 'proofreading', 'literary services', 'publishers India', 'publishers UAE', 'lit fest', 'fiction author services', 'Abu Dhabi book blogger'],
});

export default function WorkWithMePage() {
  return <WorkWithMe />;
}
