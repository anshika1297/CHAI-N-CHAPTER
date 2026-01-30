import Hero from '@/components/Hero';
import BookReviews from '@/components/BookReviews';
import BookRecommendations from '@/components/BookRecommendations';
import MusingsVerse from '@/components/MusingsVerse';
import BookClubs from '@/components/BookClubs';
import Contact from '@/components/Contact';
import { buildMetadata } from '@/lib/metadata';

export const metadata = buildMetadata({
  title: 'Book Blogger, Content Creator & Literary Services | Anshika Mishra | India & UAE',
  description:
    'Book blogger & content creator Anshika Mishra—honest reviews, literary services & book recommendations for readers worldwide. Based in Abu Dhabi. For authors, publishers & lit fest committees in India & UAE.',
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
