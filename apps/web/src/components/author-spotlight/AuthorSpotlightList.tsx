import { Users } from 'lucide-react';
import type { AuthorSpotlightListItem } from '@/lib/api';
import AuthorSpotlightCard from './AuthorSpotlightCard';

export default function AuthorSpotlightList({ spotlights }: { spotlights: AuthorSpotlightListItem[] }) {
  if (!spotlights.length) {
    return (
      <div className="text-center py-16 sm:py-24 px-6 rounded-2xl bg-cream-light border border-chai-brown/10">
        <Users size={48} className="mx-auto text-sage/50 mb-4" strokeWidth={1.25} />
        <p className="font-serif text-xl text-chai-brown">Spotlights coming soon</p>
        <p className="mt-3 font-body text-chai-brown-light max-w-md mx-auto leading-relaxed">
          We are preparing author profiles with bios, favourite reads, and curated links. Check back shortly.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6">
      {spotlights.map((s) => (
        <li key={s.id} className="h-full">
          <AuthorSpotlightCard spotlight={s} />
        </li>
      ))}
    </ul>
  );
}
