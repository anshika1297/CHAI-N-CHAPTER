'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: Gtag;
  }
}

/** Sends GA4 page_view on App Router client navigations (and initial load). */
export default function GoogleAnalyticsPageViews({ measurementId }: { measurementId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || typeof window.gtag !== 'function') return;
    const query = searchParams.toString();
    const pagePath = query ? `${pathname}?${query}` : pathname;
    window.gtag('config', measurementId, { page_path: pagePath });
  }, [pathname, searchParams, measurementId]);

  return null;
}
