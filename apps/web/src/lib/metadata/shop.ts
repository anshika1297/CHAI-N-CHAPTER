import { readTags, seoFieldsFromRaw } from '@/lib/contentFields';
import { parseShopReviewFromPost } from '@/lib/shopCatalog';
import type { ShopKind } from './types';
import { resolvePageMetadata, slugToLabel } from './resolve';
import { resolveListingSocialImage, resolveSocialImageUrl } from './socialImage';

const SHOP_PATHS: Record<ShopKind, string> = {
  review: '/shop/review',
  recommendations: '/shop/recommendations',
  'author-spotlight': '/shop/author-spotlight',
};

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

/** Shop entry metadata — unique from editorial URLs; inherits CMS SEO when set. */
export function resolveShopMetadata(input: {
  kind: ShopKind;
  slug: string;
  raw?: Record<string, unknown> | null;
}) {
  const { kind, slug, raw } = input;
  const path = `${SHOP_PATHS[kind]}/${slug}`;
  const label = slugToLabel(slug);
  const seo = raw ? seoFieldsFromRaw(raw) : {};
  const tags = raw ? readTags(raw) : [];

  if (kind === 'review' && raw) {
    const book = parseShopReviewFromPost(raw, slug);
    if (book) {
      const shopTitle = `Buy ${book.bookTitle}`;
      const shopDescription =
        seo.seoDescription ||
        str(raw.excerpt) ||
        `Purchase links for ${book.bookTitle}${book.bookAuthor ? ` by ${book.bookAuthor}` : ''}. Honest review on Chapters.aur.Chai.`;
      const image = resolveSocialImageUrl({
        seo,
        raw,
        kind: 'review',
        staticCover: book.coverImage,
        socialTitle: shopTitle,
        category: 'Shop',
      });
      return resolvePageMetadata({
        path,
        seoTitle: seo.seoTitle ? `Buy — ${seo.seoTitle}` : undefined,
        contentTitle: shopTitle,
        fallbackTitle: shopTitle,
        seoDescription: seo.seoDescription,
        excerpt: shopDescription,
        fallbackDescription: `Where to buy ${book.bookTitle} — affiliate links from Chapters.aur.Chai.`,
        image,
        keywords: ['buy books', 'book shop', book.bookTitle, book.bookAuthor, ...tags],
        type: 'website',
        socialTitle: shopTitle,
        socialDescription: shopDescription,
        noIndex: true,
      });
    }
  }

  if (kind === 'recommendations' && raw) {
    const title = str(raw.title) || label;
    const shopTitle = `Buy books — ${title}`;
    const shopDescription =
      seo.seoDescription ||
      str(raw.excerpt) ||
      `Purchase links for every book in ${title}. Curated list by Anshika Mishra.`;
    const image = resolveSocialImageUrl({
      seo,
      raw,
      kind: 'recommendation',
      socialTitle: shopTitle,
      category: 'Shop',
    });
    return resolvePageMetadata({
      path,
      seoTitle: seo.seoTitle ? `Buy books — ${seo.seoTitle}` : undefined,
      contentTitle: shopTitle,
      fallbackTitle: shopTitle,
      seoDescription: seo.seoDescription,
      excerpt: shopDescription,
      fallbackDescription: `Where to buy books from ${title} on Chapters.aur.Chai.`,
      image,
      keywords: ['buy books', 'book list', title, ...tags],
      type: 'website',
      socialTitle: shopTitle,
      socialDescription: shopDescription,
      noIndex: true,
    });
  }

  if (kind === 'author-spotlight' && raw) {
    const name = str(raw.name) || label;
    const shopTitle = `Buy books — ${name}`;
    const shopDescription =
      seo.seoDescription ||
      str(raw.tagline) ||
      `Purchase links for books featured in our Author Spotlight: ${name}.`;
    const image = resolveSocialImageUrl({
      seo,
      raw,
      kind: 'author-spotlight',
      socialTitle: shopTitle,
      category: 'Shop',
    });
    return resolvePageMetadata({
      path,
      seoTitle: seo.seoTitle ? `Buy books — ${seo.seoTitle}` : undefined,
      contentTitle: shopTitle,
      fallbackTitle: shopTitle,
      seoDescription: seo.seoDescription,
      excerpt: shopDescription,
      fallbackDescription: `Where to buy books by ${name} on Chapters.aur.Chai.`,
      image,
      keywords: ['buy books', 'author spotlight', name, ...tags],
      type: 'website',
      socialTitle: shopTitle,
      socialDescription: shopDescription,
      noIndex: true,
    });
  }

  return resolvePageMetadata({
    path,
    fallbackTitle: 'Where to buy',
    fallbackDescription: 'Purchase links for books featured on Chapters.aur.Chai.',
    keywords: ['buy books', 'book shop', label],
    type: 'website',
    noIndex: true,
  });
}

export function resolveShopHubMetadata() {
  return resolvePageMetadata({
    path: '/shop',
    contentTitle: 'Shop the books',
    fallbackTitle: 'Shop the books',
    excerpt: 'Buy links for books from Chapters.aur.Chai reviews, lists, and author spotlights.',
    fallbackDescription:
      'Buy links for books from Chapters.aur.Chai reviews, curated lists, and author spotlights. India & UAE readers.',
    keywords: ['buy books', 'book shop', 'Chapters.aur.Chai', 'affiliate links'],
    type: 'website',
    image: resolveListingSocialImage({ title: 'Shop the Books', category: 'Book Shop' }),
  });
}
