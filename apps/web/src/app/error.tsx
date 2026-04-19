'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * App Router error boundary — required by Next.js for route-level errors & fast refresh.
 * https://nextjs.org/docs/app/api-reference/file-conventions/error
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-3xl font-serif text-chai-brown mb-3">Something went wrong</h1>
        <p className="text-chai-brown-light mb-6 font-body">
          An error occurred while loading this page. You can try again or go back home.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-red-800 font-mono text-xs break-all">{error.message}</p>
          </div>
        )}
        <div className="flex flex-wrap gap-3 justify-center">
          <button type="button" onClick={() => reset()} className="btn-primary">
            Try again
          </button>
          <Link href="/" className="btn-secondary inline-flex items-center justify-center">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
