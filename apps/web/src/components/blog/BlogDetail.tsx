'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, Tag, User, BookOpen, Share2, Quote, Star } from 'lucide-react';
import { getImageUrl, getBlogPostBySlug, getBlogPosts } from '@/lib/api';
import ReadMoreSection from './ReadMoreSection';

interface BlogDetailProps {
  slug: string;
}

type Highlight = { id: string; quote: string; page?: number; image?: string };
type PostData = {
  title: string;
  content: string;
  excerpt: string;
  image: string;
  bookCover: string;
  categories: string[];
  slug: string;
  readingTime: number;
  author: string;
  bookTitle: string;
  bookAuthor: string;
  /** Book rating 1–5 (optional). */
  rating?: number;
  /** URL for the book; book title links here when set. */
  bookLink?: string;
  /** URL for the author profile; author name links here when set. */
  authorLink?: string;
  publishedAt: string;
  tags: string[];
  bookImages: string[];
  highlights: Highlight[];
};

function normalizePost(p: Record<string, unknown>): PostData {
  const category = typeof p.category === 'string' ? p.category : '';
  const highlights = Array.isArray(p.highlights)
    ? (p.highlights as Record<string, unknown>[]).map((h) => ({
        id: String(h?.id ?? ''),
        quote: String(h?.quote ?? '').trim(),
        page: typeof h?.page === 'number' ? h.page : undefined,
        image: typeof h?.image === 'string' ? h.image : '',
      }))
    : [];
  return {
    title: String(p.title ?? '').trim(),
    content: typeof p.content === 'string' ? p.content : '',
    excerpt: typeof p.excerpt === 'string' ? p.excerpt : '',
    image: typeof p.image === 'string' ? p.image : '',
    bookCover: typeof p.image === 'string' ? p.image : '',
    categories: category ? [category] : [],
    slug: String(p.slug ?? '').trim(),
    readingTime: typeof p.readingTime === 'number' ? p.readingTime : Number(p.readingTime) || 5,
    author: typeof p.author === 'string' ? p.author : '',
    bookTitle: typeof p.bookTitle === 'string' ? p.bookTitle : '',
    bookAuthor: typeof p.bookAuthor === 'string' ? p.bookAuthor : '',
    rating: typeof p.rating === 'number' && p.rating >= 1 && p.rating <= 5 ? p.rating : undefined,
    bookLink: typeof p.bookLink === 'string' && p.bookLink.trim() ? p.bookLink.trim() : undefined,
    authorLink: typeof p.authorLink === 'string' && p.authorLink.trim() ? p.authorLink.trim() : undefined,
    publishedAt: typeof p.publishedAt === 'string' ? p.publishedAt : new Date().toISOString().slice(0, 10),
    tags: Array.isArray(p.seoKeywords) ? (p.seoKeywords as string[]).filter((s) => typeof s === 'string') : [],
    bookImages: [],
    highlights,
  };
}

