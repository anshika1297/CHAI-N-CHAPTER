'use client';

import { Plus, Trash2 } from 'lucide-react';
import type { ContentFaqItem, RecommendationEditorialFields } from '@/lib/contentFields';

type Props = {
  value: RecommendationEditorialFields;
  onChange: (next: RecommendationEditorialFields) => void;
};

const emptyFaq = (): ContentFaqItem => ({ question: '', answer: '' });

export default function AdminRecommendationEditorialFields({ value, onChange }: Props) {
  const set = (patch: Partial<RecommendationEditorialFields>) => onChange({ ...value, ...patch });
  const faq = value.faq ?? [];

  const setFaq = (i: number, patch: Partial<ContentFaqItem>) => {
    const next = [...faq];
    next[i] = { ...next[i], ...patch };
    set({ faq: next });
  };

  return (
    <fieldset className="border border-sage/30 rounded-lg p-4 space-y-3">
      <legend className="font-body text-sm font-medium text-chai-brown px-1">List summary (AI / AEO)</legend>
      <div>
        <label className="block font-body text-xs font-medium text-chai-brown mb-1">Who is this list for?</label>
        <textarea
          value={value.whoIsThisListFor ?? ''}
          onChange={(e) => set({ whoIsThisListFor: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-chai-brown/20 rounded-lg text-sm font-body"
        />
      </div>
      <div>
        <label className="block font-body text-xs font-medium text-chai-brown mb-1">Quick answer</label>
        <textarea
          value={value.quickAnswer ?? ''}
          onChange={(e) => set({ quickAnswer: e.target.value })}
          rows={2}
          placeholder="One paragraph answer: what this list covers and why it matters"
          className="w-full px-3 py-2 border border-chai-brown/20 rounded-lg text-sm font-body"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="font-body text-xs font-medium text-chai-brown">FAQ</label>
          <button type="button" onClick={() => set({ faq: [...faq, emptyFaq()] })} className="flex items-center gap-1 text-xs text-terracotta font-body">
            <Plus size={14} /> Add Q&amp;A
          </button>
        </div>
        {faq.map((item, i) => (
          <div key={i} className="mb-3 p-3 bg-cream/50 rounded-lg border border-chai-brown/10 space-y-2">
            <div className="flex justify-end">
              <button type="button" onClick={() => set({ faq: faq.filter((_, j) => j !== i) })} className="text-red-600">
                <Trash2 size={14} />
              </button>
            </div>
            <input
              placeholder="Question"
              value={item.question}
              onChange={(e) => setFaq(i, { question: e.target.value })}
              className="w-full px-2 py-1.5 border border-chai-brown/20 rounded text-sm"
            />
            <textarea
              placeholder="Answer"
              value={item.answer}
              onChange={(e) => setFaq(i, { answer: e.target.value })}
              rows={2}
              className="w-full px-2 py-1.5 border border-chai-brown/20 rounded text-sm"
            />
          </div>
        ))}
      </div>
    </fieldset>
  );
}
