import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, ListOrdered, Sparkles } from 'lucide-react';
import { getImageUrl } from '@/lib/api';
import type { ShopHubEntry } from '@/lib/shopCatalog';

const kindLabel: Record<ShopHubEntry['kind'], string> = {
  review: 'Book review',
  recommendations: 'Recommendations',
  'author-spotlight': 'Author spotlight',
};

const kindIcon = { review: BookOpen, recommendations: ListOrdered, 'author-spotlight': Sparkles };

export default function ShopHubView({ entries }: { entries: ShopHubEntry[] }) {
  return (
    <div className="w-full">
      <header className="mb-10 text-center">
        <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown mb-3">Shop the books</h1>
        <p className="font-body text-chai-brown-light max-w-xl mx-auto">
          Purchase links for books from our reviews, recommendation lists, and author spotlights.
        </p>
      </header>
      {entries.length === 0 ? (
        <div className="text-center py-12 max-w-lg mx-auto">
          <p className="font-body text-chai-brown-light mb-4">
            Buy links appear here once affiliate or purchase URLs are added to reviews, lists, or author spotlights in
            the admin.
          </p>
          <Link href="/books" className="btn-primary inline-flex">
            Browse the books directory
          </Link>
          <p className="mt-4 font-sans text-xs text-chai-brown/60">
            <Link href="/blog" className="text-terracotta hover:underline">
              Book reviews
            </Link>
            {' · '}
            <Link href="/recommendations" className="text-terracotta hover:underline">
              Recommendations
            </Link>
          </p>
        </div>
      ) : (
        <ul className="grid gap-4">
          {entries.map((e) => {
            const Icon = kindIcon[e.kind];
            const img = e.image ? getImageUrl(e.image) : '';
            return (
              <li key={`${e.kind}-${e.slug}`}>
                <Link href={e.href} className="card flex gap-4 p-4 sm:p-5 bg-cream-light hover:shadow-md transition-shadow group">
                  <div className="relative w-20 h-28 shrink-0 rounded-md overflow-hidden bg-sage/10">
                    {img ? <Image src={img} alt="" fill className="object-cover" unoptimized /> : (
                      <div className="absolute inset-0 flex items-center justify-center text-chai-brown/25"><Icon size={28} /></div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-sans uppercase tracking-wide text-terracotta">{kindLabel[e.kind]}</span>
                    <h2 className="font-serif text-xl text-chai-brown group-hover:text-terracotta transition-colors mt-1">{e.title}</h2>
                    {e.subtitle ? <p className="font-body text-sm text-chai-brown-light mt-1 line-clamp-2">{e.subtitle}</p> : null}
                    <p className="font-sans text-xs text-sage mt-2">{e.bookCount} book{e.bookCount === 1 ? '' : 's'} · View buy links →</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
