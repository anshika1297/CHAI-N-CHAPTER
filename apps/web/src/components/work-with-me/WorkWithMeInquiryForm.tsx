'use client';

import { useState } from 'react';
import { CheckCircle, Send } from 'lucide-react';
import { submitWorkWithMeMessage } from '@/lib/api';
import { workWithMeServiceOptions } from '@/lib/workWithMeContent';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Props = {
  /** Side-by-side layout with FAQ — single-column fields, no max-width cap */
  embedded?: boolean;
};

export default function WorkWithMeInquiryForm({ embedded = false }: Props) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    bookTitle: '',
    genre: '',
    service: '',
    timeline: '',
    message: '',
    website: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.website.trim()) return;
    if (!form.name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!EMAIL_RE.test(form.email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!form.service) {
      setError('Please select a service.');
      return;
    }
    if (!form.message.trim()) {
      setError('Please add a short message about your project.');
      return;
    }

    const serviceLabel = workWithMeServiceOptions.find((o) => o.value === form.service)?.label ?? form.service;

    setSubmitting(true);
    try {
      await submitWorkWithMeMessage({
        name: form.name.trim(),
        email: form.email.trim(),
        service: serviceLabel,
        bookTitle: form.bookTitle.trim() || undefined,
        genre: form.genre.trim() || undefined,
        timeline: form.timeline.trim() || undefined,
        message: form.message.trim(),
        website: form.website,
      });
      setSuccess(true);
      setForm({
        name: '',
        email: '',
        bookTitle: '',
        genre: '',
        service: '',
        timeline: '',
        message: '',
        website: '',
      });
      setTimeout(() => setSuccess(false), 8000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const fieldGrid = embedded ? 'grid gap-5' : 'grid sm:grid-cols-2 gap-5';

  return (
    <div
      className={`bg-cream-light rounded-2xl p-6 sm:p-8 border border-chai-brown/10 h-full ${
        embedded ? '' : 'max-w-2xl mx-auto'
      }`}
    >
      <h2
        className={`font-serif text-2xl sm:text-3xl text-chai-brown mb-2 ${
          embedded ? 'text-left' : 'text-center'
        }`}
      >
        Start a collaboration
      </h2>
      <p
        className={`font-body text-sm text-chai-brown-light mb-8 ${
          embedded ? 'text-left' : 'text-center'
        }`}
      >
        Share your project details. I typically respond within a few business days.
      </p>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3" role="status">
          <CheckCircle size={20} className="text-green-600 shrink-0 mt-0.5" />
          <p className="text-green-800 font-body text-sm">
            Thank you — your inquiry was sent. I&apos;ll get back to you soon.
          </p>
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 font-body text-sm" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <input
          type="text"
          name="website"
          value={form.website}
          onChange={onChange}
          tabIndex={-1}
          autoComplete="off"
          className="absolute opacity-0 pointer-events-none h-0 w-0"
          aria-hidden
        />

        <div className={fieldGrid}>
          <div>
            <label htmlFor="wwm-name" className="block text-sm font-sans font-medium text-chai-brown mb-1.5">
              Name *
            </label>
            <input
              id="wwm-name"
              name="name"
              required
              value={form.name}
              onChange={onChange}
              className="w-full px-4 py-3 rounded-lg border border-chai-brown/20 bg-cream focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none font-body text-chai-brown"
            />
          </div>
          <div>
            <label htmlFor="wwm-email" className="block text-sm font-sans font-medium text-chai-brown mb-1.5">
              Email *
            </label>
            <input
              id="wwm-email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={onChange}
              className="w-full px-4 py-3 rounded-lg border border-chai-brown/20 bg-cream focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none font-body text-chai-brown"
            />
          </div>
        </div>

        <div className={fieldGrid}>
          <div>
            <label htmlFor="wwm-book" className="block text-sm font-sans font-medium text-chai-brown mb-1.5">
              Book title
            </label>
            <input
              id="wwm-book"
              name="bookTitle"
              value={form.bookTitle}
              onChange={onChange}
              className="w-full px-4 py-3 rounded-lg border border-chai-brown/20 bg-cream focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none font-body text-chai-brown"
            />
          </div>
          <div>
            <label htmlFor="wwm-genre" className="block text-sm font-sans font-medium text-chai-brown mb-1.5">
              Genre
            </label>
            <input
              id="wwm-genre"
              name="genre"
              value={form.genre}
              onChange={onChange}
              placeholder="e.g. Literary fiction"
              className="w-full px-4 py-3 rounded-lg border border-chai-brown/20 bg-cream focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none font-body text-chai-brown"
            />
          </div>
        </div>

        <div className={fieldGrid}>
          <div>
            <label htmlFor="wwm-service" className="block text-sm font-sans font-medium text-chai-brown mb-1.5">
              Service required *
            </label>
            <select
              id="wwm-service"
              name="service"
              required
              value={form.service}
              onChange={onChange}
              className="w-full px-4 py-3 rounded-lg border border-chai-brown/20 bg-cream focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none font-body text-chai-brown"
            >
              <option value="">Select a service…</option>
              {workWithMeServiceOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="wwm-timeline" className="block text-sm font-sans font-medium text-chai-brown mb-1.5">
              Timeline
            </label>
            <input
              id="wwm-timeline"
              name="timeline"
              value={form.timeline}
              onChange={onChange}
              placeholder="e.g. Review by March 2026"
              className="w-full px-4 py-3 rounded-lg border border-chai-brown/20 bg-cream focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none font-body text-chai-brown"
            />
          </div>
        </div>

        <div>
          <label htmlFor="wwm-message" className="block text-sm font-sans font-medium text-chai-brown mb-1.5">
            Message *
          </label>
          <textarea
            id="wwm-message"
            name="message"
            required
            rows={5}
            value={form.message}
            onChange={onChange}
            placeholder="Briefly describe your project, goals, and any links (ARC, sample chapters, etc.)."
            className="w-full px-4 py-3 rounded-lg border border-chai-brown/20 bg-cream focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none font-body text-chai-brown resize-y min-h-[120px]"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto px-8 py-3 bg-terracotta text-cream font-sans font-medium rounded-full hover:bg-terracotta/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Send size={18} aria-hidden />
          {submitting ? 'Sending…' : 'Send inquiry'}
        </button>
      </form>
    </div>
  );
}
