import { getImageUrl, type AuthorSpotlightDto } from '@/lib/api';
import {
  buildMusingAeoPairs,
  buildRecommendationAeoPairs,
  buildReviewAeoPairs,
  buildSpotlightAeoPairs,
  musingFieldsFromRaw,
  readTags,
  recommendationFieldsFromRaw,
  reviewFieldsFromRaw,
  spotlightFieldsFromRaw,
} from '@/lib/contentFields';
import { contentModifiedTime, readContentPublishedAt } from '@/lib/contentFreshness';
import { parseShopBooksFromRecommendation, parseShopBooksFromSpotlight, parseShopReviewFromPost } from '@/lib/shopCatalog';
import { sellerNameForChannel } from '@/lib/shop/channels';
import type { ShopPurchaseLink } from '@/lib/shop/types';
import type { BookInput } from './types';
import { buildArticleSchema, buildBlogPostingSchema } from './article';
import { buildBookListSchema, buildBookSchema } from './book';
import { buildFaqPageSchema, mergeFaqItems } from './faq';
import { buildSpotlightPersonSchema } from './person';
import { buildWebPageSchema } from './webPage';
import { buildBookReviewSchemas } from './review';
import { connectLinksForSchema, officialWebsiteUrl } from '@/lib/spotlightConnect';
import type { JsonLdObject } from './types';
import { pageUrl } from './utils';

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function num(v: unknown): number | undefined {
  return typeof v === 'number' && !Number.isNaN(v) ? v : undefined;
}

/** /blog/[slug] — Review + Book */
export function schemasForReviewPage(raw: Record<string, unknown>, slug: string): JsonLdObject[] {
  const editorial = reviewFieldsFromRaw(raw);
  const bookTitle = str(raw.bookTitle) || str(raw.title);
  const bookAuthor = str(raw.bookAuthor);
  const image = str(raw.image);

  const schemas = buildBookReviewSchemas({
    headline: str(raw.seoTitle) || str(raw.title),
    reviewBody: editorial.verdict || str(raw.excerpt),
    description: str(raw.seoDescription) || str(raw.excerpt),
    path: `/blog/${slug}`,
    image: image ? getImageUrl(image) : undefined,
    datePublished: readContentPublishedAt(raw) || str(raw.publishedAt) || undefined,
    dateModified: contentModifiedTime(raw) || readContentPublishedAt(raw) || undefined,
    authorName: str(raw.author) || undefined,
    rating: num(raw.rating),
    tags: readTags(raw),
    book: {
      name: bookTitle,
      author: bookAuthor || undefined,
      image: image ? getImageUrl(image) : undefined,
      url: str(raw.bookLink) || undefined,
      sameAs: str(raw.bookLink) ? [str(raw.bookLink)] : undefined,
    },
  });

  const aeoLd = buildFaqPageSchema(buildReviewAeoPairs({ ...editorial, bookTitle }));
  if (aeoLd) schemas.push(aeoLd);

  return schemas;
}

/** /recommendations/[slug] — Article (+ FAQ when present) */
export function schemasForRecommendationPage(raw: Record<string, unknown>, slug: string): JsonLdObject[] {
  const image = str(raw.image);
  const schemas: JsonLdObject[] = [
    buildArticleSchema({
      headline: str(raw.seoTitle) || str(raw.title),
      description: str(raw.seoDescription) || str(raw.quickAnswer) || str(raw.excerpt) || str(raw.intro),
      path: `/recommendations/${slug}`,
      image: image ? getImageUrl(image) : undefined,
      datePublished: readContentPublishedAt(raw) || str(raw.publishedAt) || undefined,
      dateModified: contentModifiedTime(raw) || readContentPublishedAt(raw) || undefined,
      authorName: str(raw.author) || undefined,
      tags: readTags(raw),
    }),
  ];

  const faq = Array.isArray(raw.faq) ? (raw.faq as { question?: string; answer?: string }[]) : [];
  const cmsFaq = faq
    .filter((f) => str(f.question) && str(f.answer))
    .map((f) => ({ question: str(f.question), answer: str(f.answer) }));
  const editorial = recommendationFieldsFromRaw(raw);
  const faqLd = buildFaqPageSchema(
    mergeFaqItems(
      cmsFaq,
      buildRecommendationAeoPairs({ ...editorial, title: str(raw.title), faq: [] })
    )
  );
  if (faqLd) schemas.push(faqLd);

  return schemas;
}

/** /musings/[slug] — BlogPosting */
export function schemasForMusingPage(raw: Record<string, unknown>, slug: string): JsonLdObject[] {
  const image = str(raw.image) || str(raw.coverImage);
  const editorial = musingFieldsFromRaw(raw);
  const schemas: JsonLdObject[] = [
    buildBlogPostingSchema({
      headline: str(raw.seoTitle) || str(raw.title),
      description: str(raw.seoDescription) || str(raw.keyTakeaway) || str(raw.excerpt),
      path: `/musings/${slug}`,
      image: image ? getImageUrl(image) : undefined,
      datePublished: readContentPublishedAt(raw) || str(raw.publishedAt) || undefined,
      dateModified: contentModifiedTime(raw) || readContentPublishedAt(raw) || undefined,
      authorName: str(raw.author) || undefined,
      tags: readTags(raw),
    }),
  ];

  const aeoLd = buildFaqPageSchema(buildMusingAeoPairs({ ...editorial, title: str(raw.title) }));
  if (aeoLd) schemas.push(aeoLd);

  return schemas;
}

