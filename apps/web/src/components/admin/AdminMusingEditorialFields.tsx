'use client';

import { formatTagsForInput, parseTagsInput, type MusingEditorialFields } from '@/lib/contentFields';

type Props = {
  value: MusingEditorialFields;
  onChange: (next: MusingEditorialFields) => void;
};

export default function AdminMusingEditorialFields({ value, onChange }: Props) {
  const set = (patch: Partial<MusingEditorialFields>) => onChange({ ...value, ...patch });

  return (
    <fieldset className="border border-sage/30 rounded-lg p-4 space-y-3">
      <legend className="font-body text-sm font-medium text-chai-brown px-1">Musing summary (AI / AEO)</legend>
      <div>
        <label className="block font-body text-xs font-medium text-chai-brown mb-1">Key takeaway</label>
        <textarea
          value={value.keyTakeaway ?? ''}
          onChange={(e) => set({ keyTakeaway: e.target.value })}
          rows={2}
          placeholder="The single idea a reader should remember"
          className="w-full px-3 py-2 border border-chai-brown/20 rounded-lg text-sm font-body"
        />
      </div>
      <div>
        <label className="block font-body text-xs font-medium text-chai-brown mb-1">Themes</label>
        <textarea
          value={formatTagsForInput(value.themes)}
          onChange={(e) => set({ themes: parseTagsInput(e.target.value) })}
          rows={2}
          placeholder="One per line: memory, identity, belonging…"
          className="w-full px-3 py-2 border border-chai-brown/20 rounded-lg text-sm font-body"
        />
      </div>
    </fieldset>
  );
}
