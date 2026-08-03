import mongoose, { Document, Schema } from 'mongoose';
import type { ReactionContentType } from '../config/reactionTypes.js';
import { REACTION_CONTENT_TYPES } from '../config/reactionTypes.js';

export interface IReactionVote extends Document {
  contentType: ReactionContentType;
  contentSlug: string;
  reactionId: string;
  voterKey: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReactionVoteSchema = new Schema<IReactionVote>(
  {
    contentType: { type: String, required: true, enum: REACTION_CONTENT_TYPES, index: true },
    contentSlug: { type: String, required: true, trim: true, lowercase: true, index: true },
    reactionId: { type: String, required: true, trim: true },
    voterKey: { type: String, required: true, trim: true, maxlength: 64 },
  },
  { timestamps: true }
);

ReactionVoteSchema.index({ contentType: 1, contentSlug: 1, voterKey: 1 }, { unique: true });

export const ReactionVote = mongoose.model<IReactionVote>('ReactionVote', ReactionVoteSchema);
