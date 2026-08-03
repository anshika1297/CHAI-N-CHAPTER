'use client';

import { useEffect, useRef, useState } from 'react';
import { Share2 } from 'lucide-react';

type Props = {
  authorName: string;
  tagline?: string;
};

export default function AuthorSpotlightShare({ authorName, tagline }: Props) {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showShareMenu && !target.closest('.share-menu-container')) {
        setShowShareMenu(false);
      }
    };

    if (showShareMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showShareMenu]);

  const shareText = tagline?.trim()
    ? `Author spotlight: ${authorName} — ${tagline.trim()}`
    : `Author spotlight: ${authorName}`;

  const handleShare = (platform: string) => {
    const url = window.location.href;

    if (platform === 'instagram') {
      void navigator.clipboard.writeText(`${shareText}\n${url}`);
      setShowShareMenu(false);
      return;
    }

    if (platform === 'copy') {
      void navigator.clipboard.writeText(url);
      setShowShareMenu(false);
      return;
    }

    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`, '_blank');
      setShowShareMenu(false);
    }
  };

  return (
    <div className="relative share-menu-container inline-block mt-5" ref={shareMenuRef}>
      <button
        type="button"
        onClick={() => setShowShareMenu(!showShareMenu)}
        className="inline-flex items-center gap-2 text-terracotta hover:text-terracotta-dark font-sans text-sm font-medium transition-colors cursor-pointer select-none"
      >
        <Share2 size={16} aria-hidden />
        Share this spotlight
      </button>

      {showShareMenu ? (
        <div
          className="absolute top-full left-0 mt-2 bg-cream border border-chai-brown/20 rounded-lg shadow-xl p-2 z-[9999] min-w-[150px]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleShare('instagram');
            }}
            className="w-full text-left px-3 py-2 text-sm text-chai-brown hover:bg-cream-light rounded transition-colors"
          >
            Instagram
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleShare('whatsapp');
            }}
            className="w-full text-left px-3 py-2 text-sm text-chai-brown hover:bg-cream-light rounded transition-colors"
          >
            WhatsApp
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleShare('copy');
            }}
            className="w-full text-left px-3 py-2 text-sm text-chai-brown hover:bg-cream-light rounded transition-colors"
          >
            Copy link
          </button>
        </div>
      ) : null}
    </div>
  );
}
