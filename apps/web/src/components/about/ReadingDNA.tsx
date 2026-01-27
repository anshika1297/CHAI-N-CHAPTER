'use client';

export type ReadingDNAData = {
  title: string;
  subtitle: string;
  facts: { label: string; value: string }[];
};

const defaultData: ReadingDNAData = {
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
};

type Props = { readingDNA?: Partial<ReadingDNAData> | null };

export default function ReadingDNA({ readingDNA: prop }: Props) {
  const data =
    prop?.title != null || prop?.subtitle != null || (prop?.facts?.length ?? 0) > 0
      ? { ...defaultData, ...prop, facts: prop?.facts?.length ? prop.facts : defaultData.facts }
      : defaultData;

  return (
    <section className="py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-cream-dark/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-chai-brown mb-3">
            {data.title}
          </h2>
          <p className="text-terracotta font-body italic text-lg">{data.subtitle}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {data.facts.map((fact, index) => (
            <div
              key={index}
              className="bg-sage/20 backdrop-blur-sm rounded-full aspect-square flex flex-col items-center justify-center p-4 sm:p-6 hover:bg-sage/30 transition-all duration-300 hover:scale-105 group"
            >
              <p className="text-chai-brown font-serif text-sm sm:text-base text-center mb-2 group-hover:text-chai-brown-dark">
                {fact.label}
              </p>
              <p className="text-chai-brown-dark font-body text-xs sm:text-sm text-center font-medium">
                {fact.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
