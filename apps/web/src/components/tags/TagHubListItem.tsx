import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { getImageUrl } from '@/lib/api';
import type { TaggedContentRef } from '@/lib/tags';

type Props = {
  item: TaggedContentRef;
  kindLabel: string;
};

export default function TagHubListItem({ item, kindLabel }: Props) {
  const imageUrl = item.image ? getImageUrl(item.image) : '';

  return (
    <Link
      href={item.href}
      className="flex gap-4 rounded-xl border border-chai-brown/10 bg-cream-light p-4 sm:p-5 hover:border-terracotta/40 transition-colors"
    >
      <div
        className="shrink-0 w-[4.5rem] h-[6.5rem] sm:w-20 sm:h-[7.5rem] rounded-lg overflow-hidden bg-chai-brown/5 border border-chai-brown/10"
        aria-hidden={!imageUrl}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-chai-brown/25">
            <BookOpen size={28} strokeWidth={1.25} />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <span className="text-xs font-sans uppercase tracking-wide text-terracotta">{kindLabel}</span>
        <h2 className="font-serif text-lg sm:text-xl text-chai-brown mt-1 leading-snug">{item.title}</h2>
        {item.excerpt ? (
          <p className="font-body text-sm text-chai-brown-light mt-2 line-clamp-2">{item.excerpt}</p>
        ) : null}
      </div>
    </Link>
  );
}
