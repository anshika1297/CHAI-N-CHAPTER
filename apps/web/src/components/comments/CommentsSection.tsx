'use client';

import { useCallback, useEffect, useState } from 'react';
import { MessageCircle, Reply } from 'lucide-react';
import {
  DISCUSSION_PROMPTS,
  fetchComments,
  submitComment,
  type CommentContentType,
  type CommentNode,
} from '@/lib/comments';
import CommentForm, { type CommentSubmitValues } from './CommentForm';

type Props = {
  contentType: CommentContentType;
  slug: string;
};

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function CommentItem({
  node,
  depth,
  onReply,
}: {
  node: CommentNode;
  depth: number;
  onReply: (parentId: string) => void;
}) {
  const maxIndent = depth >= 2;
  return (
    <li className={depth > 0 ? 'mt-4' : ''}>
      <article
        className={`rounded-xl border border-chai-brown/10 bg-cream-light/80 p-4 sm:p-5 ${
          maxIndent ? 'sm:ml-0' : depth > 0 ? 'sm:ml-6' : ''
        }`}
      >
        <header className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
          <span className="font-sans text-sm font-medium text-chai-brown">{node.name}</span>
          <time className="text-xs text-chai-brown-light" dateTime={node.createdAt}>
            {formatWhen(node.createdAt)}
          </time>
        </header>
        <p className="font-body text-sm sm:text-base text-chai-brown/90 whitespace-pre-wrap leading-relaxed">
          {node.body}
        </p>
        {depth < 2 ? (
          <button
            type="button"
            onClick={() => onReply(node.id)}
            className="mt-3 inline-flex items-center gap-1 text-xs font-sans text-terracotta hover:underline"
          >
            <Reply size={14} aria-hidden />
            Reply
          </button>
        ) : null}
      </article>
      {node.replies.length > 0 ? (
        <ul className="mt-3 space-y-0 border-l-2 border-chai-brown/8 pl-3 sm:pl-4 ml-2 sm:ml-3">
          {node.replies.map((child) => (
            <CommentItem key={child.id} node={child} depth={depth + 1} onReply={onReply} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export default function CommentsSection({ contentType, slug }: Props) {
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchComments(contentType, slug);
      setComments(data.comments);
      setCount(data.count);
    } catch {
      setComments([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [contentType, slug]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (values: CommentSubmitValues) => {
    const result = await submitComment({
      contentType,
      contentSlug: slug,
      body: values.body,
      website: values.website,
      parentId: replyToId ?? undefined,
      ...(values.mode === 'subscriber'
        ? { subscriberToken: values.subscriberToken }
        : { name: values.name, email: values.email }),
    });
    setFlash(result.message);
    setReplyToId(null);
    await load();
  };

  const prompt = DISCUSSION_PROMPTS[contentType];

  return (
    <section className="mb-12 pt-10 border-t border-chai-brown/10" aria-labelledby="comments-heading">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <MessageCircle size={22} className="text-terracotta shrink-0" aria-hidden />
        <h2 id="comments-heading" className="font-serif text-2xl text-chai-brown">
          Discussion
          {count > 0 ? (
            <span className="ml-2 font-sans text-base font-normal text-chai-brown-light">
              ({count} comment{count === 1 ? '' : 's'})
            </span>
          ) : null}
        </h2>
      </div>
      <p className="font-body text-sm text-chai-brown-light mb-6 italic">{prompt}</p>

      {flash ? (
        <p className="mb-4 px-4 py-3 rounded-lg bg-sage/10 text-sage text-sm font-body border border-sage/20">
          {flash}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-chai-brown-light font-body py-4">Loading comments…</p>
      ) : comments.length > 0 ? (
        <ul className="space-y-4 mb-8">
          {comments.map((node) => (
            <CommentItem key={node.id} node={node} depth={0} onReply={setReplyToId} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-chai-brown-light font-body mb-8">
          No comments yet — be the first to share your thoughts.
        </p>
      )}

      <CommentForm
        onSubmit={handleSubmit}
        replyToId={replyToId}
        onCancelReply={() => setReplyToId(null)}
      />
      <p className="mt-3 text-xs text-chai-brown-light font-body">
        Comments are moderated before they appear. Your email is never shown publicly.
      </p>
    </section>
  );
}
