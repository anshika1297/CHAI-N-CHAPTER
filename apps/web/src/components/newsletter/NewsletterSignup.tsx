'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ArrowRight, Mail } from 'lucide-react';
import { subscribe } from '@/lib/api';
import { saveSubscriberSessionFromSubscribe } from '@/lib/subscriberSession';
import { buildSubscribeSource, trackNewsletterEvent } from '@/lib/newsletter/tracking';
import type { NewsletterCopy } from '@/lib/newsletter/variants';
import { useIsSubscriber } from '@/lib/newsletter/useIsSubscriber';

export type NewsletterLayout = 'inline' | 'section' | 'compact' | 'sticky';

type Props = {
  copy: NewsletterCopy;
  placement: string;
  contentSlug?: string;
  layout?: NewsletterLayout;
  className?: string;
  id?: string;
  showNameField?: boolean;
};

export default function NewsletterSignup({
  copy,
  placement,
  contentSlug,
  layout = 'inline',
  className = '',
  id,
  showNameField = false,
}: Props) {
  const isSubscriber = useIsSubscriber();
  const autoId = useId();
  const rootId = id ?? `newsletter-${autoId}`;
  const emailId = `${rootId}-email`;
  const nameId = `${rootId}-name`;
  const rootRef = useRef<HTMLDivElement>(null);
  const impressedRef = useRef(false);

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const el = rootRef.current;
    if (!el || impressedRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !impressedRef.current) {
          impressedRef.current = true;
          trackNewsletterEvent('impression', placement);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [placement]);

  if (isSubscriber && layout !== 'sticky') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setStatus('error');
      setMessage('Please enter your email address.');
      return;
    }
    setStatus('loading');
    setMessage('');
    trackNewsletterEvent('submit', placement);
    try {
      const source = buildSubscribeSource(placement, contentSlug);
      const result = await subscribe(trimmed, { name: name.trim() || undefined, source });
      saveSubscriberSessionFromSubscribe(result, trimmed);
      trackNewsletterEvent('success', placement);
      setStatus('success');
      setEmail('');
      setName('');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div
        ref={rootRef}
        className={`rounded-2xl border border-sage/30 bg-cream-light p-5 sm:p-6 ${className}`}
        role="status"
      >
        <p className="font-serif text-lg text-chai-brown mb-1">You&apos;re on the list!</p>
        <p className="font-body text-sm text-chai-brown-light">
          Thank you for subscribing. Watch your inbox for reviews, recommendations, and bookish updates.
        </p>
      </div>
    );
  }

  const isSticky = layout === 'sticky';
  const isSection = layout === 'section';

  return (
    <div
      ref={rootRef}
      id={rootId}
      className={
        isSticky
          ? `w-full ${className}`
          : isSection
            ? `text-center ${className}`
            : `rounded-2xl border border-chai-brown/10 bg-cream-light/80 p-5 sm:p-6 ${className}`
      }
    >
      <div className={isSection ? 'max-w-xl mx-auto' : ''}>
        <div className={`flex items-start gap-3 ${isSection ? 'justify-center mb-4' : 'mb-3'}`}>
          {!isSticky ? (
            <div className="hidden sm:flex w-10 h-10 rounded-full bg-terracotta/15 text-terracotta items-center justify-center shrink-0">
              <Mail size={18} />
            </div>
          ) : null}
          <div className={isSection ? 'text-center' : ''}>
            <h2
              className={
                isSticky
                  ? 'font-serif text-base text-chai-brown leading-snug'
                  : isSection
                    ? 'section-heading mb-1'
                    : 'font-serif text-lg sm:text-xl text-chai-brown leading-snug'
              }
            >
              {copy.headline}
            </h2>
            <p
              className={
                isSticky
                  ? 'font-body text-xs text-chai-brown-light mt-0.5 line-clamp-2'
                  : 'font-body text-sm text-chai-brown-light mt-1 leading-relaxed'
              }
            >
              {copy.subline}
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className={
            isSticky
              ? 'flex gap-2 items-center'
              : isSection
                ? 'bg-cream-light border border-chai-brown/10 rounded-2xl p-5 sm:p-6 text-left max-w-md mx-auto'
                : 'space-y-3'
          }
        >
          <div className={isSticky ? 'flex-1 min-w-0' : showNameField ? 'grid sm:grid-cols-2 gap-3' : ''}>
            <input
              id={emailId}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={status === 'loading'}
              aria-label="Email address"
              className={
                isSticky
                  ? 'w-full px-3 py-2.5 text-sm border border-chai-brown/20 rounded-lg font-body focus:outline-none focus:ring-2 focus:ring-terracotta disabled:opacity-50'
                  : 'w-full px-4 py-2.5 border border-chai-brown/20 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-terracotta disabled:opacity-50'
              }
            />
            {showNameField && !isSticky ? (
              <input
                id={nameId}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name (optional)"
                disabled={status === 'loading'}
                className="w-full px-4 py-2.5 border border-chai-brown/20 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-terracotta disabled:opacity-50"
              />
            ) : null}
          </div>
          <button
            type="submit"
            disabled={status === 'loading'}
            className={
              isSticky
                ? 'btn-terracotta shrink-0 px-4 py-2.5 text-sm disabled:opacity-50'
                : 'btn-terracotta w-full sm:w-auto inline-flex items-center justify-center gap-2 disabled:opacity-50'
            }
          >
            {status === 'loading' ? '…' : 'Subscribe'}
            {!isSticky ? <ArrowRight size={16} /> : null}
          </button>
        </form>
        {message ? (
          <p className={`mt-2 text-xs font-body ${status === 'error' ? 'text-red-600' : 'text-chai-brown-light'}`}>
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
