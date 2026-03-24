'use client';

import { useEffect } from 'react';
import { getApiBaseUrlForClient } from '@/lib/runtime';

const TRACKED_KEY = 'visitor_tracked';

/** Tracks a single visit per session (Total + Monthly visitors). */
export default function AnalyticsTracker() {
  useEffect(() => {
    try {
      if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') return;
      if (sessionStorage.getItem(TRACKED_KEY)) return;
      sessionStorage.setItem(TRACKED_KEY, '1');
      const base = getApiBaseUrlForClient();
      fetch(`${base}/api/analytics/track`, { method: 'GET', keepalive: true }).catch(() => {});
    } catch {
      // ignore
    }
  }, []);
  return null;
}
