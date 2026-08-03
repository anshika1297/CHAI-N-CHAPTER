'use client';

import { useEffect, useState } from 'react';
import { parseInternalContentUrl, fetchInternalLinkPreview } from '@/lib/resolveInternalLinkPreview';
import InternalLinkPreviewCard from './InternalLinkPreviewCard';

type Props = {
  url: string;
  title: string;
  onTitleChange?: (title: string) => void;
};

/** Admin: show a live preview card when the URL is an on-site blog / recommendations / musings link. */
export default function BlogSiteLinkPreviewField({ url, title, onTitleChange }: Props) {
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof fetchInternalLinkPreview>>>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = url.trim();
    if (!trimmed || !parseInternalContentUrl(trimmed)) {
      setPreview(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      fetchInternalLinkPreview(trimmed, title.trim())
        .then((data) => {
          if (cancelled) return;
          setPreview(data);
          if (data?.title && onTitleChange && !title.trim()) {
            onTitleChange(data.title);
          }
        })
        .catch(() => {
          if (!cancelled) setPreview(null);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [url, title]);

  if (!url.trim() || !parseInternalContentUrl(url)) return null;

  return (
    <div className="mt-2 w-full">
      {loading && !preview ? (
        <p className="font-body text-xs text-chai-brown-light animate-pulse">Loading link preview…</p>
      ) : null}
      {preview ? (
        <div className="max-w-md pointer-events-none opacity-95">
          <p className="font-body text-xs text-chai-brown-light mb-2">Preview (readers will see this card)</p>
          <InternalLinkPreviewCard preview={preview} />
        </div>
      ) : !loading ? (
        <p className="font-body text-xs text-amber-800">
          Could not load preview — check the slug exists and is published.
        </p>
      ) : null}
    </div>
  );
}
