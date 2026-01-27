import mongoose, { Document, Schema } from 'mongoose';

export type PageSlug = 'contact' | 'work-with-me' | 'about' | 'terms' | 'privacy' | 'header' | 'home' | 'book-clubs';

export interface IPage extends Document {
  slug: PageSlug;
  content: Record<string, unknown>;
  updatedAt: Date;
}

const PageSchema = new Schema<IPage>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      enum: ['contact', 'work-with-me', 'about', 'terms', 'privacy', 'header', 'home', 'book-clubs'],
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
