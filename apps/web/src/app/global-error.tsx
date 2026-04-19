'use client';

import './globals.css';

/**
 * Catches errors in the root `layout.tsx` (including loading `layout` itself).
 * Must include `<html>` and `<body>` — it replaces the root layout when active.
 * https://nextjs.org/docs/app/api-reference/file-conventions/error#global-error
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en-IN">
      <body className="min-h-screen flex flex-col bg-cream">
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <h1 className="text-3xl font-serif text-chai-brown mb-3">Something went wrong</h1>
            <p className="text-chai-brown-light mb-6 font-body">
              The site hit an unexpected error. Try reloading or return shortly.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-red-800 font-mono text-xs break-all">{error.message}</p>
              </div>
            )}
            <button type="button" onClick={() => reset()} className="btn-primary">
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
