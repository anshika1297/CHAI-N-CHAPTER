'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Clock, User, Share2 } from 'lucide-react';
import { getMusingBySlug, getImageUrl, getMusings } from '@/lib/api';
import type { ReadNextItem } from '@/lib/readNext';
import { musingFieldsFromRaw, readTags } from '@/lib/contentFields';
import ContentTagList from '@/components/tags/ContentTagList';
import ReadNextNudgeAfter from '@/components/content/ReadNextNudgeAfter';
import ReadMoreSection from '@/components/blog/ReadMoreSection';
import ReadingPathTeaser from '@/components/reading-paths/ReadingPathTeaser';
import ContentBreadcrumbs from '@/components/content/ContentBreadcrumbs';
import CategoryLink from '@/components/content/CategoryLink';
import EditorialCrossLinks from '@/components/content/EditorialCrossLinks';
import { resolveGenreHubForCategory } from '@/lib/genres/resolveCategoryHref';
import CommentsSection from '@/components/comments/CommentsSection';
import ReaderReactions from '@/components/reactions/ReaderReactions';
import NewsletterInlineCta from '@/components/newsletter/NewsletterInlineCta';
import ContentFreshnessDates from '@/components/content/ContentFreshnessDates';

interface MusingDetailProps {
  slug: string;
  readNextItems?: ReadNextItem[];
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
  updatedAt?: string;
  updateHistory?: { at: string; reason: 'content' | 'publish' }[];
  categories: string[];
  tags: string[];
  keyTakeaway?: string;
  themes?: string[];
};

function normalizeItem(m: Record<string, unknown> | null | undefined): ItemData {
  if (!m || typeof m !== 'object') {
    return {
      title: '',
      content: '',
      excerpt: '',
      coverImage: '',
      category: '',
      slug: '',
      readingTime: 3,
      author: '',
      publishedAt: new Date().toISOString().slice(0, 10),
      categories: [],
      tags: [],
    };
  }
  const category = typeof m.category === 'string' ? m.category : '';
  const editorial = musingFieldsFromRaw(m);
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
    updatedAt: typeof m.updatedAt === 'string' ? m.updatedAt : undefined,
    updateHistory: Array.isArray(m.updateHistory) ? (m.updateHistory as ItemData['updateHistory']) : undefined,
    categories: category ? [category] : [],
    tags: readTags(m),
    ...editorial,
  };
}

export default function MusingDetail({ slug, readNextItems = [] }: MusingDetailProps) {
  const [item, setItem] = useState<ItemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [prevSlug, setPrevSlug] = useState<string | null>(null);
  const [nextSlug, setNextSlug] = useState<string | null>(null);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slug || typeof slug !== 'string' || !slug.trim()) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    getMusingBySlug(slug)
      .then(({ item: raw }) => {
        if (raw == null || typeof raw !== 'object') {
          setNotFound(true);
          return;
        }
        try {
          setItem(normalizeItem(raw as Record<string, unknown>));
        } catch {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    getMusings({ limit: 9999, sort: 'newest' })
      .then(({ items: list }) => {
        const slugs = (list as Record<string, unknown>[])
          .map((m) => (typeof m.slug === 'string' ? m.slug : ''))
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
      <article className="pt-24 pb-12 sm:pb-16 min-h-screen">
        <div className="site-container max-w-5xl text-center py-16">
          <p className="font-body text-chai-brown-light">Loading…</p>
        </div>
      </article>
    );
  }

  if (notFound || !item) {
    return (
      <article className="pt-24 pb-12 sm:pb-16 min-h-screen">
        <div className="site-container max-w-5xl text-center py-16">
          <p className="font-body text-chai-brown-light">Musing not found.</p>
        </div>
      </article>
    );
  }

  return (
    <article className="pt-24 pb-12 sm:pb-16 min-h-screen">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-cream/50 z-[60]">
        <div
          className="h-full bg-chai-brown-light transition-all duration-150"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <div className="site-container max-w-5xl">
        <ContentBreadcrumbs
          sectionLabel="Her Musings Verse"
          sectionHref="/musings"
          genreHub={
            item.categories[0]
              ? (() => {
                  const hub = resolveGenreHubForCategory(item.categories[0]);
                  return hub ? { label: hub.title, href: hub.href } : undefined;
                })()
              : undefined
          }
          title={item.title}
        />
        {/* Header Section */}
        <header className="mb-8 overflow-visible">
          {/* Category Badges */}
          {item.categories && item.categories.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {item.categories.map((category) => (
                <CategoryLink key={category} category={category} contentType="musings" style="pill" />
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
            <ContentFreshnessDates
              raw={{
                publishedAt: item.publishedAt,
                updatedAt: item.updatedAt,
                updateHistory: item.updateHistory,
              }}
            />
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

        <ReadNextNudgeAfter items={readNextItems} variant="musings" slotIndex={0} />

        {item.categories && item.categories.length > 0 && (
          <section className="mb-6 pt-8 border-t border-chai-brown/10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-sans font-medium text-chai-brown mr-2">Categories:</span>
              {item.categories.map((category) => (
                <CategoryLink key={category} category={category} contentType="musings" style="footer" />
              ))}
            </div>
          </section>
        )}

        <ContentTagList tags={item.tags} />

        <ReadNextNudgeAfter items={readNextItems} variant="musings" slotIndex={1} />
        <ReadNextNudgeAfter items={readNextItems} variant="musings" slotIndex={2} />

        <ReadingPathTeaser category={item.categories[0] ?? item.category} tags={item.tags} />
        <EditorialCrossLinks
          contentType="musings"
          category={item.categories[0] ?? item.category}
          tags={item.tags}
        />

        <NewsletterInlineCta variant="musing" placement="content-musing" contentSlug={slug} />
        <ReaderReactions contentType="musings" slug={slug} />
        <CommentsSection contentType="musings" slug={slug} />

        <ReadNextNudgeAfter items={readNextItems} variant="musings" slotIndex={3} />
        <ReadMoreSection variant="musings" items={readNextItems} />

        {/* Navigation to Next/Previous */}
        <div className="flex justify-between items-center pt-8 border-t border-chai-brown/10">
          {prevSlug ? (
            <Link href={`/musings/${prevSlug}`} className="text-chai-brown-light font-sans text-sm hover:underline">
              ← Previous Musing
            </Link>
          ) : (
            <span className="text-chai-brown-light/50 font-sans text-sm cursor-default">← Previous Musing</span>
          )}
          {nextSlug ? (
            <Link href={`/musings/${nextSlug}`} className="text-chai-brown-light font-sans text-sm hover:underline">
              Next Musing →
            </Link>
          ) : (
            <span className="text-chai-brown-light/50 font-sans text-sm cursor-default">Next Musing →</span>
          )}
        </div>
      </div>
    </article>
  );
}
