import mongoose, { Document, Schema } from 'mongoose';

/**
 * Author profile for Library OS (§7). Stored once; per-author statistics are
 * computed on read from the LibraryBook collection (not persisted here).
 */
export interface ILibraryAuthor extends Document {
  name: string;
  slug: string;
  country?: string;
  primaryLanguage?: string;
  website?: string;
  goodreads?: string;
  instagram?: string;
  shortBio?: string;
  awards: string[];
  priorityAuthor: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LibraryAuthorSchema = new Schema<ILibraryAuthor>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    country: { type: String, default: '', trim: true },
    primaryLanguage: { type: String, default: '', trim: true },
    website: { type: String, default: '', trim: true },
    goodreads: { type: String, default: '', trim: true },
    instagram: { type: String, default: '', trim: true },
    shortBio: { type: String, default: '', trim: true },
    awards: { type: [String], default: [] },
    priorityAuthor: { type: Boolean, default: false },
  },
  { timestamps: true }
);

LibraryAuthorSchema.index({ name: 1 });

export const LibraryAuthor = mongoose.model<ILibraryAuthor>('LibraryAuthor', LibraryAuthorSchema);
