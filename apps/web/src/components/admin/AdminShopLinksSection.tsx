'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import ShopLinksEditor from '@/components/admin/ShopLinksEditor';
import ShopBookMetaEditor from '@/components/admin/ShopBookMetaEditor';
import type { ShopBookMeta, ShopPurchaseLink } from '@/lib/shop/types';

type InheritHint = {
  title?: string;
  author?: string;
  genre?: string;
  coverImage?: string;
};

type Props = {
  value: ShopPurchaseLink[];
  onChange: (links: ShopPurchaseLink[]) => void;
  shopBook?: ShopBookMeta;
  onShopBookChange?: (meta: ShopBookMeta | undefined) => void;
  inheritHint?: InheritHint;
  shopPageHref?: string;
  className?: string;
};

export default function AdminShopLinksSection({
  value,
  onChange,
  shopBook,
  onShopBookChange,
  inheritHint,
  shopPageHref,
  className = '',
}: Props) {
  const count = value.filter((l) => l.label.trim() && l.url.trim()).length;

  return (
    <fieldset className={`border-2 border-sage/30 rounded-lg p-4 sm:p-5 bg-sage/5 ${className}`}>
      <legend className="font-body text-sm font-semibold text-chai-brown px-2 flex items-center gap-2">
        <ShoppingBag size={18} className="text-sage" aria-hidden />
        Where to buy — Shop page
      </legend>
      <p className="font-body text-xs text-chai-brown-light mb-4 -mt-1">
        These links appear on the public <strong>/shop</strong> page and the &quot;Where to buy&quot; button on the
        article. Use <strong>Goodreads</strong> in the field above (or add a Goodreads row here). Add Amazon India, UAE,
        publisher, etc.
      </p>
      <ShopLinksEditor value={value} onChange={onChange} />
      {onShopBookChange ? (
        <ShopBookMetaEditor
          className="mt-4"
          value={shopBook}
          onChange={onShopBookChange}
          inheritHint={inheritHint}
        />
      ) : null}
      {shopPageHref && count > 0 ? (
        <p className="mt-3 font-body text-xs">
          <Link href={shopPageHref} target="_blank" rel="noopener noreferrer" className="text-sage font-medium hover:underline">
            Preview shop page ({count} link{count === 1 ? '' : 's'}) →
          </Link>
        </p>
      ) : null}
    </fieldset>
  );
}
