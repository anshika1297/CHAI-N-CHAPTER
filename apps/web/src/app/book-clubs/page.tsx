import BookClubsListing from '@/components/book-clubs/BookClubsListing';
import { buildMetadata } from '@/lib/metadata';

export const metadata = buildMetadata({
  title: 'Book Clubs – Chapters.aur.Chai',
  description:
    'Join book clubs by Anshika Mishra. Connect with fellow readers over fiction, history, mythology, and shared stories from around the world.',
  path: '/book-clubs',
  keywords: ['book clubs', 'reading community', 'fiction book club', 'Chapters.aur.Chai'],
});

export default function BookClubsPage() {
  return <BookClubsListing />;
}
