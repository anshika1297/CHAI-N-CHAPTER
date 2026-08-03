import Link from 'next/link';
import { ArrowRight, Map } from 'lucide-react';
import { getFeaturedReadingPaths, readingPathPagePath } from '@/lib/readingPaths/definitions';

export default function StartHereReadingPaths() {
  const paths = getFeaturedReadingPaths();

  return (
    <section className="py-12 sm:py-16 bg-cream" aria-labelledby="start-here-reading-paths">
      <div className="site-container">
        <header className="text-center mb-8 sm:mb-10 max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2 text-terracotta mb-3">
            <Map size={20} aria-hidden />
            <span className="font-sans text-xs uppercase tracking-[0.15em]">Curated journeys</span>
          </div>
          <h2 id="start-here-reading-paths" className="section-heading">
            Reading paths
          </h2>
          <p className="section-subheading mb-0">
            Step-by-step guides through related reviews, lists, and author spotlights — built from live site content.
          </p>
        </header>

        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {paths.map((path) => (
            <li key={path.slug}>
              <Link
                href={readingPathPagePath(path.slug)}
                className="group card block h-full p-5 sm:p-6 border border-chai-brown/10 hover:border-terracotta/35 transition-colors"
              >
                <p className="font-sans text-xs uppercase tracking-wide text-terracotta mb-2">
                  {path.steps.length} steps
                </p>
                <h3 className="font-serif text-lg sm:text-xl text-chai-brown group-hover:text-terracotta transition-colors">
                  {path.title}
                </h3>
                <p className="mt-2 font-body text-sm text-chai-brown-light leading-relaxed line-clamp-3">
                  {path.description}
                </p>
                <ol className="mt-4 space-y-1.5">
                  {path.steps.slice(0, 3).map((step) => (
                    <li key={step.step} className="font-body text-xs text-chai-brown-light flex gap-2">
                      <span className="text-terracotta font-semibold shrink-0">{step.step}.</span>
                      <span className="line-clamp-1">{step.title}</span>
                    </li>
                  ))}
                  {path.steps.length > 3 ? (
                    <li className="font-body text-xs text-chai-brown-light/80 pl-5">+ more steps</li>
                  ) : null}
                </ol>
                <span className="mt-4 inline-flex items-center gap-1.5 font-sans text-sm font-medium text-terracotta group-hover:gap-2 transition-all">
                  Start path
                  <ArrowRight size={14} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
