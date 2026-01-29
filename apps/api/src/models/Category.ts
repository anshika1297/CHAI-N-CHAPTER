import mongoose, { Document, Schema } from 'mongoose';

export type CategoryType = 'blog' | 'recommendations' | 'musings';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description: string;
  type: CategoryType;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    type: { type: String, required: true, enum: ['blog', 'recommendations', 'musings'] },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

CategorySchema.index({ type: 1, order: 1 });
CategorySchema.index({ type: 1, slug: 1 }, { unique: true });

// Mongoose uses model name "Category" → MongoDB collection name is "categories" (plural).
// The collection is created when the first document is inserted (e.g. first POST /api/categories).
export const Category = mongoose.model<ICategory>('Category', CategorySchema);
