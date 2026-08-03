import Link from 'next/link';
import { ArrowRight, BookOpen, Map } from 'lucide-react';
import { getImageUrl } from '@/lib/api';
import type { ResolvedReadingPath, ReadingPathItem } from '@/lib/readingPaths/types';

const KIND_LABELS: Record<ReadingPathItem['kind'], string> = {
  review: 'Review',
  recommendation: 'Recommendations',
  'author-spotlight': 'Author Spotlight',
  musing: 'Musing',
};

type Props = {
  path: ResolvedReadingPath;
  compact?: boolean;
  /** Show link to the canonical /reading-paths/[slug] page (default true). */
  showDedicatedLink?: boolean;
  className?: string;
};

function PathItemCard({ item }: { item: ReadingPathItem }) {
  const imageUrl = item.image ? getImageUrl(item.image) : '';
  return (
    <Link
      href={item.href}
      className="group flex gap-3 rounded-xl border border-chai-brown/10 bg-cream-light p-3 sm:p-4 hover:border-terracotta/35 transition-colors"
    >
      <div className="shrink-0 w-14 h-20 sm:w-16 sm:h-[5.5rem] rounded-lg overflow-hidden bg-chai-brown/5 border border-chai-brown/10">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-chai-brown/25">
            <BookOpen size={22} strokeWidth={1.25} />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-[10px] sm:text-xs font-sans uppercase tracking-wide text-terracotta">
          {KIND_LABELS[item.kind]}
        </span>
        <h4 className="font-serif text-sm sm:text-base text-chai-brown mt-0.5 leading-snug line-clamp-2 group-hover:text-terracotta transition-colors">
          {item.title}
        </h4>
        {item.excerpt ? (
          <p className="font-body text-xs text-chai-brown-light mt-1 line-clamp-2 hidden sm:block">{item.excerpt}</p>
        ) : null}
      </div>
      <ArrowRight
        size={16}
        className="shrink-0 text-terracotta/60 group-hover:text-terracotta self-center transition-colors"
        aria-hidden
      />
    </Link>
  );
}

export default function ReadingPathView({
  path,
  compact = false,
  showDedicatedLink = true,
  className = '',
}: Props) {
  return (
    <section
      id="reading-path"
      className={`scroll-mt-28 ${className}`}
      aria-labelledby={`reading-path-${path.slug}`}
    >
      <header className={compact ? 'mb-5' : 'mb-8'}>
        <div className="flex items-center gap-2 text-terracotta mb-2">
          <Map size={18} aria-hidden />
          <span className="font-sans text-xs uppercase tracking-[0.15em]">Reading path</span>
        </div>
        <h2
          id={`reading-path-${path.slug}`}
          className={compact ? 'font-serif text-xl text-chai-brown' : 'font-serif text-2xl sm:text-3xl text-chai-brown'}
        >
          {path.title}
        </h2>
        <p className="mt-2 font-body text-sm sm:text-base text-chai-brown-light leading-relaxed max-w-2xl">
          {path.description}
        </p>
        {!compact ? (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            {showDedicatedLink ? (
              <Link
                href={path.pageHref}
                className="inline-flex items-center gap-1.5 text-sm font-sans font-medium text-terracotta hover:gap-2 transition-all"
              >
                Open full path page
                <ArrowRight size={14} />
              </Link>
            ) : null}
            <Link
              href={path.topicHubHref}
              className="inline-flex items-center gap-1.5 text-sm font-sans font-medium text-chai-brown-light hover:text-terracotta transition-colors"
            >
              Browse all in this topic
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : null}
      </header>

      <ol className="space-y-6 sm:space-y-8">
        {path.steps.map((step) =>
          step.items.length ? (
            <li key={step.step} className="relative">
              <div className="flex items-start gap-3 sm:gap-4 mb-3">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-terracotta text-cream font-sans text-sm font-semibold"
                  aria-hidden
                >
                  {step.step}
                </span>
                <div>
                  <h3 className="font-serif text-lg text-chai-brown leading-snug">{step.title}</h3>
                  <p className="font-body text-sm text-chai-brown-light mt-1">{step.description}</p>
                </div>
              </div>
              <ul className={`space-y-2 sm:space-y-3 ${compact ? '' : 'sm:pl-11'}`}>
                {step.items.map((item) => (
                  <li key={`${item.kind}-${item.slug}`}>
                    <PathItemCard item={item} />
                  </li>
                ))}
              </ul>
            </li>
          ) : null
        )}
      </ol>
    </section>
  );
}
