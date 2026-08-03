'use client';

import { Plus, Trash2 } from 'lucide-react';
import type { AuthorSpotlightEditorialFields, SimilarAuthorRef } from '@/lib/contentFields';
import { formatTagsForInput, parseTagsInput } from '@/lib/contentFields';

type Props = {
  value: AuthorSpotlightEditorialFields;
  onChange: (next: AuthorSpotlightEditorialFields) => void;
  authorName?: string;
};

const emptyAuthor = (): SimilarAuthorRef => ({ name: '', reason: '', url: '' });

export default function AdminSpotlightEditorialFields({ value, onChange, authorName }: Props) {
  const set = (patch: Partial<AuthorSpotlightEditorialFields>) => onChange({ ...value, ...patch });
  const authors = value.similarAuthors ?? [];
  const whoLabel = authorName?.trim()
    ? `Who is ${authorName.trim()}? (HTML — Quick facts)`
    : 'Who is this author? (HTML — Quick facts)';

  const setAuthor = (i: number, patch: Partial<SimilarAuthorRef>) => {
    const next = [...authors];
    next[i] = { ...next[i], ...patch };
    set({ similarAuthors: next });
  };

  return (
    <fieldset className="border border-sage/30 rounded-lg p-4 space-y-3">
      <legend className="font-body text-sm font-medium text-chai-brown px-1">Spotlight summary (AI / AEO)</legend>
      <div>
        <label className="block font-body text-xs font-medium text-chai-brown mb-1">{whoLabel}</label>
        <textarea
          value={value.whoIsHtml ?? ''}
          onChange={(e) => set({ whoIsHtml: e.target.value })}
          rows={4}
          placeholder="Separate from Introduction — shown under Quick facts. HTML allowed (e.g. <p>, <strong>, <a>)."
          className="w-full px-3 py-2 border border-chai-brown/20 rounded-lg text-sm font-body font-mono"
        />
        <p className="mt-1 text-xs text-chai-brown-light">
          Used only in Quick facts, not in the About introduction block.
        </p>
      </div>
      <div>
        <label className="block font-body text-xs font-medium text-chai-brown mb-1">Start here</label>
        <textarea
          value={value.startHere ?? ''}
          onChange={(e) => set({ startHere: e.target.value })}
          rows={2}
          placeholder="Which book or entry point should new readers try first?"
          className="w-full px-3 py-2 border border-chai-brown/20 rounded-lg text-sm font-body"
        />
      </div>
      <div>
        <label className="block font-body text-xs font-medium text-chai-brown mb-1">Notable works</label>
        <textarea
          value={formatTagsForInput(value.notableWorks)}
          onChange={(e) => set({ notableWorks: parseTagsInput(e.target.value) })}
          rows={3}
          placeholder="One title per line"
          className="w-full px-3 py-2 border border-chai-brown/20 rounded-lg text-sm font-body"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="font-body text-xs font-medium text-chai-brown">Similar authors</label>
          <button type="button" onClick={() => set({ similarAuthors: [...authors, emptyAuthor()] })} className="flex items-center gap-1 text-xs text-terracotta font-body">
            <Plus size={14} /> Add
          </button>
        </div>
        {authors.map((a, i) => (
          <div key={i} className="mb-3 p-3 bg-cream/50 rounded-lg border border-chai-brown/10 space-y-2">
            <div className="flex justify-end">
              <button type="button" onClick={() => set({ similarAuthors: authors.filter((_, j) => j !== i) })} className="text-red-600">
                <Trash2 size={14} />
              </button>
            </div>
            <input
              placeholder="Author name"
              value={a.name}
              onChange={(e) => setAuthor(i, { name: e.target.value })}
              className="w-full px-2 py-1.5 border border-chai-brown/20 rounded text-sm"
            />
            <input
              placeholder="Why similar (optional)"
              value={a.reason ?? ''}
              onChange={(e) => setAuthor(i, { reason: e.target.value })}
              className="w-full px-2 py-1.5 border border-chai-brown/20 rounded text-sm"
            />
            <input
              placeholder="Link (optional)"
              value={a.url ?? ''}
              onChange={(e) => setAuthor(i, { url: e.target.value })}
              className="w-full px-2 py-1.5 border border-chai-brown/20 rounded text-sm"
            />
          </div>
        ))}
      </div>
    </fieldset>
  );
}