/** /author-spotlight/[slug] — Person + FAQ (+ interview Q&A when present) */
export function schemasForSpotlightPage(spotlight: AuthorSpotlightDto): JsonLdObject[] {
  const editorial = spotlightFieldsFromRaw(spotlight);
  const intro = spotlight.introduction?.trim();
  const description =
    spotlight.seoDescription?.trim() ||
    intro ||
    spotlight.tagline?.trim() ||
    spotlight.bio?.slice(0, 280);

  const spotlightRaw = spotlight as unknown as Record<string, unknown>;
  const spotlightPath = `/author-spotlight/${spotlight.slug}`;
  const personId = `${pageUrl(spotlightPath)}#person`;
  const pageSchema = buildWebPageSchema({
    path: spotlightPath,
    name: `${spotlight.name} — Author Spotlight`,
    description: description || spotlight.tagline || '',
  });
  (pageSchema as Record<string, unknown>).mainEntity = { '@id': personId };

  const published = readContentPublishedAt(spotlightRaw);
  const modified = contentModifiedTime(spotlightRaw);
  const pageRecord = pageSchema as Record<string, unknown>;
  if (published) pageRecord.datePublished = published;
  if (modified || published) pageRecord.dateModified = modified || published;

  const schemas: JsonLdObject[] = [
    pageSchema,
    buildSpotlightPersonSchema({
      name: spotlight.name,
      description,
      image: spotlight.profileImage || spotlight.ogImage,
      path: spotlightPath,
      url: officialWebsiteUrl(spotlight),
      genres: spotlight.genres,
      sameAs: connectLinksForSchema(spotlight),
      notableWorks: editorial.notableWorks,
    }),
  ];

  const mergedFaq = mergeFaqItems(
    buildSpotlightAeoPairs({
      ...editorial,
      name: spotlight.name,
      tagline: spotlight.tagline,
    }),
    spotlight.faq ?? [],
    spotlight.interview ?? []
  );
  const faqLd = buildFaqPageSchema(mergedFaq);
  if (faqLd) schemas.push(faqLd);

  return schemas;
}

function shopLinksToSchema(links: ShopPurchaseLink[], goodreads?: string): Pick<BookInput, 'sameAs' | 'offers'> {
  const sameAs = [...links.map((l) => l.url), ...(goodreads ? [goodreads] : [])].filter(
    (u, i, a) => a.indexOf(u) === i
  );
  const offers = links
    .filter((l) => l.channel !== 'goodreads')
    .map((l) => ({ url: l.url, seller: sellerNameForChannel(l.channel) }));
  return { sameAs: sameAs.length ? sameAs : undefined, offers: offers.length ? offers : undefined };
}

/** /shop/review/[slug] — Book */
export function schemasForShopReviewPage(raw: Record<string, unknown>, slug: string): JsonLdObject[] {
  const book = parseShopReviewFromPost(raw, slug);
  if (!book) return [];
  const linkMeta = shopLinksToSchema(book.shopLinks, book.goodreadsLink);
  return [
    buildBookSchema({
      name: book.bookTitle,
      author: book.bookAuthor || undefined,
      image: book.coverImage ? getImageUrl(book.coverImage) : undefined,
      url: book.goodreadsLink,
      isbn: book.isbn,
      genre: book.genre,
      ...linkMeta,
      description: `Purchase links for ${book.bookTitle} — featured on Chapters.aur.Chai.`,
      subjectOf: { name: book.editorialTitle, url: book.editorialHref },
    }),
  ];
}

/** /shop/recommendations/[slug] — Book (one per title with buy links) */
export function schemasForShopRecommendationPage(raw: Record<string, unknown>, _slug: string): JsonLdObject[] {
  const books = parseShopBooksFromRecommendation(raw);
  return buildBookListSchema(
    books.map((b) => {
      const linkMeta = shopLinksToSchema(b.shopLinks, b.goodreadsLink);
      return {
        name: b.title,
        author: b.author || undefined,
        image: b.image ? getImageUrl(b.image) : undefined,
        url: b.goodreadsLink,
        isbn: b.isbn,
        genre: b.genre,
        ...linkMeta,
      };
    })
  );
}

/** /shop/author-spotlight/[slug] — Book (featured titles with buy links) */
export function schemasForShopSpotlightPage(spotlight: AuthorSpotlightDto): JsonLdObject[] {
  const books = parseShopBooksFromSpotlight(spotlight);
  return buildBookListSchema(
    books.map((b) => {
      const linkMeta = shopLinksToSchema(b.shopLinks, b.goodreadsLink);
      return {
        name: b.title,
        author: spotlight.name,
        image: b.coverImage ? getImageUrl(b.coverImage) : undefined,
        url: b.goodreadsLink,
        isbn: b.isbn,
        genre: b.genre,
        ...linkMeta,
        description: b.description,
      };
    })
  );
}
