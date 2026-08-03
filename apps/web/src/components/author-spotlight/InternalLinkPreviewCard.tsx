import Link from 'next/link';
import Image from 'next/image';
import { Clock } from 'lucide-react';
import type { InternalLinkPreview } from '@/lib/resolveInternalLinkPreview';

/** Rich link card (WhatsApp / iMessage style) for on-site blog, recommendations, or musings URLs. */
export default function InternalLinkPreviewCard({ preview }: { preview: InternalLinkPreview }) {
  const inner = (
    <article className="group flex min-w-0 overflow-hidden rounded-xl border border-chai-brown/10 bg-cream-light shadow-sm hover:border-sage/50 hover:shadow-md transition-all">
      <div className="relative w-28 sm:w-36 shrink-0 bg-gradient-to-br from-sage/25 to-terracotta/15 min-h-[7rem]">
        {preview.image ? (
          <Image
            src={preview.image}
            alt=""
            fill
            className="object-cover"
            sizes="144px"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-3xl opacity-40" aria-hidden>
            📖
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center p-4 sm:p-5">
        <p className="font-sans text-[10px] sm:text-xs uppercase tracking-wide text-sage-dark truncate">
          {preview.siteLabel} · {preview.category}
        </p>
        <h3 className="mt-1 font-serif text-base sm:text-lg text-chai-brown line-clamp-2 group-hover:text-sage transition-colors">
          {preview.title}
        </h3>
        {preview.description ? (
          <p className="mt-1.5 font-body text-xs sm:text-sm text-chai-brown-light line-clamp-2 leading-relaxed">
            {preview.description}
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-2 font-sans text-xs text-chai-brown/60">
          {preview.readingTime ? (
            <span className="inline-flex items-center gap-1">
              <Clock size={12} aria-hidden />
              {preview.readingTime} min read
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );

  return (
    <Link href={preview.href} className="block">
      {inner}
    </Link>
  );
}
