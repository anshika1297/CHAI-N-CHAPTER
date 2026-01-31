'use client';

import { useState, useEffect } from 'react';
import { Save, Send } from 'lucide-react';
import { getPageSettings, putPageSettings, sendTestEmail } from '@/lib/api';
import PageLoading from '@/components/PageLoading';

const defaultEmailSettings = {
  fromEmail: '',
  subject: '',
  bodyHtml: '',
  signature: '',
  smtpHost: '',
  smtpPort: '',
  smtpSecure: false,
  smtpUser: '',
  smtpPass: '',
  bookClubAnnounceSubject: '',
  bookClubAnnounceBodyHtml: '',
  blogAnnounceSubject: '',
  blogAnnounceBodyHtml: '',
  recommendationAnnounceSubject: '',
  recommendationAnnounceBodyHtml: '',
  musingsAnnounceSubject: '',
  musingsAnnounceBodyHtml: '',
};

export default function AdminEmailSettingsPage() {
  const [form, setForm] = useState(defaultEmailSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testTo, setTestTo] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    getPageSettings('email-settings')
      .then(({ content }) => {
        if (content && typeof content === 'object' && !Array.isArray(content)) {
          const c = content as Record<string, unknown>;
          setForm({
            fromEmail: typeof c.fromEmail === 'string' ? c.fromEmail : '',
            subject: typeof c.subject === 'string' ? c.subject : '',
            bodyHtml: typeof c.bodyHtml === 'string' ? c.bodyHtml : '',
            signature: typeof c.signature === 'string' ? c.signature : '',
            smtpHost: typeof c.smtpHost === 'string' ? c.smtpHost : '',
            smtpPort: typeof c.smtpPort === 'number' ? String(c.smtpPort) : typeof c.smtpPort === 'string' ? c.smtpPort : '',
            smtpSecure: c.smtpSecure === true || c.smtpSecure === 'true',
            smtpUser: typeof c.smtpUser === 'string' ? c.smtpUser : '',
            smtpPass: '', // Never returned by API; leave blank = keep current
            bookClubAnnounceSubject: typeof c.bookClubAnnounceSubject === 'string' ? c.bookClubAnnounceSubject : '',
            bookClubAnnounceBodyHtml: typeof c.bookClubAnnounceBodyHtml === 'string' ? c.bookClubAnnounceBodyHtml : '',
            blogAnnounceSubject: typeof c.blogAnnounceSubject === 'string' ? c.blogAnnounceSubject : '',
            blogAnnounceBodyHtml: typeof c.blogAnnounceBodyHtml === 'string' ? c.blogAnnounceBodyHtml : '',
            recommendationAnnounceSubject: typeof c.recommendationAnnounceSubject === 'string' ? c.recommendationAnnounceSubject : '',
            recommendationAnnounceBodyHtml: typeof c.recommendationAnnounceBodyHtml === 'string' ? c.recommendationAnnounceBodyHtml : '',
            musingsAnnounceSubject: typeof c.musingsAnnounceSubject === 'string' ? c.musingsAnnounceSubject : '',
            musingsAnnounceBodyHtml: typeof c.musingsAnnounceBodyHtml === 'string' ? c.musingsAnnounceBodyHtml : '',
          });
        }
      })
      .catch(() => setMessage({ type: 'error', text: 'Failed to load email settings' }))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const payload: Record<string, unknown> = {
        fromEmail: form.fromEmail.trim(),
        subject: form.subject.trim(),
        bodyHtml: form.bodyHtml.trim(),
        signature: form.signature.trim(),
        smtpHost: form.smtpHost.trim() || undefined,
        smtpPort: form.smtpPort.trim() ? parseInt(form.smtpPort, 10) : undefined,
        smtpSecure: form.smtpSecure,
        smtpUser: form.smtpUser.trim() || undefined,
        bookClubAnnounceSubject: form.bookClubAnnounceSubject.trim() || undefined,
        bookClubAnnounceBodyHtml: form.bookClubAnnounceBodyHtml.trim() || undefined,
        blogAnnounceSubject: form.blogAnnounceSubject.trim() || undefined,
        blogAnnounceBodyHtml: form.blogAnnounceBodyHtml.trim() || undefined,
        recommendationAnnounceSubject: form.recommendationAnnounceSubject.trim() || undefined,
        recommendationAnnounceBodyHtml: form.recommendationAnnounceBodyHtml.trim() || undefined,
        musingsAnnounceSubject: form.musingsAnnounceSubject.trim() || undefined,
        musingsAnnounceBodyHtml: form.musingsAnnounceBodyHtml.trim() || undefined,
      };
      if (form.smtpPass.trim()) payload.smtpPass = form.smtpPass;
      await putPageSettings('email-settings', payload);
      setMessage({ type: 'success', text: 'Email settings saved. Welcome and all announcement emails will use these details.' });
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    const email = testTo.trim();
    if (!email) {
      setTestResult({ type: 'error', text: 'Enter an email address to send a test to.' });
      return;
    }
    setTestSending(true);
    setTestResult(null);
    try {
      const { message: msg } = await sendTestEmail(email);
      setTestResult({ type: 'success', text: msg });
    } catch (e) {
      setTestResult({ type: 'error', text: e instanceof Error ? e.message : 'Failed to send test email' });
    } finally {
      setTestSending(false);
    }
  };

  if (loading) {
    return <PageLoading message="Loading email settings…" />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown mb-2">
            Subscriber emails
          </h1>
          <p className="font-body text-chai-brown-light">
            Configure welcome emails (on subscribe), book club announcements, and automatic emails when you publish a new book review, recommendation list, or Her Musings Verse piece. Use either server .env (SMTP_*) or the SMTP section below to set the sending account.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-terracotta text-white px-6 py-2 rounded-lg hover:bg-terracotta/90 transition-colors font-body disabled:opacity-50"
        >
          <Save size={20} />
          {saving ? 'Saving…' : 'Save'}
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

      <div className="mb-8 bg-white rounded-lg p-6 border border-chai-brown/10">
        <h2 className="font-serif text-xl text-chai-brown mb-2">Send test email</h2>
        <p className="text-sm text-chai-brown-light mb-4 font-body">
          Use either .env (SMTP_*) or the SMTP section below. Then send a test to confirm it works.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block font-body text-sm font-medium text-chai-brown mb-1">Send to (email)</label>
            <input
              type="email"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
            />
          </div>
          <button
            type="button"
            onClick={handleSendTest}
            disabled={testSending}
            className="flex items-center gap-2 bg-sage text-white px-4 py-2 rounded-lg hover:bg-sage/90 transition-colors font-body disabled:opacity-50"
          >
            <Send size={18} />
            {testSending ? 'Sending…' : 'Send test email'}
          </button>
        </div>
        {testResult && (
          <div
            className={`mt-3 px-4 py-2 rounded-lg font-body text-sm ${
              testResult.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'
            }`}
          >
            {testResult.text}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg p-6 border border-chai-brown/10">
          <h2 className="font-serif text-xl text-chai-brown mb-4">SMTP (sending account)</h2>
          <p className="text-sm text-chai-brown-light mb-4 font-body">
            Set these to send from a specific email (e.g. the.bookish.voyager@gmail.com). Leave blank to use server environment variables (SMTP_HOST, SMTP_USER, SMTP_PASS). For Gmail, use an App Password, not your regular password.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-body text-sm font-medium text-chai-brown mb-2">SMTP host</label>
              <input
                type="text"
                value={form.smtpHost}
                onChange={(e) => setForm({ ...form, smtpHost: e.target.value })}
                placeholder="e.g. smtp.gmail.com"
                className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
              />
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-chai-brown mb-2">SMTP port</label>
              <input
                type="text"
                value={form.smtpPort}
                onChange={(e) => setForm({ ...form, smtpPort: e.target.value })}
                placeholder="587"
                className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="smtpSecure"
                checked={form.smtpSecure}
                onChange={(e) => setForm({ ...form, smtpSecure: e.target.checked })}
                className="rounded border-chai-brown/20 text-terracotta focus:ring-terracotta"
              />
              <label htmlFor="smtpSecure" className="font-body text-sm text-chai-brown">Use secure connection (TLS)</label>
            </div>
            <div className="sm:col-span-2">
              <label className="block font-body text-sm font-medium text-chai-brown mb-2">SMTP user (email)</label>
              <input
                type="email"
                value={form.smtpUser}
                onChange={(e) => setForm({ ...form, smtpUser: e.target.value })}
                placeholder="e.g. the.bookish.voyager@gmail.com"
                className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-body text-sm font-medium text-chai-brown mb-2">SMTP password</label>
              <input
                type="password"
                value={form.smtpPass}
                onChange={(e) => setForm({ ...form, smtpPass: e.target.value })}
                placeholder="Leave blank to keep current password"
                autoComplete="new-password"
                className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
              />
              <p className="mt-1 text-xs text-chai-brown-light font-body">
                For Gmail: create an App Password in your Google Account (Security → 2-Step Verification → App passwords). Never use your normal Gmail password here.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-chai-brown/10">
          <h2 className="font-serif text-xl text-chai-brown mb-4">Welcome email — sender & subject</h2>
          <div className="space-y-4">
            <div>
              <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                From (sender email)
              </label>
              <input
                type="text"
                value={form.fromEmail}
                onChange={(e) => setForm({ ...form, fromEmail: e.target.value })}
                placeholder='e.g. Chai & Chapter <hello@yourdomain.com>'
                className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
              />
              <p className="mt-1 text-xs text-chai-brown-light font-body">
                Overrides SMTP_FROM from env. Leave blank to use env default.
              </p>
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                Subject line
              </label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="e.g. Welcome to the reading list!"
                className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-chai-brown/10">
          <h2 className="font-serif text-xl text-chai-brown mb-4">Welcome email — body (design)</h2>
          <div>
            <label className="block font-body text-sm font-medium text-chai-brown mb-2">
              HTML content
            </label>
            <textarea
              value={form.bodyHtml}
              onChange={(e) => setForm({ ...form, bodyHtml: e.target.value })}
              rows={12}
              placeholder={`<p>Hi {{name}},</p>
<p>Welcome to the reading list! You'll get book recommendations and updates straight to your inbox.</p>
{{bookClubs}}
<p>You can unsubscribe anytime from the link in our emails.</p>`}
              className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body font-mono text-sm"
            />
            <p className="mt-1 text-xs text-chai-brown-light font-body">
              Placeholders: <code className="bg-cream px-1 rounded">{"{{name}}"}</code> (subscriber name), <code className="bg-cream px-1 rounded">{"{{bookClubs}}"}</code> (book clubs list), <code className="bg-cream px-1 rounded">{"{{unsubscribeUrl}}"}</code> (one-click unsubscribe link). An unsubscribe link is always added at the bottom. Leave blank to use the default welcome template.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-chai-brown/10">
          <h2 className="font-serif text-xl text-chai-brown mb-4">Signature</h2>
          <div>
            <label className="block font-body text-sm font-medium text-chai-brown mb-2">
              Signature (HTML or plain text)
            </label>
            <textarea
              value={form.signature}
              onChange={(e) => setForm({ ...form, signature: e.target.value })}
              rows={4}
              placeholder='<p style="margin:8px 0 0;font-size:14px;color:#8b7355;">— Anshika Mishra<br />Chai & Chapter</p>'
              className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body font-mono text-sm"
            />
            <p className="mt-1 text-xs text-chai-brown-light font-body">
              Appended at the end of the welcome email. You can use HTML for styling.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-chai-brown/10">
          <h2 className="font-serif text-xl text-chai-brown mb-2">Book club announcement email</h2>
          <p className="text-sm text-chai-brown-light mb-4 font-body">
            Used when you click &quot;Email subscribers&quot; on a book club in Admin → Book clubs. Leave blank to use the default template.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                Subject line
              </label>
              <input
                type="text"
                value={form.bookClubAnnounceSubject}
                onChange={(e) => setForm({ ...form, bookClubAnnounceSubject: e.target.value })}
                placeholder="e.g. New book club: {{clubName}} — Chai & Chapter"
                className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
              />
              <p className="mt-1 text-xs text-chai-brown-light font-body">
                Use <code className="bg-cream px-1 rounded">{"{{clubName}}"}</code> for the book club name.
              </p>
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-chai-brown mb-2">
                HTML body
              </label>
              <textarea
                value={form.bookClubAnnounceBodyHtml}
                onChange={(e) => setForm({ ...form, bookClubAnnounceBodyHtml: e.target.value })}
                rows={14}
                placeholder={`<p>Hi there,</p>
<p>We've just added a new book club you might like:</p>
{{clubImage}}
<h2>{{clubName}}</h2>
<p>{{clubDescription}}</p>
<p><a href="{{joinLink}}">Join this book club</a></p>`}
                className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body font-mono text-sm"
              />
              <p className="mt-1 text-xs text-chai-brown-light font-body">
                Placeholders: <code className="bg-cream px-1 rounded">{"{{clubName}}"}</code>, <code className="bg-cream px-1 rounded">{"{{clubDescription}}"}</code>, <code className="bg-cream px-1 rounded">{"{{clubImage}}"}</code> (full img tag), <code className="bg-cream px-1 rounded">{"{{clubImageUrl}}"}</code> (image URL only), <code className="bg-cream px-1 rounded">{"{{joinLink}}"}</code>, <code className="bg-cream px-1 rounded">{"{{unsubscribeUrl}}"}</code>. An unsubscribe link is always added at the bottom.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-chai-brown/10">
          <h2 className="font-serif text-xl text-chai-brown mb-2">Book review (blog) announcement email</h2>
          <p className="text-sm text-chai-brown-light mb-4 font-body">
            Sent automatically when you add a new blog post in Admin → Blog. Leave blank to use the default template.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block font-body text-sm font-medium text-chai-brown mb-2">Subject line</label>
              <input
                type="text"
                value={form.blogAnnounceSubject}
                onChange={(e) => setForm({ ...form, blogAnnounceSubject: e.target.value })}
                placeholder="e.g. New book review: {{title}} — Chai & Chapter"
                className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
              />
              <p className="mt-1 text-xs text-chai-brown-light font-body">Use <code className="bg-cream px-1 rounded">{"{{title}}"}</code> for the post title.</p>
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-chai-brown mb-2">HTML body</label>
              <textarea
                value={form.blogAnnounceBodyHtml}
                onChange={(e) => setForm({ ...form, blogAnnounceBodyHtml: e.target.value })}
                rows={10}
                placeholder={`<p>Hi there,</p>\n<p>A new book review is live:</p>\n{{image}}\n<h2>{{title}}</h2>\n<p>{{excerpt}}</p>\n<p><a href="{{link}}">Read the review</a></p>`}
                className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body font-mono text-sm"
              />
              <p className="mt-1 text-xs text-chai-brown-light font-body">
                Placeholders: <code className="bg-cream px-1 rounded">{"{{title}}"}</code>, <code className="bg-cream px-1 rounded">{"{{excerpt}}"}</code>, <code className="bg-cream px-1 rounded">{"{{link}}"}</code>, <code className="bg-cream px-1 rounded">{"{{image}}"}</code> (full img tag), <code className="bg-cream px-1 rounded">{"{{imageUrl}}"}</code>, <code className="bg-cream px-1 rounded">{"{{author}}"}</code>, <code className="bg-cream px-1 rounded">{"{{bookTitle}}"}</code>, <code className="bg-cream px-1 rounded">{"{{unsubscribeUrl}}"}</code>.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-chai-brown/10">
          <h2 className="font-serif text-xl text-chai-brown mb-2">Book recommendation announcement email</h2>
          <p className="text-sm text-chai-brown-light mb-4 font-body">
            Sent automatically when you add a new recommendation list in Admin → Recommendations. Leave blank to use the default template.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block font-body text-sm font-medium text-chai-brown mb-2">Subject line</label>
              <input
                type="text"
                value={form.recommendationAnnounceSubject}
                onChange={(e) => setForm({ ...form, recommendationAnnounceSubject: e.target.value })}
                placeholder="e.g. New book recommendation: {{title}} — Chai & Chapter"
                className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
              />
              <p className="mt-1 text-xs text-chai-brown-light font-body">Use <code className="bg-cream px-1 rounded">{"{{title}}"}</code> for the list title.</p>
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-chai-brown mb-2">HTML body</label>
              <textarea
                value={form.recommendationAnnounceBodyHtml}
                onChange={(e) => setForm({ ...form, recommendationAnnounceBodyHtml: e.target.value })}
                rows={10}
                placeholder={`<p>Hi there,</p>\n<p>A new book recommendation list is live:</p>\n{{image}}\n<h2>{{title}}</h2>\n<p>{{excerpt}}</p>\n<p><a href="{{link}}">Read the list</a></p>`}
                className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body font-mono text-sm"
              />
              <p className="mt-1 text-xs text-chai-brown-light font-body">
                Placeholders: <code className="bg-cream px-1 rounded">{"{{title}}"}</code>, <code className="bg-cream px-1 rounded">{"{{excerpt}}"}</code>, <code className="bg-cream px-1 rounded">{"{{link}}"}</code>, <code className="bg-cream px-1 rounded">{"{{image}}"}</code>, <code className="bg-cream px-1 rounded">{"{{imageUrl}}"}</code>, <code className="bg-cream px-1 rounded">{"{{author}}"}</code>, <code className="bg-cream px-1 rounded">{"{{unsubscribeUrl}}"}</code>.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-chai-brown/10">
          <h2 className="font-serif text-xl text-chai-brown mb-2">Her Musings Verse announcement email</h2>
          <p className="text-sm text-chai-brown-light mb-4 font-body">
            Sent automatically when you add a new musing in Admin → Her Musings Verse. Leave blank to use the default template.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block font-body text-sm font-medium text-chai-brown mb-2">Subject line</label>
              <input
                type="text"
                value={form.musingsAnnounceSubject}
                onChange={(e) => setForm({ ...form, musingsAnnounceSubject: e.target.value })}
                placeholder="e.g. New musing: {{title}} — Chai & Chapter"
                className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body"
              />
              <p className="mt-1 text-xs text-chai-brown-light font-body">Use <code className="bg-cream px-1 rounded">{"{{title}}"}</code> for the musing title.</p>
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-chai-brown mb-2">HTML body</label>
              <textarea
                value={form.musingsAnnounceBodyHtml}
                onChange={(e) => setForm({ ...form, musingsAnnounceBodyHtml: e.target.value })}
                rows={10}
                placeholder={`<p>Hi there,</p>\n<p>A new Her Musings Verse piece is live:</p>\n{{image}}\n<h2>{{title}}</h2>\n<p>{{excerpt}}</p>\n<p><a href="{{link}}">Read more</a></p>`}
                className="w-full px-4 py-2 border border-chai-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta font-body font-mono text-sm"
              />
              <p className="mt-1 text-xs text-chai-brown-light font-body">
                Placeholders: <code className="bg-cream px-1 rounded">{"{{title}}"}</code>, <code className="bg-cream px-1 rounded">{"{{excerpt}}"}</code>, <code className="bg-cream px-1 rounded">{"{{link}}"}</code>, <code className="bg-cream px-1 rounded">{"{{image}}"}</code>, <code className="bg-cream px-1 rounded">{"{{imageUrl}}"}</code>, <code className="bg-cream px-1 rounded">{"{{author}}"}</code>, <code className="bg-cream px-1 rounded">{"{{unsubscribeUrl}}"}</code>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
