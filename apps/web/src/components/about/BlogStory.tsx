'use client';

export type BlogStoryData = {
  title: string;
  subtitle: string;
  storyParagraphs: string[];
  whatToExpect: { icon: string; title: string; text: string }[];
};

const defaultData: BlogStoryData = {
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
};

type Props = { blogStory?: Partial<BlogStoryData> | null };

export default function BlogStory({ blogStory: prop }: Props) {
  const data =
    prop?.title != null ||
    prop?.subtitle != null ||
    (prop?.storyParagraphs?.length ?? 0) > 0 ||
    (prop?.whatToExpect?.length ?? 0) > 0
      ? {
          ...defaultData,
          ...prop,
          storyParagraphs: prop?.storyParagraphs?.length ? prop.storyParagraphs : defaultData.storyParagraphs,
          whatToExpect: prop?.whatToExpect?.length ? prop.whatToExpect : defaultData.whatToExpect,
        }
      : defaultData;

  return (
    <section className="py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-chai-brown mb-3">
            {data.title}
          </h2>
          <p className="text-terracotta font-body italic text-lg">{data.subtitle}</p>
        </div>
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-cream-light to-cream-dark rounded-2xl p-6 sm:p-8 lg:p-10 shadow-lg">
            {data.storyParagraphs.map((p, i) => (
              <p
                key={i}
                className="text-chai-brown font-body text-base sm:text-lg leading-relaxed mb-6 last:mb-0"
              >
                {p}
              </p>
            ))}
          </div>
          <div className="bg-chai-brown text-cream rounded-2xl p-6 sm:p-8 lg:p-10 shadow-lg">
            <h3 className="font-serif text-2xl sm:text-3xl mb-4">What to Expect</h3>
            <ul className="space-y-4 font-body text-base sm:text-lg">
              {data.whatToExpect.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-terracotta-light text-xl mt-1">{item.icon}</span>
                  <span>
                    <strong className="text-terracotta-light">{item.title}</strong> {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
