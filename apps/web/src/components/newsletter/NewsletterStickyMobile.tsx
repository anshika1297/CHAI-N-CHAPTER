'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import NewsletterSignup from './NewsletterSignup';
import { NEWSLETTER_COPY } from '@/lib/newsletter/variants';
import { useIsSubscriber } from '@/lib/newsletter/useIsSubscriber';

const DISMISS_KEY = 'cnc_newsletter_sticky_dismissed';

const HIDDEN_PREFIXES = ['/admin', '/subscribe'];

export default function NewsletterStickyMobile() {
  const pathname = usePathname() ?? '';
  const isSubscriber = useIsSubscriber();
  const [dismissed, setDismissed] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === '1');
    } catch {
      setDismissed(false);
    }
  }, []);

  const hidden =
    !mounted ||
    isSubscriber ||
    dismissed ||
    HIDDEN_PREFIXES.some((p) => pathname.startsWith(p));

  if (hidden) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-cream border-t border-chai-brown/15 shadow-[0_-4px_20px_rgba(107,79,63,0.12)] px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      role="complementary"
      aria-label="Newsletter signup"
    >
      <button
        type="button"
        onClick={dismiss}
        className="absolute top-2 right-2 p-1.5 text-chai-brown-light hover:text-chai-brown rounded-full"
        aria-label="Dismiss newsletter prompt"
      >
        <X size={16} />
      </button>
      <NewsletterSignup
        copy={NEWSLETTER_COPY.homepage}
        placement="sticky-mobile"
        layout="sticky"
      />
    </div>
  );
}
