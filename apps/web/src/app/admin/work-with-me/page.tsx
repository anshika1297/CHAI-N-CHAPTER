'use client';

import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, ExternalLink, Lock } from 'lucide-react';
import Link from 'next/link';
import { getPageSettings, putPageSettings } from '@/lib/api';
import {
  defaultWorkWithMeTestimonials,
  resolveWorkWithMeTestimonials,
  resolveAdditionalFaq,
  workWithMeTestimonialSourceOptions,
  workWithMeFaq,
  formatTestimonialForSave,
  formatFaqForSave,
  type WorkWithMeTestimonial,
  type WorkWithMeTestimonialSource,
  type WorkWithMeFaqItem,
} from '@/lib/workWithMeContent';
import TestimonialSourceBadge from '@/components/work-with-me/TestimonialSourceBadge';
import PageLoading from '@/components/PageLoading';

type AdminTestimonial = WorkWithMeTestimonial & { id: string };
type AdminFaq = WorkWithMeFaqItem & { id: string };

function toAdminTestimonials(items: WorkWithMeTestimonial[]): AdminTestimonial[] {
  return items.map((t, i) => ({
    ...t,
    id: `t-${i}-${t.author.slice(0, 8)}`,
  }));
}

function toAdminFaq(items: WorkWithMeFaqItem[]): AdminFaq[] {
  return items.map((f, i) => ({
    ...f,
    id: `f-${i}-${f.question.slice(0, 12)}`,
  }));
}

