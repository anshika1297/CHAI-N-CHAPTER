import mongoose, { Document, Schema } from 'mongoose';
import type { ContentUpdateEntry } from '../types/contentFreshness.js';
import {
  appendSpotlightUpdateHistory,
  hashSpotlightContent,
} from '../services/contentFreshness.js';

export interface ISocialLink {
  label: string;
  url: string;
}

export interface IShopLink {
  label: string;
  url: string;
  channel?: string;
}

export interface IShopBookMeta {
  title?: string;
  author?: string;
  genre?: string;
  coverImage?: string;
  isbn?: string;
  bookSlug?: string;
}

export interface IFeaturedBook {
  title: string;
  coverImage?: string;
  description?: string;
  buyLink?: string;
  shopLinks?: IShopLink[];
  shopBook?: IShopBookMeta;
  goodreadsLink?: string;
  blogReviewLink?: string;
}

export interface IBlogLink {
  title: string;
  url: string;
}

export interface IReadingPairing {
  ifYouLiked: string;
  recommendedTitle: string;
  reason: string;
  internalUrl?: string;
}

export interface IFaqItem {
  question: string;
  answer: string;
}

export interface ISimilarAuthor {
  name: string;
  reason?: string;
  url?: string;
}

/** Structured author presence links for Connect section + Person schema sameAs. */
export interface IAuthorConnectLinks {
  website?: string;
  goodreads?: string;
  amazonAuthor?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  newsletter?: string;
  publisher?: string;
}

export interface IAuthorSpotlight extends Document {
  slug: string;
  name: string;
  tagline: string;
  /** Listing / card cover (falls back to profileImage when unset). */
  coverImage?: string;
  profileImage: string;
  /** Short hook shown in About (above full bio). Supports HTML. */
  introduction?: string;
  /** HTML for Quick facts — “Who is [name]?” (separate from introduction). */
  whoIsHtml?: string;
  bio: string;
  genres: string[];
  connectLinks?: IAuthorConnectLinks;
  socialLinks: ISocialLink[];
  featuredBooks: IFeaturedBook[];
  blogLinks: IBlogLink[];
  readingPairings: IReadingPairing[];
  faq: IFaqItem[];
  interviewSectionTitle?: string;
  interview: IFaqItem[];
  isPublished: boolean;
  publishDate?: Date;
  /** Set once when subscribers are emailed on first publish. */
  subscribersEmailedAt?: Date;
  displayOrder: number;
  seoTitle?: string;
  seoDescription?: string;
  socialShareImage?: string;
  ogImage?: string;
  tags?: string[];
  canonicalUrl?: string;
  startHere?: string;
  notableWorks?: string[];
  similarAuthors?: ISimilarAuthor[];
  updateHistory?: ContentUpdateEntry[];
}

