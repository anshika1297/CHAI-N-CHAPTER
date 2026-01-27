'use client';

import { useState, useEffect } from 'react';
import { Clock, Tag, User, BookOpen, Share2, Quote } from 'lucide-react';
import Image from 'next/image';

interface BlogDetailProps {
  slug: string;
}

// Dummy data - will be replaced with API data
const dummyPost = {
  id: '1',
  title: 'The Art of Slow Living: Finding Peace in Pages',
  content: `
    <p>In a world that moves at breakneck speed, there's something revolutionary about slowing down. This book, "The Art of Slow Living," found me at exactly the right moment—when I was drowning in deadlines and feeling disconnected from the simple joys of life.</p>
    
    <p>The author beautifully weaves together philosophy, personal anecdotes, and practical advice on how to embrace a slower pace. Each chapter feels like a gentle reminder to breathe, to notice, to appreciate.</p>
    
    <h2>What I Loved</h2>
    <p>The book doesn't preach or make you feel guilty for your busy life. Instead, it offers gentle invitations to slow down in small, meaningful ways. The chapter on mindful reading particularly resonated with me—the idea that reading isn't just about consuming words, but about creating space for reflection and connection.</p>
    
    <p>One of my favorite passages talks about how the act of reading itself is a form of slow living. When we read, we're forced to pause, to process, to imagine. We can't rush through a book the way we scroll through social media. There's something inherently meditative about turning pages and letting a story unfold at its own pace.</p>
    
    <h2>Key Takeaways</h2>
    <p>The book emphasizes that slow living isn't about doing less, but about doing things with intention and presence. It's about quality over quantity, depth over breadth. This philosophy has completely transformed how I approach my reading life.</p>
    
    <p>I've started setting aside dedicated reading time without distractions—no phone, no background noise, just me and the book. And you know what? It's made reading feel like a luxury again, not just another item on my to-do list.</p>
    
    <h2>Final Thoughts</h2>
    <p>If you're feeling overwhelmed, disconnected, or just craving a more intentional way of living, this book is a beautiful companion. It's not a quick fix, but rather a gentle guide toward a more mindful existence.</p>
    
    <p>Rating: 5/5 stars. This is a book I'll return to again and again, like visiting an old friend who always knows exactly what you need to hear.</p>
  `,
  excerpt: 'A beautiful meditation on slowing down and finding joy in the simple act of reading.',
  image: '',
  bookCover: '', // Book cover image
  categories: ['Book Review', 'Self-Help', 'Mindfulness'], // Multiple categories
  slug: 'art-of-slow-living',
  readingTime: 5,
  author: 'Anshika Mishra',
  bookTitle: 'The Art of Slow Living',
  bookAuthor: 'Marie Kondo',
  publishedAt: '2024-01-15',
  tags: ['Self-Help', 'Mindfulness', 'Lifestyle', 'Philosophy'],
  bookImages: [ // Additional book-related images (highlights, book stacks, etc.)
    '',
    '',
    '',
  ],
  // Category lists for different post types
  // For Book Reviews: ['Book Review', 'Fiction', 'Non-Fiction', 'Self-Help', 'Romance', 'Mystery', 'Thriller', 'Fantasy', 'Historical Fiction', 'Contemporary', 'Literary Fiction', 'Biography', 'Memoir', 'Philosophy', 'Mindfulness', 'Lifestyle']
  // For Recommendations: ['Book List', 'Weekly Wrap-Up', 'Monthly Wrap-Up', 'Yearly Wrap-Up', 'Genre Recommendations', 'Author Spotlight']
  // For Musings: ['Reflection', 'Short Story', 'Thoughts', 'Personal', 'Poetry', 'Random']
  highlights: [
    {
      id: '1',
      quote: "Reading isn't just about consuming words, but about creating space for reflection and connection.",
      page: 45,
      image: '',
    },
    {
      id: '2',
      quote: "Slow living isn't about doing less, but about doing things with intention and presence.",
      page: 120,
      image: '',
    },
    {
      id: '3',
      quote: "When we read, we're forced to pause, to process, to imagine. We can't rush through a book the way we scroll through social media.",
      page: 78,
      image: '',
    },
  ],
};

