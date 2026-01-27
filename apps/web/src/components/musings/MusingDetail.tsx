'use client';

import { useState, useEffect, useRef } from 'react';
import { Clock, Tag, User, Share2 } from 'lucide-react';

interface MusingDetailProps {
  slug: string;
}

// Dummy data - will be replaced with API data
const dummyMusing = {
  id: '1',
  title: 'The Art of Reading in Silence',
  content: `
    <p>In a world full of noise, there's something sacred about the quiet moments spent with a book. The way pages turn, the soft rustle, the complete immersion into another world—it's a form of meditation, really.</p>
    
    <p>I remember the first time I truly understood what it meant to read in silence. It was a rainy Sunday afternoon, and I had just picked up a book that had been sitting on my shelf for months. The house was quiet, the only sound being the gentle patter of rain against the window.</p>
    
    <p>As I opened the book, something shifted. The outside world faded away, and I found myself completely absorbed in the story. There were no notifications, no distractions, just me and the words on the page. It was in that moment that I realized reading isn't just about consuming information—it's about creating space for reflection, for imagination, for connection.</p>
    
    <h2>The Power of Quiet</h2>
    
    <p>In our fast-paced world, silence has become a luxury. We're constantly bombarded with information, with noise, with the need to be productive. But reading in silence reminds us that sometimes, the most productive thing we can do is to slow down, to be present, to simply be.</p>
    
    <p>When we read in silence, we're not just reading—we're creating. We're building worlds in our minds, connecting with characters, exploring ideas. It's an active process, even though it might look passive from the outside.</p>
    
    <h2>Finding Your Reading Space</h2>
    
    <p>Everyone has their own perfect reading space. For some, it's a cozy corner with a comfortable chair and good lighting. For others, it's a quiet café or a park bench. The important thing is finding a place where you can truly immerse yourself in the story.</p>
    
    <p>My reading space has evolved over the years. It started with a corner of my bedroom, then moved to a favorite chair by the window, and now it's wherever I can find a moment of quiet. The location doesn't matter as much as the intention—the decision to create space for reading, for reflection, for silence.</p>
    
    <p>So the next time you pick up a book, I encourage you to find a moment of silence. Turn off the notifications, find a quiet corner, and let yourself be fully present with the story. You might be surprised by what you discover in those quiet moments.</p>
  `,
  excerpt: 'In a world full of noise, there\'s something sacred about the quiet moments spent with a book.',
  coverImage: '',
  category: 'Reflection',
  slug: 'art-of-reading-in-silence',
  readingTime: 3,
  author: 'Anshika Mishra',
  publishedAt: '2024-01-22',
  categories: ['Reflection', 'Personal'],
  tags: ['Reading', 'Mindfulness', 'Quiet', 'Reflection', 'Books'],
};

export default function MusingDetail({ slug }: MusingDetailProps) {
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
    const text = `${dummyMusing.title}`;
    
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
          {dummyMusing.categories && dummyMusing.categories.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {dummyMusing.categories.map((category) => (
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
            {dummyMusing.title}
          </h1>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-chai-brown-light font-sans mb-6">
            <div className="flex items-center gap-2">
              <Clock size={14} />
              <span>{dummyMusing.readingTime} min read</span>
            </div>
            <div className="flex items-center gap-2">
              <User size={14} />
              <span>{dummyMusing.author}</span>
            </div>
            <div className="text-xs">
              {new Date(dummyMusing.publishedAt).toLocaleDateString('en-US', {
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
        {dummyMusing.coverImage ? (
          <div className="w-full max-w-3xl mx-auto mb-8 rounded-2xl overflow-hidden shadow-xl">
            <div className="relative w-full flex justify-center items-center bg-cream-light p-4">
              <img
                src={dummyMusing.coverImage}
                alt={dummyMusing.title}
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
                <p className="font-serif text-lg text-cream/90 font-medium">{dummyMusing.title}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div
          className="blog-content max-w-none font-body text-chai-brown-light leading-relaxed mb-12"
          dangerouslySetInnerHTML={{ __html: dummyMusing.content }}
        />

        {/* Categories Section */}
        {dummyMusing.categories && dummyMusing.categories.length > 0 && (
          <section className="mb-6 pt-8 border-t border-chai-brown/10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-sans font-medium text-chai-brown mr-2">Categories:</span>
              {dummyMusing.categories.map((category) => (
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
        {dummyMusing.tags && dummyMusing.tags.length > 0 && (
          <section className="mb-8 pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-sans font-medium text-chai-brown mr-2">Tags:</span>
              {dummyMusing.tags.map((tag) => (
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
