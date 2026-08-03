'use client';

import { BOOK_GENRE_OPTIONS } from '@/lib/genres/vocabulary';
import { formatGenresForInput, parseGenresInput } from '@/lib/contentFields';

type Props = {
  value: string[] | undefined;
  onChange: (genres: string[]) => void;
  label?: string;
  hint?: string;
};

export default function AdminGenresField({
  value,
  onChange,
  label = 'Book genres',
  hint = 'Primary genre(s) for discovery, genre pages, and catalog matching. Select one or more.',
}: Props) {
  const selected = new Set((value ?? []).map((g) => g.trim()));

  const toggle = (genre: string) => {
    const next = new Set(selected);
    if (next.has(genre)) next.delete(genre);
    else next.add(genre);
    onChange([...next]);
  };

  return (
    <div>
      <label className="block font-body text-sm font-medium text-chai-brown mb-2">{label}</label>
      {hint ? <p className="font-body text-xs text-chai-brown-light mb-3">{hint}</p> : null}
      <div className="flex flex-wrap gap-2 mb-3">
        {BOOK_GENRE_OPTIONS.map((genre) => {
          const active = selected.has(genre);
          return (
            <button
              key={genre}
              type="button"
              onClick={() => toggle(genre)}
              className={`font-sans text-xs px-3 py-1.5 rounded-full border transition-colors ${
                active
                  ? 'bg-terracotta text-cream border-terracotta'
                  : 'bg-cream-light text-chai-brown border-chai-brown/20 hover:border-terracotta/40'
              }`}
            >
              {genre}
            </button>
          );
        })}
      </div>
      <input
        type="text"
        value={formatGenresForInput(value)}
        onChange={(e) => onChange(parseGenresInput(e.target.value))}
        placeholder="Or type custom genres, comma-separated"
        className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body text-sm"
      />
    </div>
  );
}