export default function BlogDetail({ slug }: BlogDetailProps) {
  const [readingProgress, setReadingProgress] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);

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

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = `${dummyPost.title} - ${dummyPost.bookTitle}`;
    
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
          className="h-full bg-terracotta transition-all duration-150"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <header className="mb-8">
          {/* Category Badges */}
          {dummyPost.categories && dummyPost.categories.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {dummyPost.categories.map((category) => (
                <span
                  key={category}
                  className="bg-terracotta text-cream text-xs font-sans px-3 py-1 rounded-full inline-flex items-center gap-1"
                >
                  <Tag size={12} />
                  {category}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-chai-brown mb-4 leading-tight">
            {dummyPost.title}
          </h1>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-chai-brown-light font-sans mb-6">
            <div className="flex items-center gap-2">
              <Clock size={14} />
              <span>{dummyPost.readingTime} min read</span>
            </div>
            <div className="flex items-center gap-2">
              <User size={14} />
              <span>{dummyPost.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen size={14} />
              <span className="italic">{dummyPost.bookTitle}</span>
              {dummyPost.bookAuthor && (
                <>
                  <span>by</span>
                  <span>{dummyPost.bookAuthor}</span>
                </>
              )}
            </div>
            <div className="text-xs">
              {new Date(dummyPost.publishedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          </div>

          {/* Share Button */}
          <div className="relative share-menu-container">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="flex items-center gap-2 text-terracotta hover:text-terracotta-dark font-sans text-sm font-medium transition-colors"
            >
              <Share2 size={16} />
              Share this review
            </button>

            {/* Share Menu Dropdown */}
            {showShareMenu && (
              <div className="absolute top-8 left-0 bg-cream border border-chai-brown/20 rounded-lg shadow-lg p-2 z-10 min-w-[150px]">
                <button
                  onClick={() => handleShare('threads')}
                  className="w-full text-left px-3 py-2 text-sm text-chai-brown hover:bg-cream-light rounded transition-colors"
                >
                  Threads
                </button>
                <button
                  onClick={() => handleShare('facebook')}
                  className="w-full text-left px-3 py-2 text-sm text-chai-brown hover:bg-cream-light rounded transition-colors"
                >
                  Facebook
                </button>
                <button
                  onClick={() => handleShare('whatsapp')}
                  className="w-full text-left px-3 py-2 text-sm text-chai-brown hover:bg-cream-light rounded transition-colors"
                >
                  WhatsApp
                </button>
                <button
                  onClick={() => handleShare('copy')}
                  className="w-full text-left px-3 py-2 text-sm text-chai-brown hover:bg-cream-light rounded transition-colors"
                >
                  Copy Link
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Book Cover Image */}
        {dummyPost.bookCover ? (
          <div className="w-full max-w-3xl mx-auto mb-8 rounded-2xl overflow-hidden shadow-xl">
            <div className="relative w-full flex justify-center items-center bg-cream-light p-4">
              <img
                src={dummyPost.bookCover}
                alt={`${dummyPost.bookTitle} cover`}
                className="max-w-full h-auto rounded-lg object-contain"
                style={{ maxHeight: '600px' }}
              />
            </div>
          </div>
        ) : (
          <div className="relative w-full max-w-md mx-auto mb-8 rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-chai-brown to-chai-brown-dark aspect-[3/4]">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center px-4">
                <span className="text-6xl mb-4 block">📖</span>
                <p className="font-serif text-lg text-cream/90 font-medium">{dummyPost.bookTitle}</p>
                {dummyPost.bookAuthor && (
                  <p className="font-body text-sm text-cream/70 mt-2">by {dummyPost.bookAuthor}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div
          className="blog-content max-w-none font-body text-chai-brown-light leading-relaxed mb-12"
          dangerouslySetInnerHTML={{ __html: dummyPost.content }}
        />

        {/* Highlights Section */}
        {dummyPost.highlights && dummyPost.highlights.length > 0 && (
          <section className="mb-12">
            <h2 className="font-serif text-2xl md:text-3xl text-chai-brown mb-6 flex items-center gap-2">
              <Quote size={24} className="text-terracotta" />
              Favorite Quotes & Highlights
            </h2>
            <div className="space-y-6">
              {dummyPost.highlights.map((highlight) => (
                <div
                  key={highlight.id}
                  className="bg-cream-light rounded-xl p-6 border-l-4 border-terracotta"
                >
                  <blockquote className="font-body text-lg text-chai-brown italic mb-3">
                    "{highlight.quote}"
                  </blockquote>
                  {highlight.page && (
                    <p className="text-xs text-chai-brown-light font-sans">
                      Page {highlight.page}
                    </p>
                  )}
                  {highlight.image && (
                    <div className="mt-4 relative aspect-[4/3] rounded-lg overflow-hidden max-w-md">
                      <Image
                        src={highlight.image}
                        alt="Highlight"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Book Images Gallery - Highlights and Related Images */}
        {dummyPost.bookImages && dummyPost.bookImages.some((img) => img) && (
          <section className="mb-12">
            <h2 className="font-serif text-2xl md:text-3xl text-chai-brown mb-6">
              Book Highlights & Images
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dummyPost.bookImages
                .filter((img) => img)
                .map((image, index) => (
                  <div
                    key={index}
                    className="relative aspect-[4/3] rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow"
                  >
                    <Image
                      src={image}
                      alt={`Book highlight ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              {/* Also include highlight images if they exist */}
              {dummyPost.highlights &&
                dummyPost.highlights
                  .filter((h) => h.image)
                  .map((highlight) => (
                    <div
                      key={`highlight-${highlight.id}`}
                      className="relative aspect-[4/3] rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow"
                    >
                      <Image
                        src={highlight.image!}
                        alt="Book highlight"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
            </div>
          </section>
        )}

        {/* Categories Section */}
        {dummyPost.categories && dummyPost.categories.length > 0 && (
          <section className="mb-6 pt-8 border-t border-chai-brown/10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-sans font-medium text-chai-brown mr-2">Categories:</span>
              {dummyPost.categories.map((category) => (
                <span
                  key={category}
                  className="bg-terracotta/10 text-terracotta text-xs font-sans px-3 py-1 rounded-full border border-terracotta/30 hover:bg-terracotta/20 transition-colors cursor-pointer"
                >
                  {category}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Tags Section */}
        {dummyPost.tags && dummyPost.tags.length > 0 && (
          <section className="mb-8 pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-sans font-medium text-chai-brown mr-2">Tags:</span>
              {dummyPost.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-cream-light text-chai-brown text-xs font-sans px-3 py-1 rounded-full border border-chai-brown/20 hover:border-terracotta transition-colors cursor-pointer"
                >
                  {tag}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Navigation to Next/Previous */}
        <div className="flex justify-between items-center pt-8 border-t border-chai-brown/10">
          <button className="text-terracotta font-sans text-sm hover:underline">
            ← Previous Review
          </button>
          <button className="text-terracotta font-sans text-sm hover:underline">
            Next Review →
          </button>
        </div>
      </div>
    </article>
  );
}
