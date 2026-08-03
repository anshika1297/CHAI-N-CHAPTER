'use client';

import type { AuthorConnectLinksDto } from '@/lib/api';
import { CONNECT_FIELD_META } from '@/lib/spotlightConnect';

type Props = {
  value: AuthorConnectLinksDto;
  onChange: (next: AuthorConnectLinksDto) => void;
};

export default function AdminAuthorConnectFields({ value, onChange }: Props) {
  const set = (key: keyof AuthorConnectLinksDto, url: string) => {
    onChange({ ...value, [key]: url });
  };

  return (
    <fieldset className="border border-chai-brown/15 rounded-lg p-4 space-y-3">
      <legend className="font-body text-sm font-medium text-chai-brown px-1">
        Connect with the author
      </legend>
      <p className="font-body text-xs text-chai-brown-light -mt-1">
        Structured links for the public Connect section and Person schema (sameAs). Leave blank to hide.
      </p>
      {CONNECT_FIELD_META.map(({ key, label }) => (
        <div key={key}>
          <label className="block font-body text-xs font-medium text-chai-brown mb-1">{label}</label>
          <input
            type="url"
            value={value[key] ?? ''}
            onChange={(e) => set(key, e.target.value)}
            placeholder="https://"
            className="w-full px-3 py-2 border border-chai-brown/20 rounded-lg text-sm font-body"
          />
        </div>
      ))}
    </fieldset>
  );
}