const SocialLinkSchema = new Schema<ISocialLink>(
  {
    label: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const ShopLinkSchema = new Schema<IShopLink>(
  {
    label: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    channel: { type: String, default: '' },
  },
  { _id: false }
);

const ShopBookMetaSchema = new Schema<IShopBookMeta>(
  {
    title: { type: String, default: '' },
    author: { type: String, default: '' },
    genre: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    isbn: { type: String, default: '' },
    bookSlug: { type: String, default: '' },
  },
  { _id: false }
);

const FeaturedBookSchema = new Schema<IFeaturedBook>(
  {
    title: { type: String, required: true, trim: true },
    coverImage: { type: String, default: '' },
    description: { type: String, default: '' },
    buyLink: { type: String, default: '' },
    shopLinks: { type: [ShopLinkSchema], default: [] },
    shopBook: { type: ShopBookMetaSchema, default: undefined },
    goodreadsLink: { type: String, default: '' },
    blogReviewLink: { type: String, default: '' },
  },
  { _id: false }
);

const BlogLinkSchema = new Schema<IBlogLink>(
  {
    title: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const ReadingPairingSchema = new Schema<IReadingPairing>(
  {
    ifYouLiked: { type: String, required: true, trim: true },
    recommendedTitle: { type: String, required: true, trim: true },
    reason: { type: String, required: true, trim: true },
    internalUrl: { type: String, default: '' },
  },
  { _id: false }
);

const FaqItemSchema = new Schema<IFaqItem>(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const AuthorConnectLinksSchema = new Schema<IAuthorConnectLinks>(
  {
    website: { type: String, default: '', trim: true },
    goodreads: { type: String, default: '', trim: true },
    amazonAuthor: { type: String, default: '', trim: true },
    instagram: { type: String, default: '', trim: true },
    facebook: { type: String, default: '', trim: true },
    linkedin: { type: String, default: '', trim: true },
    newsletter: { type: String, default: '', trim: true },
    publisher: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const UpdateHistorySchema = new Schema(
  {
    at: { type: String, required: true, trim: true },
    reason: { type: String, enum: ['content', 'publish'], default: 'content' },
  },
  { _id: false }
);

const SimilarAuthorSchema = new Schema<ISimilarAuthor>(
  {
    name: { type: String, required: true, trim: true },
    reason: { type: String, default: '', trim: true },
    url: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const AuthorSpotlightSchema = new Schema<IAuthorSpotlight>(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    tagline: { type: String, default: '', trim: true },
    coverImage: { type: String, default: '', trim: true },
    profileImage: { type: String, required: true, trim: true },
    introduction: { type: String, default: '', trim: true },
    /** HTML summary for Quick facts — “Who is [name]?” (separate from introduction). */
    whoIsHtml: { type: String, default: '', trim: true },
    bio: { type: String, default: '', trim: true },
    genres: { type: [String], default: [] },
    connectLinks: { type: AuthorConnectLinksSchema, default: undefined },
    socialLinks: { type: [SocialLinkSchema], default: [] },
    featuredBooks: { type: [FeaturedBookSchema], default: [] },
    blogLinks: { type: [BlogLinkSchema], default: [] },
    readingPairings: { type: [ReadingPairingSchema], default: [] },
    faq: { type: [FaqItemSchema], default: [] },
    interviewSectionTitle: { type: String, default: 'Interview', trim: true },
    interview: { type: [FaqItemSchema], default: [] },
    isPublished: { type: Boolean, default: false },
    publishDate: { type: Date },
    subscribersEmailedAt: { type: Date },
    displayOrder: { type: Number, default: 0 },
    seoTitle: { type: String, default: '', trim: true },
    seoDescription: { type: String, default: '', trim: true },
    socialShareImage: { type: String, default: '', trim: true },
    ogImage: { type: String, default: '', trim: true },
    tags: { type: [String], default: [] },
    canonicalUrl: { type: String, default: '', trim: true },
    startHere: { type: String, default: '', trim: true },
    notableWorks: { type: [String], default: [] },
    similarAuthors: { type: [SimilarAuthorSchema], default: [] },
    updateHistory: { type: [UpdateHistorySchema], default: [] },
  },
  { timestamps: true }
);

AuthorSpotlightSchema.pre('save', function recordSpotlightFreshness(next) {
  if (this.isNew) {
    if (!this.updateHistory?.length) {
      this.updateHistory = appendSpotlightUpdateHistory([], 'publish');
    }
    return next();
  }

  const prevHash = this.$locals._prevContentHash as string | undefined;
  if (prevHash) {
    const nextHash = hashSpotlightContent(this.toObject() as Record<string, unknown>);
    if (prevHash !== nextHash) {
      this.updateHistory = appendSpotlightUpdateHistory(this.updateHistory, 'content');
      this.markModified('updateHistory');
    }
  }
  next();
});

AuthorSpotlightSchema.index({ isPublished: 1, publishDate: -1, displayOrder: 1 });

export const AuthorSpotlight = mongoose.model<IAuthorSpotlight>('AuthorSpotlight', AuthorSpotlightSchema);
