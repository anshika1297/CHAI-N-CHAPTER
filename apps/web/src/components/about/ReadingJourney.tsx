'use client';

export type ReadingJourneyData = {
  title: string;
  subtitle: string;
  paragraphs: string[];
};

const defaultData: ReadingJourneyData = {
  title: 'My Reading Journey',
  subtitle: 'How it all began',
  paragraphs: [
    "My love affair with books started when I was just a little girl, curled up in my grandmother's lap as she read me stories from ancient Indian epics. Those magical moments, with the smell of old books and the warmth of her voice, planted a seed that would grow into an unshakeable passion.",
    "As I grew older, books became my escape, my teachers, and my constant companions. From devouring Enid Blyton's adventures to discovering the rich tapestry of Indian literature, each book shaped who I am today. The turning point came in 2015 when I read a book that completely changed my perspective on life.",
    "That's when I realized I wanted to share these transformative experiences with others. I started documenting my thoughts, creating a space where stories could breathe and readers could find their next favorite book. Today, reading isn't just a hobby—it's a way of life, a journey I'm honored to share with you.",
  ],
};

type Props = { readingJourney?: Partial<ReadingJourneyData> | null };

export default function ReadingJourney({ readingJourney: prop }: Props) {
  const data = prop?.title != null || prop?.subtitle != null || (prop?.paragraphs?.length ?? 0) > 0
    ? { ...defaultData, ...prop, paragraphs: prop?.paragraphs?.length ? prop.paragraphs : defaultData.paragraphs }
    : defaultData;

  return (
    <section className="py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-cream-dark/30">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-chai-brown mb-3">
            {data.title}
          </h2>
          <p className="text-terracotta font-body italic text-lg">{data.subtitle}</p>
        </div>
        <div className="space-y-4">
          {data.paragraphs.map((para, i) => (
            <div key={i} className="bg-cream-light rounded-2xl p-6 sm:p-8 shadow-md">
              <p className="text-chai-brown font-body text-base sm:text-lg leading-relaxed">{para}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
