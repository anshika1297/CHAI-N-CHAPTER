import AboutHero from '@/components/about/AboutHero';
import ReadingJourney from '@/components/about/ReadingJourney';
import BlogStory from '@/components/about/BlogStory';
import PictureGallery from '@/components/about/PictureGallery';
import ReadingDNA from '@/components/about/ReadingDNA';

export const metadata = {
  title: 'About Me | chai.n.chapter',
  description: 'Get to know the person behind chai.n.chapter - my reading journey, story, and what to expect from this cozy corner of the internet.',
};

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <ReadingJourney />
      <BlogStory />
      <ReadingDNA />
      <PictureGallery />
    </>
  );
}
