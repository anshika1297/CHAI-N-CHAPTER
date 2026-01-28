'use client';

import { useState, useEffect } from 'react';
import { getPageSettings } from '@/lib/api';
import AboutHero from './AboutHero';
import ReadingJourney from './ReadingJourney';
import BlogStory from './BlogStory';
import ReadingDNA from './ReadingDNA';
import PictureGallery from './PictureGallery';

const defaultAboutData = {
  hero: {
    name: 'Anshika',
    greeting: "Hi, I'm",
    subtitle1: 'Welcome to my cozy corner',
    subtitle2: 'of the internet',
    introText:
      'A book lover, chai enthusiast, and storyteller at heart. I believe every great story deserves to be shared over a warm cup of chai. Join me as I navigate through pages, one chapter at a time.',
    imageUrl: '',
  },
  readingJourney: {
    title: 'My Reading Journey',
    subtitle: 'How it all began',
    paragraphs: [
      "My love affair with books started when I was just a little girl, curled up in my grandmother's lap as she read me stories from ancient Indian epics. Those magical moments, with the smell of old books and the warmth of her voice, planted a seed that would grow into an unshakeable passion.",
      "As I grew older, books became my escape, my teachers, and my constant companions. From devouring Enid Blyton's adventures to discovering the rich tapestry of Indian literature, each book shaped who I am today. The turning point came in 2015 when I read a book that completely changed my perspective on life.",
      "That's when I realized I wanted to share these transformative experiences with others. I started documenting my thoughts, creating a space where stories could breathe and readers could find their next favorite book. Today, reading isn't just a hobby—it's a way of life, a journey I'm honored to share with you.",
    ],
  },
  blogStory: {
    title: 'How This Blog Came to Life',
    subtitle: 'The story behind chapters.aur.chai',
    storyParagraphs: [
      "chapters.aur.chai was born from a simple desire: to create a space where books meet chai, and stories find a home. After years of sharing book recommendations with friends over countless cups of chai, I realized there was a need for a platform that felt personal, authentic, and cozy—not algorithmic or overwhelming.",
      "In 2020, during a time when the world slowed down, I decided to turn my passion into something tangible. This blog is my love letter to slow reading, thoughtful reviews, and the beautiful community of readers who believe that every story matters.",
    ],
    whatToExpect: [
      { icon: '☕', title: 'Honest Reviews:', text: 'No sugar-coating, just genuine thoughts about books that moved me.' },
      { icon: '📚', title: 'Curated Recommendations:', text: 'Handpicked reads for every mood and moment.' },
      { icon: '💭', title: 'Reflections & Essays:', text: 'Deep dives into themes, characters, and the stories that stay with you.' },
      { icon: '🤝', title: 'Community:', text: 'Join our book clubs and connect with fellow readers who share your passion.' },
      { icon: '🌿', title: 'Slow Living:', text: 'A space that celebrates taking your time, one chapter at a time.' },
    ],
  },
  readingDNA: {
    title: 'My Reading DNA',
    subtitle: 'A few fun facts about my reading life',
    facts: [
      { label: 'Favorite Genre', value: 'Literary Fiction' },
      { label: 'Reading Style', value: 'Slow & Savor' },
      { label: 'First Book Love', value: 'The Secret Garden' },
      { label: 'Current Obsession', value: 'Indian Literature' },
      { label: 'Reading Goal', value: '50 Books/Year' },
      { label: 'Perfect Reading Spot', value: 'Cozy Corner + Chai' },
    ],
  },
  pictureCorner: [] as { id: string; imageUrl: string; title?: string; description?: string }[],
};

export default function AboutPageContent() {
  const [aboutData, setAboutData] = useState<typeof defaultAboutData | null>(null);

  useEffect(() => {
    getPageSettings('about')
      .then(({ content }) => {
        if (content && typeof content === 'object' && !Array.isArray(content)) {
          const c = content as Record<string, unknown>;
          const pictureCorner = Array.isArray(c.pictureCorner)
            ? (c.pictureCorner as Record<string, unknown>[])
                .filter((x) => x && typeof x === 'object' && typeof (x as { id?: unknown }).id === 'string')
                .map((x) => ({
                  id: String((x as { id: string }).id),
                  imageUrl: typeof (x as { imageUrl?: unknown }).imageUrl === 'string' ? (x as { imageUrl: string }).imageUrl : '',
                  title: typeof (x as { title?: unknown }).title === 'string' ? (x as { title: string }).title : '',
                  description: typeof (x as { description?: unknown }).description === 'string' ? (x as { description: string }).description : '',
                }))
            : defaultAboutData.pictureCorner;
          setAboutData({ ...defaultAboutData, ...(content as object), pictureCorner } as typeof defaultAboutData);
        } else {
          setAboutData(defaultAboutData);
        }
      })
      .catch(() => {
        setAboutData(defaultAboutData);
      });
  }, []);

  // Render static defaults until we've attempted fetch (avoids flash); once we have data (including merged API or fallback), use it.
  const data = aboutData ?? defaultAboutData;

  return (
    <>
      <AboutHero hero={data.hero} />
      <ReadingJourney readingJourney={data.readingJourney} />
      <BlogStory blogStory={data.blogStory} />
      <ReadingDNA readingDNA={data.readingDNA} />
      <PictureGallery images={data.pictureCorner} />
    </>
  );
}
