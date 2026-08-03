import mongoose, { Document, Schema } from 'mongoose';
import { TAXONOMY_TYPES, TaxonomyType } from '../config/libraryEnums.js';

/**
 * Generic master-data entry for Library OS (§8): genres, themes, tropes, moods,
 * publishers, countries, languages, tags, collections, series, subgenres.
 * One collection keyed by `type` keeps management simple while staying fully editable.
 */
export interface ILibraryTaxonomy extends Document {
  type: TaxonomyType;
  name: string;
  slug: string;
  description?: string;
  /** Optional free-form metadata (e.g. series order, colour) — reserved for later. */
  meta?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const LibraryTaxonomySchema = new Schema<ILibraryTaxonomy>(
  {
    type: { type: String, required: true, enum: TAXONOMY_TYPES, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, default: '', trim: true },
    meta: { type: Schema.Types.Mixed, default: undefined },
  },
  { timestamps: true }
);

LibraryTaxonomySchema.index({ type: 1, slug: 1 }, { unique: true });
LibraryTaxonomySchema.index({ type: 1, name: 1 });

export const LibraryTaxonomy = mongoose.model<ILibraryTaxonomy>('LibraryTaxonomy', LibraryTaxonomySchema);
