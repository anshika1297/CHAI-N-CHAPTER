'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { Clock, User, Share2, Star, BookOpen } from 'lucide-react';
import { getRecommendationBySlug, getImageUrl, getRecommendations } from '@/lib/api';
import { listBookGoodreadsLink, recommendationHasShopLinks, resolveListBookShopLinks, shopPath } from '@/lib/shopLinks';
import ShopWhereToBuyCta from '@/components/shop/ShopWhereToBuyCta';
import ReadMoreSection from '@/components/blog/ReadMoreSection';
import type { ReadNextItem } from '@/lib/readNext';
import ContentAeoSummary from '@/components/content/ContentAeoSummary';
import ContentTagList from '@/components/tags/ContentTagList';
import CommentsSection from '@/components/comments/CommentsSection';
import ReaderReactions from '@/components/reactions/ReaderReactions';
import NewsletterInlineCta from '@/components/newsletter/NewsletterInlineCta';
import BookNudgeAfter from '@/components/books/BookNudgeAfter';
import { useBookNudgeSuggestions } from '@/lib/books/useBookNudgeSuggestions';
import ReadingPathTeaser from '@/components/reading-paths/ReadingPathTeaser';
import ContentFreshnessDates from '@/components/content/ContentFreshnessDates';
import ContentBreadcrumbs from '@/components/content/ContentBreadcrumbs';
import CategoryLink from '@/components/content/CategoryLink';
import EditorialCrossLinks from '@/components/content/EditorialCrossLinks';
import { resolveGenreHubForCategory } from '@/lib/genres/resolveCategoryHref';
import { parseShopBooksFromRecommendation } from '@/lib/shopCatalog';
import {
  buildRecommendationAeoPairs,
  readTags,
  recommendationFieldsFromRaw,
  type ContentFaqItem,
} from '@/lib/contentFields';

interface RecommendationDetailProps {
  slug: string;
  readNextItems?: ReadNextItem[];
}

type BookItem = {
  id: string;
  title: string;
  author: string;
  image: string;
  rating?: number;
  description: string;
  /** URL for the book; book title links here when set. */
  bookLink?: string;
  /** URL for the author profile; author name links here when set. */
  authorLink?: string;
  shopLinks: import('@/lib/shopLinks').ShopLink[];
};
type ItemData = {
  title: string;
  intro: string;
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
  conclusion: string;
  books: BookItem[];
  whoIsThisListFor?: string;
  quickAnswer?: string;
  faq: ContentFaqItem[];
};

function normalizeItem(r: Record<string, unknown> | null | undefined): ItemData {
  if (!r || typeof r !== 'object') {
    return {
      title: '',
      intro: '',
      coverImage: '',
      category: '',
      slug: '',
      readingTime: 5,
      author: '',
      publishedAt: new Date().toISOString().slice(0, 10),
      categories: [],
      tags: [],
      conclusion: '',
      books: [],
      faq: [],
    };
  }
  const editorial = recommendationFieldsFromRaw(r);
  const category = typeof r.category === 'string' ? r.category : '';
  const rawBooks = Array.isArray(r.books) ? r.books : [];
  const books = rawBooks.map((b: unknown) => {
    const item = b && typeof b === 'object' ? (b as Record<string, unknown>) : {};
    return {
      id: String(item?.id ?? ''),
      title: String(item?.title ?? '').trim(),
      author: String(item?.author ?? '').trim(),
      image: typeof item?.image === 'string' ? item.image : '',
      rating:
        typeof item?.rating === 'number' && item.rating >= 1 && item.rating <= 5
          ? item.rating
          : undefined,
      description: String(item?.description ?? '').trim(),
      bookLink: listBookGoodreadsLink(item),
      authorLink: typeof item?.authorLink === 'string' && item.authorLink.trim() ? item.authorLink.trim() : undefined,
      shopLinks: resolveListBookShopLinks(item),
    };
  });
  return {
    title: String(r.title ?? '').trim(),
    intro: typeof r.intro === 'string' ? r.intro : '',
    coverImage: typeof r.image === 'string' ? r.image : '',
    category,
    slug: String(r.slug ?? '').trim(),
    readingTime: typeof r.readingTime === 'number' ? r.readingTime : Number(r.readingTime) || 5,
    author: typeof r.author === 'string' ? r.author : '',
    publishedAt: typeof r.publishedAt === 'string' ? r.publishedAt : new Date().toISOString().slice(0, 10),
    updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : undefined,
    updateHistory: Array.isArray(r.updateHistory) ? (r.updateHistory as ItemData['updateHistory']) : undefined,
    categories: category ? [category] : [],
    tags: readTags(r),
    conclusion: typeof r.conclusion === 'string' ? r.conclusion : '',
    books,
    ...editorial,
    faq: editorial.faq ?? [],
  };
}

