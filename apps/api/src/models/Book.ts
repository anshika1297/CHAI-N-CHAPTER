import mongoose, { Document, Schema } from 'mongoose';

export type BookContentType = 'blog' | 'recommendations' | 'author-spotlight';

export interface IBookSourceRef {
  contentType: BookContentType;
  contentSlug: string;
  contentTitle: string;
  href: string;
  anchor?: string;
}

export interface IShopPurchaseLink {
  label: string;
  url: string;
  channel?: string;
}

export interface IBook extends Document {
  bookSlug: string;
  title: string;
  author: string;
  coverImage?: string;
  genre?: string;
  /** All genres (primary = genres[0] or genre). */
  genres: string[];
  description?: string;
  isbn?: string;
  purchaseLinks: IShopPurchaseLink[];
  goodreadsUrl?: string;
  sourceRefs: IBookSourceRef[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const SourceRefSchema = new Schema<IBookSourceRef>(
  {
    contentType: { type: String, required: true, enum: ['blog', 'recommendations', 'author-spotlight'] },
    contentSlug: { type: String, required: true, trim: true, lowercase: true },
    contentTitle: { type: String, required: true, trim: true },
    href: { type: String, required: true, trim: true },
    anchor: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const PurchaseLinkSchema = new Schema<IShopPurchaseLink>(
  {
    label: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    channel: { type: String, default: '' },
  },
  { _id: false }
);

const BookSchema = new Schema<IBook>(
  {
    bookSlug: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    title: { type: String, required: true, trim: true },
    author: { type: String, default: '', trim: true },
    coverImage: { type: String, default: '' },
    genre: { type: String, default: '' },
    genres: { type: [String], default: [] },
    description: { type: String, default: '' },
    isbn: { type: String, default: '' },
    purchaseLinks: { type: [PurchaseLinkSchema], default: [] },
    goodreadsUrl: { type: String, default: '' },
    sourceRefs: { type: [SourceRefSchema], default: [] },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

BookSchema.index({ title: 'text', author: 'text' });
BookSchema.index({ author: 1 });
BookSchema.index({ genre: 1 });
BookSchema.index({ createdAt: -1 });
BookSchema.index({ 'sourceRefs.contentType': 1 });

export const Book = mongoose.model<IBook>('Book', BookSchema);
