'use client';

import { useEffect, useState } from 'react';
import { Send, X, UserCircle } from 'lucide-react';
import { fetchSubscriberCommentToken } from '@/lib/api';
import {
  clearSubscriberSession,
  getSubscriberSession,
  saveSubscriberSession,
  type SubscriberSession,
} from '@/lib/subscriberSession';

export type CommentSubmitValues =
  | { mode: 'guest'; name: string; email: string; body: string; website: string }
  | { mode: 'subscriber'; body: string; website: string; subscriberToken: string };

export default function CommentForm({
  onSubmit,
  replyToId,
  onCancelReply,
}: {
  onSubmit: (values: CommentSubmitValues) => Promise<void>;
  replyToId: string | null;
  onCancelReply: () => void;
}) {
  const [session, setSession] = useState<SubscriberSession | null>(null);
  const [mode, setMode] = useState<'subscriber' | 'guest' | 'verify'>('guest');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [verifyEmail, setVerifyEmail] = useState('');
  const [body, setBody] = useState('');
  const [website, setWebsite] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = getSubscriberSession();
    if (saved) {
      setSession(saved);
      setMode('subscriber');
    }
  }, []);

  const handleVerifySubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setVerifying(true);
    try {
      const result = await fetchSubscriberCommentToken(verifyEmail);
      const next: SubscriberSession = {
        commentToken: result.commentToken,
        name: result.subscriberName,
        email: result.email,
      };
      saveSubscriberSession(next);
      setSession(next);
      setMode('subscriber');
      setVerifyEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not verify subscription');
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'subscriber' && session) {
        await onSubmit({
          mode: 'subscriber',
          body,
          website,
          subscriberToken: session.commentToken,
        });
      } else {
        await onSubmit({ mode: 'guest', name, email, body, website });
      }
      setBody('');
      if (replyToId) onCancelReply();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const switchToGuest = () => {
    setMode('guest');
    setError(null);
  };

  const signOutSubscriber = () => {
    clearSubscriberSession();
    setSession(null);
    setMode('guest');
    setError(null);
  };

  if (mode === 'verify') {
    return (
      <form
        onSubmit={handleVerifySubscriber}
        className="rounded-xl border border-chai-brown/12 bg-cream/60 p-4 sm:p-6"
      >
        <p className="font-body text-sm text-chai-brown mb-4">
          Enter the email you used to subscribe. We&apos;ll use your subscriber name for comments.
        </p>
        <label htmlFor="subscriber-verify-email" className="block text-xs font-sans font-medium text-chai-brown mb-1">
          Subscriber email
        </label>
        <input
          id="subscriber-verify-email"
          type="email"
          required
          value={verifyEmail}
          onChange={(e) => setVerifyEmail(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-chai-brown/20 bg-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/40"
          autoComplete="email"
        />
        {error ? <p className="mt-3 text-sm text-red-600 font-body">{error}</p> : null}
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={verifying}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-terracotta text-cream font-sans text-sm font-medium hover:bg-terracotta/90 disabled:opacity-60"
          >
            {verifying ? 'Checking…' : 'Continue as subscriber'}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode(session ? 'subscriber' : 'guest');
              setError(null);
            }}
            className="text-sm font-sans text-chai-brown-light hover:text-chai-brown"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-chai-brown/12 bg-cream/60 p-4 sm:p-6">
      {replyToId ? (
        <div className="mb-4 flex items-center justify-between gap-2 text-sm font-sans text-terracotta">
          <span>Replying to a comment</span>
          <button type="button" onClick={onCancelReply} className="inline-flex items-center gap-1 hover:underline">
            <X size={14} /> Cancel
          </button>
        </div>
      ) : null}

      {mode === 'subscriber' && session ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-sage/10 border border-sage/20 px-3 py-2.5">
          <span className="inline-flex items-center gap-2 text-sm font-sans text-chai-brown">
            <UserCircle size={18} className="text-sage shrink-0" aria-hidden />
            Posting as <strong>{session.name}</strong>
          </span>
          <button
            type="button"
            onClick={signOutSubscriber}
            className="text-xs font-sans text-chai-brown-light hover:text-terracotta"
          >
            Not you?
          </button>
        </div>
      ) : (
        <p className="mb-4 font-body text-sm text-chai-brown-light">
          Newsletter subscriber?{' '}
          <button
            type="button"
            onClick={() => {
              setMode('verify');
              setError(null);
            }}
            className="text-terracotta hover:underline font-sans"
          >
            Post with your subscriber email
          </button>
        </p>
      )}

      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
        <label htmlFor="comment-website">Website</label>
        <input
          id="comment-website"
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      {mode === 'guest' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="comment-name" className="block text-xs font-sans font-medium text-chai-brown mb-1">
              Name
            </label>
            <input
              id="comment-name"
              type="text"
              required
              minLength={2}
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-chai-brown/20 bg-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/40"
              autoComplete="name"
            />
          </div>
          <div>
            <label htmlFor="comment-email" className="block text-xs font-sans font-medium text-chai-brown mb-1">
              Email <span className="font-normal text-chai-brown-light">(private)</span>
            </label>
            <input
              id="comment-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-chai-brown/20 bg-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/40"
              autoComplete="email"
            />
          </div>
        </div>
      ) : null}

      <div className={mode === 'guest' ? 'mt-4' : ''}>
        <label htmlFor="comment-body" className="block text-xs font-sans font-medium text-chai-brown mb-1">
          Your comment
        </label>
        <textarea
          id="comment-body"
          required
          minLength={3}
          maxLength={4000}
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share your thoughts…"
          className="w-full px-3 py-2.5 rounded-lg border border-chai-brown/20 bg-white font-body text-sm resize-y min-h-[6rem] focus:outline-none focus:ring-2 focus:ring-terracotta/40"
        />
      </div>

      {error ? <p className="mt-3 text-sm text-red-600 font-body">{error}</p> : null}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-terracotta text-cream font-sans text-sm font-medium hover:bg-terracotta/90 disabled:opacity-60 transition-colors"
        >
          <Send size={16} aria-hidden />
          {submitting ? 'Sending…' : replyToId ? 'Post reply' : 'Post comment'}
        </button>
        {mode === 'subscriber' ? (
          <button
            type="button"
            onClick={switchToGuest}
            className="text-xs font-sans text-chai-brown-light hover:text-terracotta"
          >
            Post as guest instead
          </button>
        ) : null}
      </div>
    </form>
  );
}