export default function RecommendationDetail({ slug, readNextItems = [] }: RecommendationDetailProps) {
  const [item, setItem] = useState<ItemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [prevSlug, setPrevSlug] = useState<string | null>(null);
  const [nextSlug, setNextSlug] = useState<string | null>(null);
  const [listBookSlugs, setListBookSlugs] = useState<string[]>([]);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  const nudgeSeed = useMemo(
    () =>
      item
        ? {
            bookSlug: listBookSlugs[0],
            recommendationSlug: slug,
            genre: item.category,
            tags: item.tags,
            excludeSlugs: listBookSlugs.length ? listBookSlugs : undefined,
            limit: 6,
          }
        : null,
    [item, slug, listBookSlugs]
  );
  const nudgeSuggestions = useBookNudgeSuggestions(nudgeSeed, []);

  useEffect(() => {
    if (!slug || typeof slug !== 'string' || !slug.trim()) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    getRecommendationBySlug(slug)
      .then(({ item: raw }) => {
        const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : null;
        if (record) {
          const slugs = parseShopBooksFromRecommendation(record)
            .map((b) => b.bookSlug)
            .filter((s): s is string => Boolean(s?.trim()));
          setListBookSlugs(slugs);
        } else {
          setListBookSlugs([]);
        }
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
    getRecommendations({ limit: 9999, sort: 'newest' })
      .then(({ items: list }) => {
        const slugs = (list as Record<string, unknown>[])
          .map((r) => (typeof r.slug === 'string' ? r.slug : ''))
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
          <p className="font-body text-chai-brown-light">Recommendation not found.</p>
        </div>
      </article>
    );
  }

  const aeoPairs = buildRecommendationAeoPairs({
    title: item.title,
    whoIsThisListFor: item.whoIsThisListFor,
    quickAnswer: item.quickAnswer,
    faq: item.faq,
  });
  return (
    <article className="pt-24 pb-12 sm:pb-16 min-h-screen">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-cream/50 z-[60]">
        <div
          className="h-full bg-sage transition-all duration-150"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <div className="site-container max-w-5xl">
        <ContentBreadcrumbs
          sectionLabel="Recommendations"
          sectionHref="/recommendations"
          genreHub={
            (item.categories[0] ?? item.category)
              ? (() => {
                  const hub = resolveGenreHubForCategory(item.categories[0] ?? item.category);
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
                <CategoryLink key={category} category={category} contentType="recommendations" style="pill" />
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-chai-brown mb-4 leading-tight">
            {item.title}
          </h1>

          {item.slug && recommendationHasShopLinks({ books: item.books }) ? (
            <div className="mb-6">
              <ShopWhereToBuyCta href={shopPath('recommendations', item.slug)} />
            </div>
          ) : null}

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

          <ContentAeoSummary pairs={aeoPairs} />

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
          <div className="mb-12 blog-content">
            <div
              className="font-body text-lg text-chai-brown-light leading-relaxed"
              dangerouslySetInnerHTML={{ __html: item.intro }}
            />
          </div>
        )}

        <BookNudgeAfter suggestions={nudgeSuggestions} slotIndex={0} />

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
                          {book.bookLink ? (
                            <a
                              href={book.bookLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-chai-brown hover:text-sage underline"
                            >
                              {book.title}
                            </a>
                          ) : (
                            book.title
                          )}
                        </h3>
                        <p className="font-body text-sm text-chai-brown-light italic">
                          by{' '}
                          {book.authorLink ? (
                            <a
                              href={book.authorLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sage hover:underline"
                            >
                              {book.author}
                            </a>
                          ) : (
                            book.author
                          )}
                        </p>
                      </div>

                      {/* Rating (optional — omit when unset) */}
                      {book.rating != null && book.rating >= 1 && (
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
                        <div
                          className="blog-content font-body text-base text-chai-brown-light leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: book.description }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <BookNudgeAfter suggestions={nudgeSuggestions} slotIndex={1} />

        {/* Conclusion */}
        {item.conclusion && (
          <section className="mb-12">
            <div className="bg-cream-light rounded-xl p-6 sm:p-8 border-l-4 border-sage">
              <h3 className="font-serif text-xl text-chai-brown mb-4">Final Thoughts</h3>
              <div
                className="blog-content font-body text-base text-chai-brown-light leading-relaxed"
                dangerouslySetInnerHTML={{ __html: item.conclusion }}
              />
            </div>
          </section>
        )}

        <BookNudgeAfter suggestions={nudgeSuggestions} slotIndex={2} />

        {/* Categories Section */}
        {item.categories && item.categories.length > 0 && (
          <section className="mb-6 pt-8 border-t border-chai-brown/10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-sans font-medium text-chai-brown mr-2">Categories:</span>
              {item.categories.map((category) => (
                <CategoryLink key={category} category={category} contentType="recommendations" style="footer" />
              ))}
            </div>
          </section>
        )}

        <ContentTagList tags={item.tags} />

        <ReadingPathTeaser category={item.categories[0] ?? item.category} tags={item.tags} />
        <EditorialCrossLinks
          contentType="recommendations"
          category={item.categories[0] ?? item.category}
          tags={item.tags}
        />

        <NewsletterInlineCta variant="recommendation" placement="content-recommendation" contentSlug={slug} />
        <ReaderReactions contentType="recommendations" slug={slug} />
        <CommentsSection contentType="recommendations" slug={slug} />

        {/* Read next – random recommendation cards */}
        <ReadMoreSection variant="recommendations" items={readNextItems} />

        {/* Navigation to Next/Previous */}
        <div className="flex justify-between items-center pt-8 border-t border-chai-brown/10">
          {prevSlug ? (
            <Link href={`/recommendations/${prevSlug}`} className="text-sage font-sans text-sm hover:underline">
              ← Previous List
            </Link>
          ) : (
            <span className="text-sage/50 font-sans text-sm cursor-default">← Previous List</span>
          )}
          {nextSlug ? (
            <Link href={`/recommendations/${nextSlug}`} className="text-sage font-sans text-sm hover:underline">
              Next List →
            </Link>
          ) : (
            <span className="text-sage/50 font-sans text-sm cursor-default">Next List →</span>
          )}
        </div>
      </div>
    </article>
  );
}
