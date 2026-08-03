import mongoose, { Document, Schema } from 'mongoose';
import type { ReactionContentType } from '../config/reactionTypes.js';
import { REACTION_CONTENT_TYPES } from '../config/reactionTypes.js';

export interface IReactionCounts extends Document {
  contentType: ReactionContentType;
  contentSlug: string;
  counts: Map<string, number>;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

const ReactionCountsSchema = new Schema<IReactionCounts>(
  {
    contentType: { type: String, required: true, enum: REACTION_CONTENT_TYPES },
    contentSlug: { type: String, required: true, trim: true, lowercase: true },
    counts: { type: Map, of: Number, default: () => new Map() },
    total: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

ReactionCountsSchema.index({ contentType: 1, contentSlug: 1 }, { unique: true });

export const ReactionCounts = mongoose.model<IReactionCounts>('ReactionCounts', ReactionCountsSchema);
