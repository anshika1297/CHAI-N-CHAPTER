import BookClubsListing from '@/components/book-clubs/BookClubsListing';
import { buildMetadata } from '@/lib/metadata';

export const metadata = buildMetadata({
  title: 'Book Clubs – Chapters.aur.Chai | India & UAE',
  description:
    'Join book clubs by Anshika Mishra, book blogger & content creator. Connect with fellow readers over fiction, history & mythology—for readers in India & UAE and worldwide.',
  path: '/book-clubs',
  keywords: ['book clubs', 'reading community', 'fiction book club', 'Chapters.aur.Chai', 'India book club', 'UAE book club'],
});

export default function BookClubsPage() {
  return <BookClubsListing />;
}
