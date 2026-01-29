'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Shows a thin progress bar at the top of the screen as soon as the user clicks
 * an in-app link, before the RSC request completes. This removes the 1–2s
 * "nothing happening" feeling during client-side navigation.
 */
export default function NavigationLoader() {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);

  // Hide the bar when the route has changed (new page is rendering).
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  // Show the bar immediately when user clicks an in-app link (capture phase = runs first).
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      const link = target instanceof Element ? target.closest('a') : null;
      if (!link?.href) return;
      try {
        const url = new URL(link.href);
        const isSameOrigin = url.origin === window.location.origin;
        const isInApp = url.pathname.startsWith('/') && isSameOrigin;
        const isNewTab = link.target === '_blank' || link.rel?.includes('external');
        if (isInApp && !isNewTab) {
          setIsNavigating(true);
        }
      } catch {
        // ignore invalid URLs
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  if (!isNavigating) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] h-1 bg-terracotta/20 overflow-hidden"
      aria-hidden
    >
      <div className="navigation-loader-bar h-full w-1/3 bg-terracotta" />
    </div>
  );
}
