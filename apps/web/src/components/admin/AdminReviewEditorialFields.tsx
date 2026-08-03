'use client';

import { Plus, Trash2 } from 'lucide-react';
import type { ReviewEditorialFields, SimilarBookRef } from '@/lib/contentFields';

type Props = {
  value: ReviewEditorialFields;
  onChange: (next: ReviewEditorialFields) => void;
};

const emptyBook = (): SimilarBookRef => ({ title: '', author: '', internalUrl: '', note: '' });

export default function AdminReviewEditorialFields({ value, onChange }: Props) {
  const set = (patch: Partial<ReviewEditorialFields>) => onChange({ ...value, ...patch });
  const books = value.similarBooks ?? [];

  const setBook = (i: number, patch: Partial<SimilarBookRef>) => {
    const next = [...books];
    next[i] = { ...next[i], ...patch };
    set({ similarBooks: next });
  };

  return (
    <fieldset className="border border-sage/30 rounded-lg p-4 space-y-3">
      <legend className="font-body text-sm font-medium text-chai-brown px-1">Review summary (AI / AEO)</legend>
      <p className="font-body text-xs text-chai-brown-light -mt-1">
        Short, direct answers help search engines and AI cite your review accurately.
      </p>
      <div>
        <label className="block font-body text-xs font-medium text-chai-brown mb-1">Recommended for</label>
        <textarea
          value={value.recommendedFor ?? ''}
          onChange={(e) => set({ recommendedFor: e.target.value })}
          rows={2}
          placeholder="e.g. Readers who love slow-burn literary fiction with lyrical prose"
          className="w-full px-3 py-2 border border-chai-brown/20 rounded-lg text-sm font-body"
        />
      </div>
      <div>
        <label className="block font-body text-xs font-medium text-chai-brown mb-1">Not recommended for</label>
        <textarea
          value={value.notRecommendedFor ?? ''}
          onChange={(e) => set({ notRecommendedFor: e.target.value })}
          rows={2}
          placeholder="e.g. Readers seeking fast-paced plot-driven thrillers"
          className="w-full px-3 py-2 border border-chai-brown/20 rounded-lg text-sm font-body"
        />
      </div>
      <div>
        <label className="block font-body text-xs font-medium text-chai-brown mb-1">Verdict (one-line)</label>
        <input
          type="text"
          value={value.verdict ?? ''}
          onChange={(e) => set({ verdict: e.target.value })}
          placeholder="e.g. A moving, must-read debut — 4.5/5"
          className="w-full px-3 py-2 border border-chai-brown/20 rounded-lg text-sm font-body"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="font-body text-xs font-medium text-chai-brown">Similar books</label>
          <button
            type="button"
            onClick={() => set({ similarBooks: [...books, emptyBook()] })}
            className="flex items-center gap-1 text-xs text-terracotta font-body"
          >
            <Plus size={14} /> Add
          </button>
        </div>
        {books.map((b, i) => (
          <div key={i} className="mb-3 p-3 bg-cream/50 rounded-lg border border-chai-brown/10 space-y-2">
            <div className="flex justify-between">
              <span className="text-xs font-body text-chai-brown-light">Book {i + 1}</span>
              <button type="button" onClick={() => set({ similarBooks: books.filter((_, j) => j !== i) })} className="text-red-600">
                <Trash2 size={14} />
              </button>
            </div>
            <input
              placeholder="Title"
              value={b.title}
              onChange={(e) => setBook(i, { title: e.target.value })}
              className="w-full px-2 py-1.5 border border-chai-brown/20 rounded text-sm"
            />
            <input
              placeholder="Author (optional)"
              value={b.author ?? ''}
              onChange={(e) => setBook(i, { author: e.target.value })}
              className="w-full px-2 py-1.5 border border-chai-brown/20 rounded text-sm"
            />
            <input
              placeholder="Internal link e.g. /blog/slug (optional)"
              value={b.internalUrl ?? ''}
              onChange={(e) => setBook(i, { internalUrl: e.target.value })}
              className="w-full px-2 py-1.5 border border-chai-brown/20 rounded text-sm"
            />
            <input
              placeholder="Short note (optional)"
              value={b.note ?? ''}
              onChange={(e) => setBook(i, { note: e.target.value })}
              className="w-full px-2 py-1.5 border border-chai-brown/20 rounded text-sm"
            />
          </div>
        ))}
      </div>
    </fieldset>
  );
}
