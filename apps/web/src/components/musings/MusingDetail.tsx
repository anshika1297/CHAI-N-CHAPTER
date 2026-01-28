'use client';

import { useState, useEffect, useRef } from 'react';
import { Clock, Tag, User, Share2 } from 'lucide-react';
import { getMusingBySlug, getImageUrl } from '@/lib/api';

interface MusingDetailProps {
  slug: string;
}

type ItemData = {
  title: string;
  content: string;
  excerpt: string;
  coverImage: string;
  category: string;
  slug: string;
  readingTime: number;
  author: string;
  publishedAt: string;
  categories: string[];
  tags: string[];
};

function normalizeItem(m: Record<string, unknown>): ItemData {
  const category = typeof m.category === 'string' ? m.category : '';
  return {
    title: String(m.title ?? '').trim(),
    content: typeof m.content === 'string' ? m.content : '',
    excerpt: typeof m.excerpt === 'string' ? m.excerpt : '',
    coverImage: typeof m.image === 'string' ? m.image : '',
    category,
    slug: String(m.slug ?? '').trim(),
    readingTime: typeof m.readingTime === 'number' ? m.readingTime : Number(m.readingTime) || 3,
    author: typeof m.author === 'string' ? m.author : '',
    publishedAt: typeof m.publishedAt === 'string' ? m.publishedAt : new Date().toISOString().slice(0, 10),
    categories: category ? [category] : [],
    tags: Array.isArray(m.seoKeywords) ? (m.seoKeywords as string[]).filter((s) => typeof s === 'string') : [],
  };
}

export default function MusingDetail({ slug }: MusingDetailProps) {
  const [item, setItem] = useState<ItemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getMusingBySlug(slug)
      .then(({ item: raw }) => setItem(normalizeItem(raw as Record<string, unknown>)))
      .catch((e) => {
        if (e instanceof Error && e.message === 'Musing not found') setNotFound(true);
        else setItem(null);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const progress = (scrollTop / (documentHeight - windowHeight)) * 100;
      setReadingProgress(Math.min(100, Math.max(0, progress)));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!showShareMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setShowShareMenu(false);
      }
    };

    // Add a small delay to prevent immediate closure
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showShareMenu]);

  const handleShare = (platform: string) => {
    if (!item) return;
    const url = window.location.href;
    const text = `${item.title}`;
    
    const shareUrls: Record<string, string> = {
      threads: `https://www.threads.net/intent/post?text=${encodeURIComponent(text + ' ' + url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
      copy: url,
    };

    if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      setShowShareMenu(false);
      // You could add a toast notification here
    } else {
      window.open(shareUrls[platform], '_blank');
      setShowShareMenu(false);
    }
  };

  if (loading) {
    return (
      <article className="pt-24 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="max-w-4xl mx-auto text-center py-16">
          <p className="font-body text-chai-brown-light">Loading…</p>
        </div>
      </article>
    );
  }

  if (notFound || !item) {
    return (
      <article className="pt-24 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="max-w-4xl mx-auto text-center py-16">
          <p className="font-body text-chai-brown-light">Musing not found.</p>
        </div>
      </article>
    );
  }

  return (
    <article className="pt-24 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 min-h-screen">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-cream/50 z-[60]">
        <div
          className="h-full bg-chai-brown-light transition-all duration-150"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <header className="mb-8 overflow-visible">
          {/* Category Badges */}
          {item.categories && item.categories.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {item.categories.map((category) => (
                <span
                  key={category}
                  className="bg-chai-brown-light text-cream text-xs font-sans px-3 py-1 rounded-full inline-flex items-center gap-1"
                >
                  <Tag size={12} />
                  {category}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-chai-brown mb-4 leading-tight">
            {item.title}
          </h1>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-chai-brown-light font-sans mb-6">
            <div className="flex items-center gap-2">
              <Clock size={14} />
              <span>{item.readingTime} min read</span>
            </div>
            <div className="flex items-center gap-2">
              <User size={14} />
              <span>{item.author}</span>
            </div>
            <div className="text-xs">
              {new Date(item.publishedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          </div>

          {/* Share Button */}
          <div className="relative share-menu-container inline-block" ref={shareMenuRef} style={{ zIndex: 100 }}>
            <button
              type="button"
              onClick={() => {
                setShowShareMenu(!showShareMenu);
              }}
              className="flex items-center gap-2 text-chai-brown-light hover:text-chai-brown font-sans text-sm font-medium transition-colors cursor-pointer select-none"
              style={{ pointerEvents: 'auto', userSelect: 'none' }}
            >
              <Share2 size={16} />
              Share this musing
            </button>

            {/* Share Menu Dropdown */}
            {showShareMenu && (
              <div 
                className="absolute top-full left-0 mt-2 bg-cream border border-chai-brown/20 rounded-lg shadow-xl p-2 z-[9999] min-w-[150px]"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleShare('threads');
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-chai-brown hover:bg-cream-light rounded transition-colors"
                >
                  Threads
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleShare('facebook');
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-chai-brown hover:bg-cream-light rounded transition-colors"
                >
                  Facebook
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
                  Copy Link
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Cover Image */}
        {item.coverImage ? (
          <div className="w-full max-w-3xl mx-auto mb-8 rounded-2xl overflow-hidden shadow-xl">
            <div className="relative w-full flex justify-center items-center bg-cream-light p-4">
              <img
                src={getImageUrl(item.coverImage)}
                alt={item.title}
                className="max-w-full h-auto rounded-lg object-contain"
                style={{ maxHeight: '600px' }}
              />
            </div>
          </div>
        ) : (
          <div className="w-full max-w-3xl mx-auto mb-8 rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-chai-brown-light to-chai-brown aspect-[16/9] relative">
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-center px-4">
                <span className="text-6xl mb-4 block leading-none">✨</span>
                <p className="font-serif text-lg text-cream/90 font-medium">{item.title}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div
          className="blog-content max-w-none font-body text-chai-brown-light leading-relaxed mb-12"
          dangerouslySetInnerHTML={{ __html: item.content }}
        />

        {/* Categories Section */}
        {item.categories && item.categories.length > 0 && (
          <section className="mb-6 pt-8 border-t border-chai-brown/10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-sans font-medium text-chai-brown mr-2">Categories:</span>
              {item.categories.map((category) => (
                <span
                  key={category}
                  className="bg-chai-brown-light/10 text-chai-brown-light text-xs font-sans px-3 py-1 rounded-full border border-chai-brown-light/30 hover:bg-chai-brown-light/20 transition-colors cursor-pointer"
                >
                  {category}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Tags Section */}
        {item.tags && item.tags.length > 0 && (
          <section className="mb-8 pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-sans font-medium text-chai-brown mr-2">Tags:</span>
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-cream-light text-chai-brown text-xs font-sans px-3 py-1 rounded-full border border-chai-brown/20 hover:border-chai-brown-light transition-colors cursor-pointer"
                >
                  {tag}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Navigation to Next/Previous */}
        <div className="flex justify-between items-center pt-8 border-t border-chai-brown/10">
          <button className="text-chai-brown-light font-sans text-sm hover:underline">
            ← Previous Musing
          </button>
          <button className="text-chai-brown-light font-sans text-sm hover:underline">
            Next Musing →
          </button>
        </div>
      </div>
    </article>
  );
}
