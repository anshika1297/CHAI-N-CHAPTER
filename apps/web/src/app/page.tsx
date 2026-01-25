import Hero from '@/components/Hero';
import BookReviews from '@/components/BookReviews';
import BookRecommendations from '@/components/BookRecommendations';
import BookClubs from '@/components/BookClubs';
import Contact from '@/components/Contact';

export default function Home() {
  return (
    <>
      <Hero />
      <BookReviews />
      <BookRecommendations />
      <BookClubs />
      <Contact />
    </>
  );
}
