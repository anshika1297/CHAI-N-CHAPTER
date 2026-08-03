'use client';

import { Plus, Trash2 } from 'lucide-react';
import { SHOP_LINK_PRESETS, defaultLabelForChannel, presetLink } from '@/lib/shop/channels';
import { parseShopLinkChannel } from '@/lib/shop/sanitize';
import type { ShopLinkChannel, ShopPurchaseLink } from '@/lib/shop/types';

export default function ShopLinksEditor({
  value,
  onChange,
  className = '',
}: {
  value: ShopPurchaseLink[];
  onChange: (links: ShopPurchaseLink[]) => void;
  className?: string;
}) {
  const links = value.length ? value : [];

  const update = (index: number, patch: Partial<ShopPurchaseLink>) => {
    onChange(links.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  };

  const addPreset = (channel: ShopLinkChannel) => {
    onChange([...links, presetLink(channel)]);
  };

  return (
    <div className={className}>
      <p className="text-xs text-chai-brown-light mb-2">
        Shown on <strong>/shop</strong>. Add any number — Amazon India, UAE, publisher, Goodreads, etc.
      </p>
      <div className="flex flex-wrap gap-2 mb-3">
        {SHOP_LINK_PRESETS.map((p) => (
          <button
            key={p.channel}
            type="button"
            onClick={() => addPreset(p.channel)}
            className="text-xs font-body px-2.5 py-1 rounded-full border border-sage/40 text-sage hover:bg-sage/10 transition-colors"
          >
            + {p.label}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {links.map((link, i) => {
          const channel = parseShopLinkChannel(link.channel) ?? 'other';
          return (
            <div key={i} className="flex flex-wrap gap-2 items-start border border-chai-brown/10 rounded-lg p-3 bg-cream/50">
              <select
                value={channel}
                onChange={(e) => {
                  const ch = e.target.value as ShopLinkChannel;
                  const label =
                    !link.label.trim() || link.label === defaultLabelForChannel(channel)
                      ? defaultLabelForChannel(ch)
                      : link.label;
                  update(i, { channel: ch, label });
                }}
                className="px-2 py-2 border border-chai-brown/20 rounded-lg font-body text-sm bg-white"
                aria-label="Link type"
              >
                <option value="amazon-in">Amazon India</option>
                <option value="amazon-uae">Amazon UAE</option>
                <option value="publisher">Publisher</option>
                <option value="goodreads">Goodreads</option>
                <option value="flipkart">Flipkart</option>
                <option value="other">Other</option>
              </select>
              <input
                type="text"
                value={link.label}
                onChange={(e) => update(i, { label: e.target.value })}
                placeholder="Label (e.g. Amazon — Paperback)"
                className="flex-1 min-w-[140px] px-3 py-2 border border-chai-brown/20 rounded-lg font-body text-sm"
              />
              <input
                type="url"
                value={link.url}
                onChange={(e) => update(i, { url: e.target.value })}
                placeholder="https://…"
                className="flex-[2] min-w-[200px] px-3 py-2 border border-chai-brown/20 rounded-lg font-body text-sm"
              />
              <button
                type="button"
                onClick={() => onChange(links.filter((_, idx) => idx !== i))}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
                aria-label="Remove"
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => onChange([...links, { label: '', url: '', channel: 'other' }])}
        className="mt-2 flex items-center gap-1 text-terracotta text-sm font-body hover:underline"
      >
        <Plus size={16} /> Add shop link
      </button>
    </div>
  );
}
