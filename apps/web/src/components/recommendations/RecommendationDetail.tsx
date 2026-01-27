'use client';

import { useState, useEffect, useRef } from 'react';
import { Clock, Tag, User, Share2, Star, BookOpen } from 'lucide-react';
import Image from 'next/image';

interface RecommendationDetailProps {
  slug: string;
}

// Dummy data - will be replaced with API data
const dummyRecommendation = {
  id: '1',
  title: 'Cozy Winter Reads: Books to Curl Up With',
  intro: 'As the temperature drops, there\'s nothing better than a warm blanket, hot chai, and these cozy reads that feel like a warm hug. From heartwarming romances to atmospheric mysteries, these books are perfect companions for those long winter evenings.',
  coverImage: '',
  category: 'Book List',
  slug: 'cozy-winter-reads',
  readingTime: 6,
  author: 'Anshika Mishra',
  publishedAt: '2024-01-20',
  categories: ['Book List', 'Winter Reads', 'Cozy Fiction'],
  tags: ['Winter', 'Cozy', 'Romance', 'Fiction', 'Comfort Reads'],
  conclusion: 'These books have been my companions through many winter evenings, and I hope they bring you the same warmth and comfort. Whether you\'re looking for a heartwarming romance or a cozy mystery, there\'s something here for every reader. Happy reading!',
  books: [
    {
      id: '1',
      title: 'The Seven Husbands of Evelyn Hugo',
      author: 'Taylor Jenkins Reid',
      image: '',
      rating: 5,
      description: 'This book completely swept me away! The glamour of old Hollywood, the complex characters, and the beautiful storytelling made it impossible to put down. Evelyn Hugo is one of the most compelling characters I\'ve ever read about.',
    },
    {
      id: '2',
      title: 'The Little Book of Hygge',
      author: 'Meik Wiking',
      image: '',
      rating: 4,
      description: 'Perfect for understanding the Danish concept of coziness and contentment. This book taught me to appreciate the small moments and create warmth in everyday life. A beautiful reminder to slow down and enjoy the simple pleasures.',
    },
    {
      id: '3',
      title: 'The Thursday Murder Club',
      author: 'Richard Osman',
      image: '',
      rating: 5,
      description: 'A delightful cozy mystery with charming characters and witty humor. The retirement village setting and the quirky group of amateur detectives made this such a fun read. It\'s clever, heartwarming, and impossible not to love.',
    },
    {
      id: '4',
      title: 'The Midnight Library',
      author: 'Matt Haig',
      image: '',
      rating: 4,
      description: 'A thought-provoking exploration of life\'s infinite possibilities. This book made me reflect on my own choices and appreciate the life I have. Beautifully written with a message that stays with you long after you finish reading.',
    },
  ],
};

export default function RecommendationDetail({ slug }: RecommendationDetailProps) {
  const [readingProgress, setReadingProgress] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);

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
    const url = window.location.href;
    const text = `${dummyRecommendation.title}`;
    
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
          {dummyRecommendation.categories && dummyRecommendation.categories.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {dummyRecommendation.categories.map((category) => (
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
            {dummyRecommendation.title}
          </h1>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-chai-brown-light font-sans mb-6">
            <div className="flex items-center gap-2">
              <Clock size={14} />
              <span>{dummyRecommendation.readingTime} min read</span>
            </div>
            <div className="flex items-center gap-2">
              <User size={14} />
              <span>{dummyRecommendation.author}</span>
            </div>
            <div className="text-xs">
              {new Date(dummyRecommendation.publishedAt).toLocaleDateString('en-US', {
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
        {dummyRecommendation.coverImage ? (
          <div className="w-full max-w-3xl mx-auto mb-8 rounded-2xl overflow-hidden shadow-xl">
            <div className="relative w-full flex justify-center items-center bg-cream-light p-4">
              <img
                src={dummyRecommendation.coverImage}
                alt={dummyRecommendation.title}
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
                <p className="font-serif text-lg text-cream/90 font-medium">{dummyRecommendation.title}</p>
              </div>
            </div>
          </div>
        )}

        {/* Introduction */}
        {dummyRecommendation.intro && (
          <div className="mb-12">
            <p className="font-body text-lg text-chai-brown-light leading-relaxed">
              {dummyRecommendation.intro}
            </p>
          </div>
        )}

        {/* Books List */}
        {dummyRecommendation.books && dummyRecommendation.books.length > 0 && (
          <section className="mb-12">
            <h2 className="font-serif text-2xl md:text-3xl text-chai-brown mb-8 flex items-center gap-2">
              <BookOpen size={24} className="text-sage" />
              Books in This List
            </h2>
            <div className="space-y-8">
              {dummyRecommendation.books.map((book, index) => (
                <div
                  key={book.id}
                  className="bg-cream-light rounded-xl p-6 sm:p-8 border-l-4 border-sage"
                >
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Book Image */}
                    <div className="flex-shrink-0">
                      {book.image ? (
                        <div className="relative w-32 sm:w-40 aspect-[3/4] rounded-lg overflow-hidden shadow-md">
                          <Image
                            src={book.image}
                            alt={`${book.title} cover`}
                            fill
                            className="object-cover"
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
        {dummyRecommendation.conclusion && (
          <section className="mb-12">
            <div className="bg-cream-light rounded-xl p-6 sm:p-8 border-l-4 border-sage">
              <h3 className="font-serif text-xl text-chai-brown mb-4">Final Thoughts</h3>
              <p className="font-body text-base text-chai-brown-light leading-relaxed">
                {dummyRecommendation.conclusion}
              </p>
            </div>
          </section>
        )}

        {/* Categories Section */}
        {dummyRecommendation.categories && dummyRecommendation.categories.length > 0 && (
          <section className="mb-6 pt-8 border-t border-chai-brown/10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-sans font-medium text-chai-brown mr-2">Categories:</span>
              {dummyRecommendation.categories.map((category) => (
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
        {dummyRecommendation.tags && dummyRecommendation.tags.length > 0 && (
          <section className="mb-8 pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-sans font-medium text-chai-brown mr-2">Tags:</span>
              {dummyRecommendation.tags.map((tag) => (
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
