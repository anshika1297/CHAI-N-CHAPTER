'use client';

import { useState } from 'react';
import { subscribe } from '@/lib/api';

export default function SubscribePageContent() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

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
      await subscribe(trimmed, { name: name.trim() || undefined, source: 'subscribe-page' });
      setStatus('success');
      setMessage('You’re subscribed! Check your inbox for updates.');
      setEmail('');
      setName('');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  return (
    <section className="pt-24 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-xl mx-auto text-center">
        <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown mb-3">
          Subscribe to the Reading List
        </h1>
        <p className="text-chai-brown-light font-body text-lg mb-8">
          Get book recommendations, blog updates, and reading lists straight to your inbox.
        </p>

        {status === 'success' ? (
          <div className="bg-cream-light border border-chai-brown/10 rounded-2xl p-8">
            <p className="text-terracotta font-body text-lg mb-2">✓ {message}</p>
            <p className="text-chai-brown-light text-sm mb-2">
              You can unsubscribe at any time from the link in our emails.
            </p>
            <a href="/subscribe/unsubscribe" className="text-chai-brown-light text-sm hover:text-terracotta underline">
              Unsubscribe
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-cream-light border border-chai-brown/10 rounded-2xl p-6 sm:p-8 text-left">
            <div className="mb-4">
              <label htmlFor="subscribe-email" className="block font-body text-sm font-medium text-chai-brown mb-2">
                Email address *
              </label>
              <input
                id="subscribe-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={status === 'loading'}
                className="w-full px-4 py-3 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body disabled:opacity-50"
              />
            </div>
            <div className="mb-6">
              <label htmlFor="subscribe-name" className="block font-body text-sm font-medium text-chai-brown mb-2">
                Name (optional)
              </label>
              <input
                id="subscribe-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
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
              className="w-full py-3 bg-terracotta text-white font-body font-medium rounded-lg hover:bg-terracotta/90 transition-colors disabled:opacity-50"
            >
              {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
            </button>
          </form>
        )}
        <p className="mt-6 text-chai-brown-light text-sm">
          <a href="/subscribe/unsubscribe" className="hover:text-terracotta transition-colors underline">
            Unsubscribe from the newsletter
          </a>
        </p>
      </div>
    </section>
  );
}
