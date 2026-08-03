import type { AuthorSpotlightQaItem } from '@/lib/api';
import { siteConfig } from '@/lib/seo';
import { RichOrPlain, SectionHeading } from './utils';

function formatPrompt(question: string): string {
  const text = question.trim();
  if (!text) return text;
  if (/[?!.]…]$/.test(text)) return text;
  return `${text}?`;
}

export default function AuthorSpotlightInterview({
  title,
  authorName,
  items,
}: {
  title: string;
  authorName: string;
  items: AuthorSpotlightQaItem[];
}) {
  if (!items.length) return null;

  const speaker = authorName.trim() || 'Author';

  return (
    <section className="mb-14" aria-labelledby="spotlight-interview">
      <SectionHeading id="spotlight-interview">{title}</SectionHeading>

      <div className="mt-8 space-y-10 sm:space-y-12">
        {items.map((item, i) => (
          <div key={i} className="space-y-3">
            <div>
              <p className="font-sans text-xs font-semibold uppercase tracking-wider text-sage-dark mb-1.5">
                {siteConfig.name}
              </p>
              <p className="font-body text-base sm:text-lg text-sage-dark italic leading-relaxed">
                {formatPrompt(item.question)}
              </p>
            </div>
            <div className="rounded-lg bg-cream-light/90 border border-chai-brown/10 border-l-[3px] border-l-terracotta px-5 py-4 sm:px-6 sm:py-5 shadow-sm">
              <p className="font-sans text-xs font-semibold uppercase tracking-wider text-terracotta mb-2">
                {speaker}
              </p>
              <RichOrPlain
                html={item.answer}
                plain={item.answer}
                className="text-base sm:text-[1.0625rem] text-chai-brown [&_a]:text-terracotta"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
