import { Types } from 'mongoose';
import { Comment, type CommentContentType, type CommentStatus, type IComment } from '../models/Comment.js';
import { assessCommentSpam, hashIp } from '../utils/commentSpam.js';
import { commentTargetExists } from './commentContent.js';

const MAX_NEST_DEPTH = 3;

export type PublicCommentNode = {
  id: string;
  parentId: string | null;
  name: string;
  body: string;
  createdAt: string;
  replies: PublicCommentNode[];
};

function serializePublic(doc: IComment): Omit<PublicCommentNode, 'replies'> {
  return {
    id: String(doc._id),
    parentId: doc.parentId ? String(doc.parentId) : null,
    name: doc.name,
    body: doc.body,
    createdAt: doc.createdAt.toISOString(),
  };
}

export function buildCommentTree(docs: IComment[]): PublicCommentNode[] {
  const byParent = new Map<string | null, IComment[]>();
  for (const doc of docs) {
    const pid = doc.parentId ? String(doc.parentId) : null;
    const bucket = byParent.get(pid) ?? [];
    bucket.push(doc);
    byParent.set(pid, bucket);
  }
  for (const bucket of byParent.values()) {
    bucket.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  const walk = (parentId: string | null): PublicCommentNode[] => {
    const children = byParent.get(parentId) ?? [];
    return children.map((doc) => ({
      ...serializePublic(doc),
      replies: walk(String(doc._id)),
    }));
  };

  return walk(null);
}

async function commentDepth(parentId: Types.ObjectId): Promise<number> {
  let depth = 0;
  let current: Types.ObjectId | undefined = parentId;
  while (current && depth < MAX_NEST_DEPTH + 2) {
    const parent = await Comment.findById(current).select('parentId').lean();
    if (!parent) break;
    depth += 1;
    current = parent.parentId as Types.ObjectId | undefined;
  }
  return depth;
}

export async function getApprovedComments(
  contentType: CommentContentType,
  contentSlug: string
): Promise<PublicCommentNode[]> {
  const slug = contentSlug.trim().toLowerCase();
  const docs = await Comment.find({ contentType, contentSlug: slug, status: 'approved' })
    .sort({ createdAt: 1 })
    .lean();
  return buildCommentTree(docs as unknown as IComment[]);
}

export async function getApprovedCommentCount(
  contentType: CommentContentType,
  contentSlug: string
): Promise<number> {
  const slug = contentSlug.trim().toLowerCase();
  return Comment.countDocuments({ contentType, contentSlug: slug, status: 'approved' });
}

export async function submitComment(input: {
  contentType: CommentContentType;
  contentSlug: string;
  parentId?: string;
  name: string;
  email: string;
  body: string;
  website?: string;
  ip?: string;
  userAgent?: string;
}): Promise<{ status: CommentStatus; message: string }> {
  const contentSlug = input.contentSlug.trim().toLowerCase();
  if (!(await commentTargetExists(input.contentType, contentSlug))) {
    throw new Error('Content not found');
  }

  const spam = assessCommentSpam(input.body, input.website);
  let parentObjectId: Types.ObjectId | undefined;
  if (input.parentId?.trim()) {
    if (!Types.ObjectId.isValid(input.parentId)) {
      throw new Error('Invalid parent comment');
    }
    const parent = await Comment.findById(input.parentId);
    if (
      !parent ||
      parent.contentType !== input.contentType ||
      parent.contentSlug !== contentSlug ||
      parent.status === 'spam' ||
      parent.status === 'rejected'
    ) {
      throw new Error('Invalid parent comment');
    }
    const depth = await commentDepth(parent._id as Types.ObjectId);
    if (depth >= MAX_NEST_DEPTH) {
      throw new Error('Maximum reply depth reached');
    }
    parentObjectId = parent._id as Types.ObjectId;
  }

  const ipHash = hashIp(input.ip ?? '');
  if (ipHash) {
    const recentDup = await Comment.findOne({
      ipHash,
      body: input.body.trim(),
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }).lean();
    if (recentDup) {
      return {
        status: 'pending',
        message: 'Thanks! Your comment is awaiting moderation.',
      };
    }
  }

  const status: CommentStatus = spam.spam ? 'spam' : 'pending';

  await Comment.create({
    contentType: input.contentType,
    contentSlug,
    parentId: parentObjectId ?? null,
    name: input.name.trim().slice(0, 80),
    email: input.email.trim().toLowerCase().slice(0, 200),
    body: input.body.trim().slice(0, 4000),
    status,
    ipHash,
    userAgent: (input.userAgent ?? '').slice(0, 300),
  });

  if (status === 'spam') {
    return { status, message: 'Thanks! Your comment has been received.' };
  }
  return {
    status,
    message: 'Thanks! Your comment will appear after moderation.',
  };
}
