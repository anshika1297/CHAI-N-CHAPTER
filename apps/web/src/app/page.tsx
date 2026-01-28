import Hero from '@/components/Hero';
import BookReviews from '@/components/BookReviews';
import BookRecommendations from '@/components/BookRecommendations';
import MusingsVerse from '@/components/MusingsVerse';
import BookClubs from '@/components/BookClubs';
import Contact from '@/components/Contact';
import { buildMetadata } from '@/lib/metadata';

export const metadata = buildMetadata({
  title: 'Book Blogger & Book Critic by Anshika Mishra',
  description:
    'Book reviews, recommendations & literary reflections by Anshika Mishra. Fiction, history & mythology from around the world. Indian book blogger with a global reach—open to authors everywhere who write in English.',
  path: '/',
});

export default function Home() {
  return (
    <>
      <Hero />
      <BookReviews />
      <BookRecommendations />
      <MusingsVerse />
      <BookClubs />
      <Contact />
    </>
  );
}
