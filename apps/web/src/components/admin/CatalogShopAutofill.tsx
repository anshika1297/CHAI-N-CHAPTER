'use client';

import { useEffect, useRef, useState } from 'react';
import { BookMarked, Loader2, RefreshCw } from 'lucide-react';
import {
  catalogBookToAutofillPatch,
  lookupCatalogBookClient,
  type CatalogAutofillPatch,
} from '@/lib/books/lookup';
import type { CatalogBook } from '@/lib/books/catalog';
import type { ShopBookMeta, ShopPurchaseLink } from '@/lib/shop/types';
import { hasShopLinks } from '@/lib/shopLinks';

type Props = {
  title: string;
  author: string;
  shopLinks?: ShopPurchaseLink[];
  shopBook?: ShopBookMeta;
  bookLink?: string;
  coverImage?: string;
  /** Apply catalog fields into the parent form. */
  onApply: (patch: CatalogAutofillPatch) => void;
  className?: string;
};

/**
 * When title + author match a catalog book (with shop links from prior reviews /
 * lists / spotlights), autofill shop details so admins don't re-enter buy links.
 */
export default function CatalogShopAutofill({
  title,
  author,
  shopLinks,
  onApply,
  className = '',
}: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'found' | 'empty' | 'error'>('idle');
  const [match, setMatch] = useState<CatalogBook | null>(null);
  const appliedKeyRef = useRef('');
  const requestKeyRef = useRef('');

  useEffect(() => {
    const t = title.trim();
    const a = author.trim();
    if (t.length < 2 || a.length < 2) {
      setStatus('idle');
      setMatch(null);
      return;
    }

    const key = `${t.toLowerCase()}|${a.toLowerCase()}`;
    requestKeyRef.current = key;
    setStatus('loading');

    const timer = window.setTimeout(async () => {
      const book = await lookupCatalogBookClient(t, a);
      if (requestKeyRef.current !== key) return;
      if (!book) {
        setMatch(null);
        setStatus('empty');
        return;
      }
      setMatch(book);
      setStatus('found');

      const linkCount = (book.purchaseLinks ?? []).filter((l) => l.url?.trim()).length;
      // Auto-fill only when the form has no shop links yet (don't clobber edits).
      if (linkCount > 0 && !hasShopLinks(shopLinks) && appliedKeyRef.current !== key) {
        appliedKeyRef.current = key;
        onApply(catalogBookToAutofillPatch(book));
      }
    }, 450);

    return () => window.clearTimeout(timer);
    // Intentionally omit shopLinks/onApply from deps — we only re-lookup on title/author.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, author]);

  if (status === 'idle') return null;

  const linkCount = (match?.purchaseLinks ?? []).filter((l) => l.url?.trim()).length;
  const alreadyFilled = hasShopLinks(shopLinks);

  return (
    <div
      className={`rounded-lg border border-sage/30 bg-sage/5 px-3 py-2 font-body text-xs text-chai-brown ${className}`}
      role="status"
    >
      {status === 'loading' ? (
        <p className="flex items-center gap-2 text-chai-brown-light">
          <Loader2 size={14} className="animate-spin shrink-0" aria-hidden />
          Checking book catalog for shop links…
        </p>
      ) : null}

      {status === 'empty' ? (
        <p className="text-chai-brown-light">
          Not in the shop catalog yet — add buy links below (they’ll sync for next time).
        </p>
      ) : null}

      {status === 'error' ? (
        <p className="text-red-700">Couldn’t reach the book catalog. Try again in a moment.</p>
      ) : null}

      {status === 'found' && match ? (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="flex items-start gap-2 min-w-0">
            <BookMarked size={14} className="text-sage shrink-0 mt-0.5" aria-hidden />
            <span>
              Found in catalog: <strong className="font-medium">{match.title}</strong>
              {match.author ? <> by {match.author}</> : null}
              {linkCount > 0 ? (
                <>
                  {' '}
                  · {linkCount} shop link{linkCount === 1 ? '' : 's'}
                  {alreadyFilled && appliedKeyRef.current === `${title.trim().toLowerCase()}|${author.trim().toLowerCase()}`
                    ? ' (filled)'
                    : alreadyFilled
                      ? ' available'
                      : ' — filled automatically'}
                </>
              ) : (
                <> · no shop links saved yet</>
              )}
            </span>
          </p>
          {linkCount > 0 ? (
            <button
              type="button"
              onClick={() => {
                const key = `${title.trim().toLowerCase()}|${author.trim().toLowerCase()}`;
                appliedKeyRef.current = key;
                onApply(catalogBookToAutofillPatch(match));
              }}
              className="inline-flex items-center gap-1.5 shrink-0 rounded-md border border-sage/40 bg-white px-2.5 py-1 text-xs font-medium text-sage hover:bg-sage/10"
            >
              <RefreshCw size={12} aria-hidden />
              {alreadyFilled ? 'Replace from catalog' : 'Fill from catalog'}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
