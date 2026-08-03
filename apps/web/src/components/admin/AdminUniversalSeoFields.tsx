'use client';

import ImageUploadField from '@/components/ImageUploadField';
import { formatTagsForInput, parseTagsInput, type UniversalSeoFields } from '@/lib/contentFields';

type Props = {
  value: UniversalSeoFields;
  onChange: (next: UniversalSeoFields) => void;
  imageModule: 'blog' | 'recommendations' | 'musings' | 'author-spotlight';
  /** Show canonical override (optional advanced field) */
  showCanonical?: boolean;
};

export default function AdminUniversalSeoFields({
  value,
  onChange,
  imageModule,
  showCanonical = true,
}: Props) {
  const set = (patch: Partial<UniversalSeoFields>) => onChange({ ...value, ...patch });

  return (
    <fieldset className="border border-chai-brown/15 rounded-lg p-4 space-y-3">
      <legend className="font-body text-sm font-medium text-chai-brown px-1">SEO &amp; discovery</legend>
      <p className="font-body text-xs text-chai-brown-light -mt-1">
        Overrides for search and social previews. Leave blank to use the main title and excerpt.
      </p>
      <div>
        <label className="block font-body text-xs font-medium text-chai-brown mb-1">SEO title</label>
        <input
          type="text"
          value={value.seoTitle ?? ''}
          onChange={(e) => set({ seoTitle: e.target.value })}
          placeholder="Custom title for Google / social (optional)"
          className="w-full px-3 py-2 border border-chai-brown/20 rounded-lg text-sm font-body"
        />
      </div>
      <div>
        <label className="block font-body text-xs font-medium text-chai-brown mb-1">Meta description</label>
        <textarea
          value={value.seoDescription ?? ''}
          onChange={(e) => set({ seoDescription: e.target.value })}
          placeholder="155–160 characters recommended"
          rows={2}
          className="w-full px-3 py-2 border border-chai-brown/20 rounded-lg text-sm font-body"
        />
      </div>
      <div>
        <label className="block font-body text-xs font-medium text-chai-brown mb-1">Tags</label>
        <textarea
          value={formatTagsForInput(value.tags)}
          onChange={(e) => set({ tags: parseTagsInput(e.target.value) })}
          placeholder="One per line or comma-separated (e.g. literary fiction, book review)"
          rows={3}
          className="w-full px-3 py-2 border border-chai-brown/20 rounded-lg text-sm font-body"
        />
      </div>
      <ImageUploadField
        module={imageModule}
        label="Social share image (optional)"
        value={value.socialShareImage ?? value.ogImage ?? ''}
        onChange={(url) => set({ socialShareImage: url, ogImage: url })}
      />
      <p className="font-body text-xs text-chai-brown-light -mt-1">
        Used for WhatsApp, LinkedIn, Facebook, and Twitter/X previews. When empty, cover image or a branded card is
        used automatically.
      </p>
      {showCanonical && (
        <div>
          <label className="block font-body text-xs font-medium text-chai-brown mb-1">Canonical URL override (optional)</label>
          <input
            type="text"
            value={value.canonicalUrl ?? ''}
            onChange={(e) => set({ canonicalUrl: e.target.value })}
            placeholder="/blog/my-slug or full https:// URL"
            className="w-full px-3 py-2 border border-chai-brown/20 rounded-lg text-sm font-body"
          />
        </div>
      )}
    </fieldset>
  );
}
