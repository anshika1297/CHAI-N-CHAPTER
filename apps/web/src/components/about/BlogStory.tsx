'use client';

export default function BlogStory() {
  return (
    <section className="py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-chai-brown mb-3">
            How This Blog Came to Life
          </h2>
          <p className="text-terracotta font-body italic text-lg">
            The story behind chai.n.chapter
          </p>
        </div>

        <div className="space-y-6">
          {/* Main Story */}
          <div className="bg-gradient-to-br from-cream-light to-cream-dark rounded-2xl p-6 sm:p-8 lg:p-10 shadow-lg">
            <p className="text-chai-brown font-body text-base sm:text-lg leading-relaxed mb-6">
              <span className="font-serif text-xl text-chai-brown-dark">chai.n.chapter</span> was born 
              from a simple desire: to create a space where books meet chai, and stories find a home. 
              After years of sharing book recommendations with friends over countless cups of chai, 
              I realized there was a need for a platform that felt personal, authentic, and cozy—not 
              algorithmic or overwhelming.
            </p>
            
            <p className="text-chai-brown font-body text-base sm:text-lg leading-relaxed mb-6">
              In 2020, during a time when the world slowed down, I decided to turn my passion into 
              something tangible. This blog is my love letter to slow reading, thoughtful reviews, 
              and the beautiful community of readers who believe that every story matters.
            </p>
          </div>

          {/* What to Expect */}
          <div className="bg-chai-brown text-cream rounded-2xl p-6 sm:p-8 lg:p-10 shadow-lg">
            <h3 className="font-serif text-2xl sm:text-3xl mb-4">What to Expect</h3>
            <ul className="space-y-4 font-body text-base sm:text-lg">
              <li className="flex items-start gap-3">
                <span className="text-terracotta-light text-xl mt-1">☕</span>
                <span><strong className="text-terracotta-light">Honest Reviews:</strong> No sugar-coating, just genuine thoughts about books that moved me.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-terracotta-light text-xl mt-1">📚</span>
                <span><strong className="text-terracotta-light">Curated Recommendations:</strong> Handpicked reads for every mood and moment.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-terracotta-light text-xl mt-1">💭</span>
                <span><strong className="text-terracotta-light">Reflections & Essays:</strong> Deep dives into themes, characters, and the stories that stay with you.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-terracotta-light text-xl mt-1">🤝</span>
                <span><strong className="text-terracotta-light">Community:</strong> Join our book clubs and connect with fellow readers who share your passion.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-terracotta-light text-xl mt-1">🌿</span>
                <span><strong className="text-terracotta-light">Slow Living:</strong> A space that celebrates taking your time, one chapter at a time.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
