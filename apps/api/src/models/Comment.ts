import mongoose, { Document, Schema, Types } from 'mongoose';

export type CommentContentType = 'blog' | 'recommendations' | 'musings' | 'author-spotlight';
export type CommentStatus = 'pending' | 'approved' | 'rejected' | 'spam';

export interface IComment extends Document {
  contentType: CommentContentType;
  contentSlug: string;
  parentId?: Types.ObjectId;
  name: string;
  email: string;
  body: string;
  status: CommentStatus;
  ipHash?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CONTENT_TYPES: CommentContentType[] = ['blog', 'recommendations', 'musings', 'author-spotlight'];
const STATUSES: CommentStatus[] = ['pending', 'approved', 'rejected', 'spam'];

const CommentSchema = new Schema<IComment>(
  {
    contentType: { type: String, required: true, enum: CONTENT_TYPES, index: true },
    contentSlug: { type: String, required: true, trim: true, index: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    body: { type: String, required: true, trim: true, maxlength: 4000 },
    status: { type: String, required: true, enum: STATUSES, default: 'pending', index: true },
    ipHash: { type: String, default: '' },
    userAgent: { type: String, default: '' },
  },
  { timestamps: true }
);

CommentSchema.index({ contentType: 1, contentSlug: 1, status: 1, createdAt: -1 });
CommentSchema.index({ status: 1, createdAt: -1 });

export const Comment = mongoose.model<IComment>('Comment', CommentSchema);