export default function BlogDetail({ slug }: BlogDetailProps) {
  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [prevSlug, setPrevSlug] = useState<string | null>(null);
  const [nextSlug, setNextSlug] = useState<string | null>(null);

  useEffect(() => {
    getBlogPostBySlug(slug)
      .then(({ post: raw }) => {
        setPost(normalizePost(raw as Record<string, unknown>));
      })
      .catch((e) => {
        if (e instanceof Error && e.message === 'Post not found') setNotFound(true);
        else setPost(null);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    getBlogPosts({ limit: 9999, sort: 'newest' })
      .then(({ posts }) => {
        const slugs = (posts as Record<string, unknown>[])
          .map((p) => (typeof p.slug === 'string' ? p.slug : ''))
          .filter(Boolean);
        const idx = slugs.indexOf(slug);
        setPrevSlug(idx > 0 ? slugs[idx - 1] ?? null : null);
        setNextSlug(idx >= 0 && idx < slugs.length - 1 ? slugs[idx + 1] ?? null : null);
      })
      .catch(() => {});
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
    if (!post) return;
    const url = window.location.href;
    const text = `${post.title} - ${post.bookTitle}`;
    
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

  if (notFound || !post) {
    return (
      <article className="pt-24 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="max-w-4xl mx-auto text-center py-16">
          <p className="font-body text-chai-brown-light">Post not found.</p>
        </div>
      </article>
    );
  }

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
          {post.categories && post.categories.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {post.categories.map((category) => (
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
            {post.title}
          </h1>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-chai-brown-light font-sans mb-6">
            <div className="flex items-center gap-2">
              <Clock size={14} />
              <span>{post.readingTime} min read</span>
            </div>
            {post.rating != null && (
              <div className="flex items-center gap-2">
                <Star size={14} className="text-terracotta fill-terracotta" />
                <span>{post.rating}/5</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <User size={14} />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen size={14} />
              {post.bookTitle ? (
                post.bookLink ? (
                  <a
                    href={post.bookLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="italic text-terracotta hover:underline"
                  >
                    {post.bookTitle}
                  </a>
                ) : (
                  <span className="italic">{post.bookTitle}</span>
                )
              ) : null}
              {post.bookAuthor && (
                <>
                  <span>by</span>
                  {post.authorLink ? (
                    <a
                      href={post.authorLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-terracotta hover:underline"
                    >
                      {post.bookAuthor}
                    </a>
                  ) : (
                    <span>{post.bookAuthor}</span>
                  )}
                </>
              )}
            </div>
            <div className="text-xs">
              {new Date(post.publishedAt).toLocaleDateString('en-US', {
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
        {post.bookCover ? (
          <div className="w-full max-w-3xl mx-auto mb-8 rounded-2xl overflow-hidden shadow-xl">
            <div className="relative w-full flex justify-center items-center bg-cream-light p-4">
              <img
                src={getImageUrl(post.bookCover)}
                alt={`${post.bookTitle} cover`}
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
                <p className="font-serif text-lg text-cream/90 font-medium">
                  {post.bookTitle && post.bookLink ? (
                    <a
                      href={post.bookLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cream/90 hover:text-cream underline"
                    >
                      {post.bookTitle}
                    </a>
                  ) : (
                    post.bookTitle
                  )}
                </p>
                {post.bookAuthor && (
                  <p className="font-body text-sm text-cream/70 mt-2">
                    by{' '}
                    {post.authorLink ? (
                      <a
                        href={post.authorLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cream/70 hover:text-cream underline"
                      >
                        {post.bookAuthor}
                      </a>
                    ) : (
                      post.bookAuthor
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div
          className="blog-content max-w-none font-body text-chai-brown-light leading-relaxed mb-12"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Highlights Section */}
        {post.highlights && post.highlights.length > 0 && (
          <section className="mb-12">
            <h2 className="font-serif text-2xl md:text-3xl text-chai-brown mb-6 flex items-center gap-2">
              <Quote size={24} className="text-terracotta" />
              Favorite Quotes & Highlights
            </h2>
            <div className="space-y-6">
              {post.highlights.map((highlight) => (
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
                      <img
                        src={getImageUrl(highlight.image)}
                        alt="Highlight"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Book Images Gallery - Highlights and Related Images */}
        {post.bookImages && post.bookImages.some((img) => img) && (
          <section className="mb-12">
            <h2 className="font-serif text-2xl md:text-3xl text-chai-brown mb-6">
              Book Highlights & Images
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {post.bookImages
                .filter((img) => img)
                .map((image, index) => (
                  <div
                    key={index}
                    className="relative aspect-[4/3] rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow"
                  >
                    <img
                      src={getImageUrl(image)}
                      alt={`Book highlight ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              {post.highlights &&
                post.highlights
                  .filter((h) => h.image)
                  .map((highlight) => (
                    <div
                      key={`highlight-${highlight.id}`}
                      className="relative aspect-[4/3] rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow"
                    >
                      <img
                        src={getImageUrl(highlight.image!)}
                        alt="Book highlight"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
            </div>
          </section>
        )}

        {/* Categories Section */}
        {post.categories && post.categories.length > 0 && (
          <section className="mb-6 pt-8 border-t border-chai-brown/10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-sans font-medium text-chai-brown mr-2">Categories:</span>
              {post.categories.map((category) => (
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
        {post.tags && post.tags.length > 0 && (
          <section className="mb-8 pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-sans font-medium text-chai-brown mr-2">Tags:</span>
              {post.tags.map((tag) => (
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

        {/* Read next – random review cards */}
        <ReadMoreSection variant="blog" excludeSlug={slug} />

        {/* Navigation to Next/Previous */}
        <div className="flex justify-between items-center pt-8 border-t border-chai-brown/10">
          {prevSlug ? (
            <Link href={`/blog/${prevSlug}`} className="text-terracotta font-sans text-sm hover:underline">
              ← Previous Review
            </Link>
          ) : (
            <span className="text-terracotta/50 font-sans text-sm cursor-default">← Previous Review</span>
          )}
          {nextSlug ? (
            <Link href={`/blog/${nextSlug}`} className="text-terracotta font-sans text-sm hover:underline">
              Next Review →
            </Link>
          ) : (
            <span className="text-terracotta/50 font-sans text-sm cursor-default">Next Review →</span>
          )}
        </div>
      </div>
    </article>
  );
}
