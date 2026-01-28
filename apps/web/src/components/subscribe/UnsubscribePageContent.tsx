'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { unsubscribe } from '@/lib/api';

function UnsubscribeForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam && typeof emailParam === 'string') {
      setEmail(decodeURIComponent(emailParam).trim());
    }
  }, [searchParams]);

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
    try {
      await unsubscribe(trimmed);
      setStatus('success');
      setMessage('You have been unsubscribed. You will no longer receive newsletters.');
      setEmail('');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  return (
    <section className="pt-24 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-xl mx-auto text-center">
        <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown mb-3">
          Unsubscribe
        </h1>
        <p className="text-chai-brown-light font-body text-lg mb-8">
          Enter the email address you used to subscribe. You will no longer receive our newsletter.
        </p>

        {status === 'success' ? (
          <div className="bg-cream-light border border-chai-brown/10 rounded-2xl p-8">
            <p className="text-chai-brown font-body text-lg mb-4">{message}</p>
            <Link
              href="/subscribe"
              className="text-terracotta font-sans text-sm font-medium hover:underline"
            >
              Subscribe again →
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-cream-light border border-chai-brown/10 rounded-2xl p-6 sm:p-8 text-left">
            <div className="mb-6">
              <label htmlFor="unsubscribe-email" className="block font-body text-sm font-medium text-chai-brown mb-2">
                Email address *
              </label>
              <input
                id="unsubscribe-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={status === 'loading'}
                className="w-full px-4 py-3 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body disabled:opacity-50"
              />
            </div>
            {message && (
              <p className={`mb-4 text-sm font-body ${status === 'error' ? 'text-red-600' : 'text-chai-brown-light'}`}>
                {message}
              </p>
            )}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-3 bg-chai-brown/80 text-white font-body font-medium rounded-lg hover:bg-chai-brown transition-colors disabled:opacity-50"
            >
              {status === 'loading' ? 'Unsubscribing…' : 'Unsubscribe'}
            </button>
          </form>
        )}

        <p className="mt-6 text-chai-brown-light text-sm">
          <Link href="/" className="hover:text-terracotta transition-colors">← Back to home</Link>
        </p>
      </div>
    </section>
  );
}

export default function UnsubscribePageContent() {
  return (
    <Suspense fallback={<div className="pt-24 text-center font-body text-chai-brown-light">Loading…</div>}>
      <UnsubscribeForm />
    </Suspense>
  );
}
