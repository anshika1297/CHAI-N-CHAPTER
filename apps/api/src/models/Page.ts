import mongoose, { Document, Schema } from 'mongoose';

export type PageSlug = 'contact' | 'work-with-me' | 'about' | 'terms' | 'privacy' | 'header' | 'home' | 'book-clubs' | 'blog' | 'recommendations' | 'musings';

export interface IPage extends Document {
  slug: PageSlug;
  content: Record<string, unknown>;
  updatedAt: Date;
}

const SLUG_ENUM = ['contact', 'work-with-me', 'about', 'terms', 'privacy', 'header', 'home', 'book-clubs', 'blog', 'recommendations', 'musings'] as const;

const PageSchema = new Schema<IPage>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      enum: SLUG_ENUM,
    },
    content: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },
  },
  { timestamps: true }
);

export const Page = mongoose.model<IPage>('Page', PageSchema);
