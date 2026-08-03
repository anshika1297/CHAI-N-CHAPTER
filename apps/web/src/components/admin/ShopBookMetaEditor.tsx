'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { ShopBookMeta } from '@/lib/shop/types';
import { suggestBookSlug } from '@/lib/shop/slugify';

type InheritHint = {
  title?: string;
  author?: string;
  genre?: string;
  coverImage?: string;
};

export default function ShopBookMetaEditor({
  value,
  onChange,
  inheritHint,
  className = '',
}: {
  value?: ShopBookMeta;
  onChange: (meta: ShopBookMeta | undefined) => void;
  inheritHint?: InheritHint;
  className?: string;
}) {
  const [open, setOpen] = useState(Boolean(value && Object.keys(value).length));
  const meta = value ?? {};

  const patch = (p: Partial<ShopBookMeta>) => {
    const next = { ...meta, ...p };
    const cleaned = Object.fromEntries(
      Object.entries(next).filter(([, v]) => typeof v === 'string' && v.trim())
    ) as ShopBookMeta;
    onChange(Object.keys(cleaned).length ? cleaned : undefined);
  };

  const hint = (field: keyof InheritHint) => {
    const v = inheritHint?.[field];
    return v ? `Inherits: ${v}` : 'Optional — uses review/list fields when blank';
  };

  return (
    <div className={`border border-chai-brown/15 rounded-lg bg-cream/30 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left font-body text-sm font-medium text-chai-brown hover:bg-cream/50 rounded-lg transition-colors"
      >
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        Shop book details (optional)
      </button>
      {open ? (
        <div className="px-4 pb-4 pt-0 grid gap-3 sm:grid-cols-2 border-t border-chai-brown/10">
          <p className="sm:col-span-2 text-xs text-chai-brown-light -mt-1">
            Override title, cover, or ISBN for the shop page. Leave blank to use the fields above.{' '}
            <strong>Book slug</strong> is reserved for a future <code className="text-xs">/books/[slug]</code> page.
          </p>
          <div>
            <label className="block text-xs font-medium text-chai-brown mb-1">Book title</label>
            <input
              type="text"
              value={meta.title ?? ''}
              onChange={(e) => patch({ title: e.target.value })}
              placeholder={hint('title')}
              className="w-full px-3 py-2 border border-chai-brown/20 rounded-lg font-body text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-chai-brown mb-1">Author</label>
            <input
              type="text"
              value={meta.author ?? ''}
              onChange={(e) => patch({ author: e.target.value })}
              placeholder={hint('author')}
              className="w-full px-3 py-2 border border-chai-brown/20 rounded-lg font-body text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-chai-brown mb-1">Genre</label>
            <input
              type="text"
              value={meta.genre ?? ''}
              onChange={(e) => patch({ genre: e.target.value })}
              placeholder={hint('genre')}
              className="w-full px-3 py-2 border border-chai-brown/20 rounded-lg font-body text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-chai-brown mb-1">ISBN</label>
            <input
              type="text"
              value={meta.isbn ?? ''}
              onChange={(e) => patch({ isbn: e.target.value })}
              placeholder="978… or 10-digit ISBN"
              className="w-full px-3 py-2 border border-chai-brown/20 rounded-lg font-body text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-chai-brown mb-1">Cover image URL</label>
            <input
              type="text"
              value={meta.coverImage ?? ''}
              onChange={(e) => patch({ coverImage: e.target.value })}
              placeholder={hint('coverImage')}
              className="w-full px-3 py-2 border border-chai-brown/20 rounded-lg font-body text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-chai-brown mb-1">Book slug (advanced)</label>
            <input
              type="text"
              value={meta.bookSlug ?? ''}
              onChange={(e) => patch({ bookSlug: e.target.value })}
              placeholder={
                inheritHint?.title
                  ? `Auto: ${suggestBookSlug(inheritHint.title, inheritHint.author)}`
                  : 'future /books/[slug]'
              }
              className="w-full px-3 py-2 border border-chai-brown/20 rounded-lg font-body text-sm font-mono text-xs"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
