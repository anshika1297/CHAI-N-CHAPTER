'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Upload, CheckCircle2, AlertTriangle, Download, BookOpen } from 'lucide-react';
import {
  downloadBulkImportTemplate,
  importGoodreads,
  importLibraryTemplate,
  importSiteBooks,
} from '@/lib/library/api';
import type {
  ImportCommitResult,
  ImportFailure,
  ImportPreviewResult,
} from '@/lib/library/types';

const BATCH_SIZE = 25;

type ImportMode = 'template' | 'goodreads' | 'site';

export default function LibraryImportPage() {
  const [mode, setMode] = useState<ImportMode>('template');
  const [csv, setCsv] = useState('');
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [committed, setCommitted] = useState<ImportCommitResult | null>(null);
  const [autoCreateAuthors, setAutoCreateAuthors] = useState(true);
  const [upsertMode, setUpsertMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<{ processed: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const handleFile = (file: File) => {
    setFileName(file.name);
    setCommitted(null);
    setPreview(null);
    const reader = new FileReader();
    reader.onload = () => setCsv(String(reader.result ?? ''));
    reader.onerror = () => setError('Could not read that file');
    reader.readAsText(file);
  };

  const switchMode = (next: ImportMode) => {
    setMode(next);
    setCsv('');
    setFileName('');
    setPreview(null);
    setCommitted(null);
    setError(null);
  };

  const downloadTemplate = () => {
    setDownloading(true);
    setError(null);
    downloadBulkImportTemplate()
      .catch((e) => setError(e instanceof Error ? e.message : 'Download failed'))
      .finally(() => setDownloading(false));
  };

  const runPreview = () => {
    if (mode !== 'site' && !csv.trim()) {
      setError(mode === 'goodreads' ? 'Choose a Goodreads CSV export first' : 'Choose a filled template CSV first');
      return;
    }
    setLoading(true);
    setError(null);
    setCommitted(null);

    const req =
      mode === 'site'
        ? importSiteBooks({ commit: false })
        : mode === 'goodreads'
          ? importGoodreads(csv, { commit: false })
          : importLibraryTemplate(csv, {
              commit: false,
              mode: upsertMode ? 'upsert' : 'insert',
            });

    req
      .then((res) => setPreview(res as ImportPreviewResult))
      .catch((e) => setError(e instanceof Error ? e.message : 'Preview failed'))
      .finally(() => setLoading(false));
  };

  const runCommit = async () => {
    if (!preview) return;
    const total = preview.total;

    setImporting(true);
    setError(null);
    setCommitted(null);
    setProgress({ processed: 0, total });

    let offset = 0;
    let inserted = 0;
    let updated = 0;
    let skippedDuplicates = 0;
    let authorsCreated = 0;
    let taxonomyCreated = 0;
    const failed: ImportFailure[] = [];

    try {
      while (offset < total) {
        // eslint-disable-next-line no-await-in-loop
        const res = (
          mode === 'site'
            ? await importSiteBooks({
                commit: true,
                autoCreateAuthors,
                offset,
                limit: BATCH_SIZE,
              })
            : mode === 'goodreads'
              ? await importGoodreads(csv, {
                  commit: true,
                  autoCreateAuthors,
                  offset,
                  limit: BATCH_SIZE,
                })
              : await importLibraryTemplate(csv, {
                  commit: true,
                  autoCreateAuthors,
                  offset,
                  limit: BATCH_SIZE,
                  mode: upsertMode ? 'upsert' : 'insert',
                })
        ) as ImportCommitResult;

        inserted += res.inserted;
        updated += res.updated ?? 0;
        skippedDuplicates += res.skippedDuplicates;
        authorsCreated += res.authorsCreated;
        taxonomyCreated += res.taxonomyCreated ?? 0;
        failed.push(...(res.failed ?? []));
        offset = res.nextOffset;
        setProgress({ processed: Math.min(offset, total), total });
        if (res.done) break;
      }

      setCommitted({
        committed: true,
        total,
        offset: 0,
        processed: total,
        nextOffset: total,
        done: true,
        inserted,
        updated,
        skippedDuplicates,
        authorsCreated,
        taxonomyCreated,
        mode: mode === 'template' && upsertMode ? 'upsert' : 'insert',
        failed,
      });
      setPreview(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed');
      setCommitted({
        committed: true,
        total,
        offset: 0,
        processed: offset,
        nextOffset: offset,
        done: false,
        inserted,
        updated,
        skippedDuplicates,
        authorsCreated,
        taxonomyCreated,
        failed,
      });
    } finally {
      setImporting(false);
      setProgress(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-serif text-3xl sm:text-4xl text-chai-brown mb-2">Import Books</h1>
        <p className="font-body text-chai-brown-light">
          Pull books from your public site directory, use our Excel template, or import a Goodreads
          export. Title, author, and genres sync into Library OS (and Master Data).
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-body text-sm">
          {error}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ['site', 'From site books'],
            ['template', 'Excel / CSV template'],
            ['goodreads', 'Goodreads export'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => switchMode(id)}
            className={`px-3 py-1.5 rounded-full font-body text-sm border ${
              mode === id
                ? 'bg-terracotta text-white border-terracotta'
                : 'bg-white text-chai-brown border-chai-brown/20'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'site' && (
        <div className="bg-cream/50 rounded-lg border border-chai-brown/10 p-4 mb-6">
          <p className="font-body text-sm text-chai-brown mb-3">
            Import books already shown on the public{' '}
            <Link href="/books" className="text-terracotta hover:underline" target="_blank">
              /books
            </Link>{' '}
            directory (from reviews, recommendations, and author spotlights). Adds{' '}
            <strong>title</strong>, <strong>author</strong>, and <strong>genre</strong> when
            available. Existing library books are skipped — nothing is overwritten.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={runPreview}
              disabled={loading || importing}
              className="inline-flex items-center gap-2 bg-chai-brown text-white px-4 py-2 rounded-lg hover:bg-chai-brown/90 font-body text-sm disabled:opacity-50"
            >
              <BookOpen size={18} />
              {loading ? 'Scanning…' : 'Preview site books'}
            </button>
            <label className="inline-flex items-center gap-2 font-body text-sm text-chai-brown">
              <input
                type="checkbox"
                checked={autoCreateAuthors}
                onChange={(e) => setAutoCreateAuthors(e.target.checked)}
              />
              Auto-create author records
            </label>
          </div>
        </div>
      )}

      {mode === 'template' && (
        <div className="bg-cream/50 rounded-lg border border-chai-brown/10 p-4 mb-6">
          <p className="font-body text-sm text-chai-brown mb-3">
            Download the template, open it in Excel (or Google Sheets), fill rows, save as CSV,
            then upload here. All 47 columns are mandatory in the header — keep every column even
            if a cell is blank or <code className="text-xs">—</code>. Title and Author are required
            per row. Use <code className="text-xs">;</code> or commas for list fields (Themes, Tropes,
            Tags, Collections).             For enrichment of books already in Library OS, keep{' '}
            <strong>Update existing books</strong> on — that writes every Excel
            column from the sheet onto the matched book (themes, tropes, tags,
            Instagram fields, women focus, signals, etc.).
          </p>
          <button
            type="button"
            onClick={downloadTemplate}
            disabled={downloading}
            className="inline-flex items-center gap-2 border border-chai-brown/20 text-chai-brown px-4 py-2 rounded-lg hover:bg-white font-body text-sm disabled:opacity-50"
          >
            <Download size={18} />
            {downloading ? 'Preparing…' : 'Download Excel template (CSV)'}
          </button>
        </div>
      )}

      {mode !== 'site' && (
        <div className="bg-white rounded-lg border border-chai-brown/10 p-5 mb-6">
          <label className="block">
            <span className="block font-body text-sm font-medium text-chai-brown mb-2">
              {mode === 'goodreads' ? 'Goodreads CSV file' : 'Filled template CSV'}
            </span>
            <input
              type="file"
              accept=".csv,text/csv,.xlsx,.xls"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  if (/\.xlsx?$/i.test(f.name)) {
                    setError('Please save the Excel file as CSV (File → Save As → CSV) then upload.');
                    return;
                  }
                  handleFile(f);
                }
              }}
              className="block w-full text-sm text-chai-brown file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-terracotta file:text-white file:font-body hover:file:bg-terracotta/90"
            />
          </label>
          {fileName && <p className="mt-2 font-body text-xs text-chai-brown-light">Loaded: {fileName}</p>}
          {mode === 'goodreads' && (
            <p className="mt-2 font-body text-xs text-chai-brown-light">
              Export from{' '}
              <a
                href="https://www.goodreads.com/review/import"
                target="_blank"
                rel="noreferrer"
                className="text-terracotta hover:underline"
              >
                Goodreads → Import/Export
              </a>
              .
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={runPreview}
              disabled={loading || importing || !csv.trim()}
              className="inline-flex items-center gap-2 bg-chai-brown text-white px-4 py-2 rounded-lg hover:bg-chai-brown/90 font-body text-sm disabled:opacity-50"
            >
              <Upload size={18} />
              {loading ? 'Reading…' : 'Preview import'}
            </button>
            <label className="inline-flex items-center gap-2 font-body text-sm text-chai-brown">
              <input
                type="checkbox"
                checked={autoCreateAuthors}
                onChange={(e) => setAutoCreateAuthors(e.target.checked)}
              />
              Auto-create author records
            </label>
            {mode === 'template' && (
              <label className="inline-flex items-center gap-2 font-body text-sm text-chai-brown">
                <input
                  type="checkbox"
                  checked={upsertMode}
                  onChange={(e) => setUpsertMode(e.target.checked)}
                />
                Update existing books (upsert enrichment)
              </label>
            )}
          </div>
        </div>
      )}

      {importing && progress && (
        <div className="bg-white rounded-lg border border-chai-brown/10 p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="font-body text-sm font-medium text-chai-brown">Importing books…</p>
            <p className="font-body text-sm text-chai-brown-light">
              {progress.processed} / {progress.total}
            </p>
          </div>
          <div className="h-3 w-full rounded-full bg-cream overflow-hidden border border-chai-brown/10">
            <div
              className="h-full bg-terracotta transition-all duration-300"
              style={{
                width: `${progress.total ? Math.round((progress.processed / progress.total) * 100) : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {committed && (
        <div className="bg-white rounded-lg border border-chai-brown/10 p-6 mb-6">
          <div className="text-center">
            {committed.done ? (
              <CheckCircle2 size={40} className="text-green-600 mx-auto mb-3" />
            ) : (
              <AlertTriangle size={40} className="text-amber-500 mx-auto mb-3" />
            )}
            <h2 className="font-serif text-2xl text-chai-brown mb-2">
              {committed.done ? 'Import complete' : 'Import stopped early'}
            </h2>
            <p className="font-body text-chai-brown-light">
              Processed <strong>{committed.processed}</strong> of {committed.total} rows.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5">
            <Stat label="Added" value={committed.inserted} tone="green" />
            <Stat label="Updated" value={committed.updated ?? 0} tone="green" />
            <Stat label="Skipped (dupes)" value={committed.skippedDuplicates} tone="muted" />
            <Stat label="Authors created" value={committed.authorsCreated} tone="muted" />
            <Stat label="Failed" value={committed.failed.length} tone={committed.failed.length ? 'red' : 'muted'} />
          </div>

          {committed.failed.length > 0 && (
            <details className="mt-5 rounded-lg border border-red-200 bg-red-50/60 p-4" open>
              <summary className="font-body text-sm font-medium text-red-700 cursor-pointer">
                {committed.failed.length} book{committed.failed.length === 1 ? '' : 's'} could not be imported
              </summary>
              <ul className="mt-3 space-y-1.5 max-h-64 overflow-y-auto">
                {committed.failed.map((f, i) => (
                  <li key={`${f.title}-${i}`} className="font-body text-xs text-red-800">
                    <span className="font-medium">{f.title}</span>
                    <span className="text-red-600"> — {f.reason}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}

          <div className="text-center flex flex-wrap justify-center gap-3 mt-5">
            <Link
              href="/admin/library/books"
              className="inline-block bg-terracotta text-white px-5 py-2.5 rounded-lg hover:bg-terracotta/90 font-body"
            >
              View my books
            </Link>
            <Link
              href="/admin/library/taxonomy"
              className="inline-block border border-chai-brown/20 text-chai-brown px-5 py-2.5 rounded-lg hover:bg-cream font-body"
            >
              View Master Data
            </Link>
          </div>
        </div>
      )}

      {preview && (
        <div className="bg-white rounded-lg border border-chai-brown/10 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            {(() => {
              const newCount = preview.total - preview.duplicates;
              const updateCount = preview.duplicates;
              const willUpsert = mode === 'template' && upsertMode;
              const canCommit = preview.total > 0 && (willUpsert || newCount > 0);
              const buttonLabel = importing
                ? 'Importing…'
                : willUpsert
                  ? newCount > 0
                    ? `Update ${updateCount} + add ${newCount}`
                    : `Update ${updateCount} existing books`
                  : `Import ${newCount} new books`;
              return (
                <>
                  <p className="font-body text-chai-brown">
                    Found <strong>{preview.total}</strong> books ·{' '}
                    {willUpsert ? (
                      <>
                        <strong>{updateCount}</strong> will be updated ·{' '}
                        <strong>{newCount}</strong> new
                      </>
                    ) : (
                      <>
                        <span className="text-chai-brown-light">{updateCount} already in library</span> ·{' '}
                        <strong>{newCount}</strong> new
                      </>
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={runCommit}
                    disabled={loading || importing || !canCommit}
                    className="inline-flex items-center gap-2 bg-terracotta text-white px-4 py-2 rounded-lg hover:bg-terracotta/90 font-body text-sm disabled:opacity-50"
                  >
                    {buttonLabel}
                  </button>
                </>
              );
            })()}
          </div>
          {mode === 'template' && upsertMode && preview.duplicates > 0 ? (
            <p className="font-body text-xs text-chai-brown-light mb-3 -mt-1">
              Upsert is on: existing matches get non-empty CSV fields overwritten (genres, themes, tags,
              collections, pitches…). Empty cells leave current values.
            </p>
          ) : null}

          <div className="overflow-x-auto max-h-[480px] overflow-y-auto border border-chai-brown/10 rounded-lg">
            <table className="w-full">
              <thead className="bg-cream/50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-body text-xs font-medium text-chai-brown">Title</th>
                  <th className="px-3 py-2 text-left font-body text-xs font-medium text-chai-brown">Author</th>
                  <th className="px-3 py-2 text-left font-body text-xs font-medium text-chai-brown">
                    {mode === 'site' ? 'Genres' : 'Status'}
                  </th>
                  <th className="px-3 py-2 text-left font-body text-xs font-medium text-chai-brown">
                    {mode === 'template' && upsertMode ? 'Action' : 'New?'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-chai-brown/10">
                {preview.books.map((b, i) => (
                  <tr
                    key={`${b.title}-${i}`}
                    className={
                      b.isDuplicate && !(mode === 'template' && upsertMode) ? 'opacity-50' : ''
                    }
                  >
                    <td className="px-3 py-2 font-body text-sm text-chai-brown">{b.title}</td>
                    <td className="px-3 py-2 font-body text-sm text-chai-brown-light">{b.author || '—'}</td>
                    <td className="px-3 py-2 font-body text-xs text-chai-brown-light">
                      {mode === 'site'
                        ? b.genres?.length
                          ? b.genres.join(', ')
                          : '—'
                        : b.status}
                    </td>
                    <td className="px-3 py-2 font-body text-xs">
                      {b.isDuplicate ? (
                        mode === 'template' && upsertMode ? (
                          <span className="text-terracotta font-medium">Update</span>
                        ) : (
                          <span className="text-chai-brown/50">Duplicate</span>
                        )
                      ) : (
                        <span className="text-green-600">New</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'green' | 'red' | 'muted';
}) {
  const toneClass =
    tone === 'green' ? 'text-green-600' : tone === 'red' ? 'text-red-600' : 'text-chai-brown';
  return (
    <div className="rounded-lg border border-chai-brown/10 bg-cream/40 p-3 text-center">
      <div className={`font-serif text-2xl ${toneClass}`}>{value}</div>
      <div className="font-body text-xs text-chai-brown-light mt-0.5">{label}</div>
    </div>
  );
}