export default function AdminWorkWithMePage() {
  const [testimonials, setTestimonials] = useState<AdminTestimonial[]>(
    toAdminTestimonials(defaultWorkWithMeTestimonials)
  );
  const [additionalFaq, setAdditionalFaq] = useState<AdminFaq[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    getPageSettings('work-with-me')
      .then(({ content }) => {
        setTestimonials(toAdminTestimonials(resolveWorkWithMeTestimonials(content)));
        setAdditionalFaq(toAdminFaq(resolveAdditionalFaq(content)));
      })
      .catch(() => setMessage({ type: 'error', text: 'Failed to load Work With Me settings' }))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    const cleanedTestimonials = testimonials
      .map((t) => formatTestimonialForSave(t))
      .filter((t): t is WorkWithMeTestimonial => t !== null);

    if (cleanedTestimonials.length === 0) {
      setMessage({ type: 'error', text: 'Add at least one testimonial with a quote and name.' });
      return;
    }

    const cleanedFaq = additionalFaq
      .map((f) => formatFaqForSave(f))
      .filter((f): f is WorkWithMeFaqItem => f !== null);

    const incompleteFaq = additionalFaq.some((f) => {
      const q = f.question.trim();
      const a = f.answer.trim();
      return (q && !a) || (!q && a);
    });
    if (incompleteFaq) {
      setMessage({ type: 'error', text: 'Each additional FAQ needs both a question and an answer.' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      await putPageSettings('work-with-me', {
        testimonials: cleanedTestimonials,
        additionalFaq: cleanedFaq,
      });
      setMessage({ type: 'success', text: 'Saved! Refresh the public page to see updates.' });
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const addTestimonial = () => {
    setTestimonials((prev) => [
      ...prev,
      { id: `new-${Date.now()}`, quote: '', author: '', title: '' },
    ]);
  };

  const removeTestimonial = (id: string) => {
    setTestimonials((prev) => prev.filter((t) => t.id !== id));
  };

  const updateTestimonial = (
    id: string,
    field: keyof WorkWithMeTestimonial,
    value: string | WorkWithMeTestimonialSource | undefined
  ) => {
    setTestimonials((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        if (field === 'source') {
          const source =
            value === 'google' || value === 'linkedin' ? value : undefined;
          return { ...t, source };
        }
        return { ...t, [field]: value };
      })
    );
  };

  const addFaq = () => {
    setAdditionalFaq((prev) => [...prev, { id: `faq-${Date.now()}`, question: '', answer: '' }]);
  };

  const removeFaq = (id: string) => {
    setAdditionalFaq((prev) => prev.filter((f) => f.id !== id));
  };

  const updateFaq = (id: string, field: keyof WorkWithMeFaqItem, value: string) => {
    setAdditionalFaq((prev) => prev.map((f) => (f.id === id ? { ...f, [field]: value } : f)));
  };

  if (loading) {
    return <PageLoading message="Loading Work With Me settings…" />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown mb-2">Work With Me</h1>
          <p className="font-body text-chai-brown-light">
            Edit testimonials and extra FAQ. Core FAQ and services stay in code.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-terracotta text-white px-6 py-2 rounded-lg hover:bg-terracotta/90 transition-colors font-body disabled:opacity-50 shrink-0"
        >
          <Save size={20} />
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      {message && (
        <div
          className={`mb-6 px-4 py-3 rounded-lg font-body text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-cream-light rounded-xl border border-chai-brown/10 p-6 mb-8">
        <p className="font-body text-sm text-chai-brown-light">
          Form submissions:{' '}
          <Link href="/admin/messages?source=work-with-me" className="text-terracotta hover:underline">
            View enquiries
          </Link>
          {' · '}
          <a
            href="/work-with-me"
            target="_blank"
            rel="noopener noreferrer"
            className="text-terracotta hover:underline inline-flex items-center gap-1"
          >
            Preview page <ExternalLink size={12} />
          </a>
        </p>
      </div>

      {/* Testimonials */}
      <div className="space-y-6 mb-12">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-serif text-xl text-chai-brown">What Authors Say</h2>
          <button
            type="button"
            onClick={addTestimonial}
            className="flex items-center gap-2 text-sm font-sans text-terracotta hover:underline"
          >
            <Plus size={16} /> Add testimonial
          </button>
        </div>

        {testimonials.map((t, index) => (
          <div
            key={t.id}
            className="bg-white rounded-lg p-5 sm:p-6 border border-chai-brown/10 space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-sans text-sm font-medium text-chai-brown">#{index + 1}</span>
              <button
                type="button"
                onClick={() => removeTestimonial(t.id)}
                className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-sans"
              >
                <Trash2 size={14} /> Remove
              </button>
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-chai-brown mb-1.5">Quote *</label>
              <textarea
                rows={3}
                value={t.quote}
                onChange={(e) => updateTestimonial(t.id, 'quote', e.target.value)}
                className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body text-sm resize-y"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-body text-sm font-medium text-chai-brown mb-1.5">Name *</label>
                <input
                  type="text"
                  value={t.author}
                  onChange={(e) => updateTestimonial(t.id, 'author', e.target.value)}
                  className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body text-sm"
                />
              </div>
              <div>
                <label className="block font-body text-sm font-medium text-chai-brown mb-1.5">
                  Title / role <span className="font-normal text-chai-brown-light">(optional)</span>
                </label>
                <input
                  type="text"
                  value={t.title ?? ''}
                  onChange={(e) => updateTestimonial(t.id, 'title', e.target.value)}
                  className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-chai-brown mb-1.5">
                Source <span className="font-normal text-chai-brown-light">(optional)</span>
              </label>
              <select
                value={t.source ?? ''}
                onChange={(e) =>
                  updateTestimonial(
                    t.id,
                    'source',
                    (e.target.value || undefined) as WorkWithMeTestimonialSource | undefined
                  )
                }
                className="w-full sm:max-w-xs px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body text-sm"
              >
                <option value="">No source</option>
                {workWithMeTestimonialSourceOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {t.source ? (
                <div className="mt-2">
                  <TestimonialSourceBadge source={t.source} />
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="space-y-6">
        <div>
          <h2 className="font-serif text-xl text-chai-brown mb-1">FAQ</h2>
          <p className="font-body text-sm text-chai-brown-light">
            Core questions below are permanent. Add more below as your services evolve.
          </p>
        </div>

        <div className="bg-cream-light rounded-lg border border-chai-brown/10 p-5 space-y-3">
          <p className="flex items-center gap-2 font-sans text-sm font-medium text-chai-brown">
            <Lock size={14} className="text-chai-brown-light" />
            Permanent FAQ (in code)
          </p>
          <ul className="space-y-2">
            {workWithMeFaq.map((item) => (
              <li key={item.question} className="font-body text-sm text-chai-brown-light">
                <span className="text-chai-brown font-medium">{item.question}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between gap-4">
          <h3 className="font-sans text-sm font-medium text-chai-brown">Additional FAQ</h3>
          <button
            type="button"
            onClick={addFaq}
            className="flex items-center gap-2 text-sm font-sans text-terracotta hover:underline"
          >
            <Plus size={16} /> Add FAQ
          </button>
        </div>

        {additionalFaq.length === 0 ? (
          <p className="font-body text-sm text-chai-brown-light">
            No extra FAQ yet. Click &quot;Add FAQ&quot; when you need more.
          </p>
        ) : (
          additionalFaq.map((f, index) => (
            <div
              key={f.id}
              className="bg-white rounded-lg p-5 sm:p-6 border border-chai-brown/10 space-y-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-sans text-sm font-medium text-chai-brown">Extra #{index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeFaq(f.id)}
                  className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-sans"
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>
              <div>
                <label className="block font-body text-sm font-medium text-chai-brown mb-1.5">
                  Question *
                </label>
                <input
                  type="text"
                  value={f.question}
                  onChange={(e) => updateFaq(f.id, 'question', e.target.value)}
                  placeholder="e.g. What is your typical turnaround time?"
                  className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body text-sm"
                />
              </div>
              <div>
                <label className="block font-body text-sm font-medium text-chai-brown mb-1.5">Answer *</label>
                <textarea
                  rows={2}
                  value={f.answer}
                  onChange={(e) => updateFaq(f.id, 'answer', e.target.value)}
                  placeholder="Short, direct answer for featured snippets."
                  className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body text-sm resize-y"
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
