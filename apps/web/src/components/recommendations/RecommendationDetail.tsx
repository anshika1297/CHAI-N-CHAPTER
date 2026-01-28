'use client';

import { useState, useEffect, useRef } from 'react';
import { Clock, Tag, User, Share2, Star, BookOpen } from 'lucide-react';
import { getRecommendationBySlug, getImageUrl } from '@/lib/api';

interface RecommendationDetailProps {
  slug: string;
}

type BookItem = { id: string; title: string; author: string; image: string; rating: number; description: string };
type ItemData = {
  title: string;
  intro: string;
  coverImage: string;
  category: string;
  slug: string;
  readingTime: number;
  author: string;
  publishedAt: string;
  categories: string[];
  tags: string[];
  conclusion: string;
  books: BookItem[];
};

function normalizeItem(r: Record<string, unknown>): ItemData {
  const category = typeof r.category === 'string' ? r.category : '';
  const books = Array.isArray(r.books)
    ? (r.books as Record<string, unknown>[]).map((b) => ({
        id: String(b?.id ?? ''),
        title: String(b?.title ?? '').trim(),
        author: String(b?.author ?? '').trim(),
        image: typeof b?.image === 'string' ? b.image : '',
        rating: typeof b?.rating === 'number' ? b.rating : Number(b?.rating) || 0,
        description: String(b?.description ?? '').trim(),
      }))
    : [];
  return {
    title: String(r.title ?? '').trim(),
    intro: typeof r.intro === 'string' ? r.intro : '',
    coverImage: typeof r.image === 'string' ? r.image : '',
    category,
    slug: String(r.slug ?? '').trim(),
    readingTime: typeof r.readingTime === 'number' ? r.readingTime : Number(r.readingTime) || 5,
    author: typeof r.author === 'string' ? r.author : '',
    publishedAt: typeof r.publishedAt === 'string' ? r.publishedAt : new Date().toISOString().slice(0, 10),
    categories: category ? [category] : [],
    tags: Array.isArray(r.seoKeywords) ? (r.seoKeywords as string[]).filter((s) => typeof s === 'string') : [],
    conclusion: typeof r.conclusion === 'string' ? r.conclusion : '',
    books,
  };
}

export default function RecommendationDetail({ slug }: RecommendationDetailProps) {
  const [item, setItem] = useState<ItemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getRecommendationBySlug(slug)
      .then(({ item: raw }) => setItem(normalizeItem(raw as Record<string, unknown>)))
      .catch((e) => {
        if (e instanceof Error && e.message === 'Recommendation not found') setNotFound(true);
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

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        size={16}
        className={index < rating ? 'fill-sage text-sage' : 'fill-none text-chai-brown-light'}
      />
    ));
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
          <p className="font-body text-chai-brown-light">Recommendation not found.</p>
        </div>
      </article>
    );
  }

  return (
    <article className="pt-24 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 min-h-screen">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-cream/50 z-[60]">
        <div
          className="h-full bg-sage transition-all duration-150"
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
                  className="bg-sage text-cream text-xs font-sans px-3 py-1 rounded-full inline-flex items-center gap-1"
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
                console.log('Share button clicked! Current state:', showShareMenu);
                setShowShareMenu(!showShareMenu);
              }}
              className="flex items-center gap-2 text-sage hover:text-sage-dark font-sans text-sm font-medium transition-colors cursor-pointer select-none"
              style={{ pointerEvents: 'auto', userSelect: 'none' }}
            >
              <Share2 size={16} />
              Share this list
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
          <div className="w-full max-w-3xl mx-auto mb-8 rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-sage to-sage-dark aspect-[16/9] relative">
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-center px-4">
                <span className="text-6xl mb-4 block leading-none">📚</span>
                <p className="font-serif text-lg text-cream/90 font-medium">{item.title}</p>
              </div>
            </div>
          </div>
        )}

        {/* Introduction */}
        {item.intro && (
          <div className="mb-12">
            <p className="font-body text-lg text-chai-brown-light leading-relaxed">
              {item.intro}
            </p>
          </div>
        )}

        {/* Books List */}
        {item.books && item.books.length > 0 && (
          <section className="mb-12">
            <h2 className="font-serif text-2xl md:text-3xl text-chai-brown mb-8 flex items-center gap-2">
              <BookOpen size={24} className="text-sage" />
              Books in This List
            </h2>
            <div className="space-y-8">
              {item.books.map((book) => (
                <div
                  key={book.id}
                  className="bg-cream-light rounded-xl p-6 sm:p-8 border-l-4 border-sage"
                >
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Book Image */}
                    <div className="flex-shrink-0">
                      {book.image ? (
                        <div className="relative w-32 sm:w-40 aspect-[3/4] rounded-lg overflow-hidden shadow-md">
                          <img
                            src={getImageUrl(book.image)}
                            alt={`${book.title} cover`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="relative w-32 sm:w-40 aspect-[3/4] rounded-lg overflow-hidden shadow-md bg-gradient-to-br from-chai-brown to-chai-brown-dark">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-4xl leading-none">📖</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Book Details */}
                    <div className="flex-1">
                      <div className="mb-3">
                        <h3 className="font-serif text-xl sm:text-2xl text-chai-brown mb-1">
                          {book.title}
                        </h3>
                        <p className="font-body text-sm text-chai-brown-light italic">
                          by {book.author}
                        </p>
                      </div>

                      {/* Rating */}
                      {book.rating && (
                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex items-center gap-1">
                            {renderStars(book.rating)}
                          </div>
                          <span className="text-xs text-chai-brown-light font-sans">
                            {book.rating}/5
                          </span>
                        </div>
                      )}

                      {/* Description */}
                      {book.description && (
                        <p className="font-body text-base text-chai-brown-light leading-relaxed">
                          {book.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Conclusion */}
        {item.conclusion && (
          <section className="mb-12">
            <div className="bg-cream-light rounded-xl p-6 sm:p-8 border-l-4 border-sage">
              <h3 className="font-serif text-xl text-chai-brown mb-4">Final Thoughts</h3>
              <p className="font-body text-base text-chai-brown-light leading-relaxed">
                {item.conclusion}
              </p>
            </div>
          </section>
        )}

        {/* Categories Section */}
        {item.categories && item.categories.length > 0 && (
          <section className="mb-6 pt-8 border-t border-chai-brown/10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-sans font-medium text-chai-brown mr-2">Categories:</span>
              {item.categories.map((category) => (
                <span
                  key={category}
                  className="bg-sage/10 text-sage text-xs font-sans px-3 py-1 rounded-full border border-sage/30 hover:bg-sage/20 transition-colors cursor-pointer"
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
                  className="bg-cream-light text-chai-brown text-xs font-sans px-3 py-1 rounded-full border border-chai-brown/20 hover:border-sage transition-colors cursor-pointer"
                >
                  {tag}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Navigation to Next/Previous */}
        <div className="flex justify-between items-center pt-8 border-t border-chai-brown/10">
          <button className="text-sage font-sans text-sm hover:underline">
            ← Previous List
          </button>
          <button className="text-sage font-sans text-sm hover:underline">
            Next List →
          </button>
        </div>
      </div>
    </article>
  );
}
