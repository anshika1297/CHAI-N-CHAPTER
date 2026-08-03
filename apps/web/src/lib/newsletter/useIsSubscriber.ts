'use client';

import { useEffect, useState } from 'react';
import { getSubscriberSession } from '@/lib/subscriberSession';

/** True when this browser has an active subscriber session (hide redundant CTAs). */
export function useIsSubscriber(): boolean {
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    setSubscribed(Boolean(getSubscriberSession()));
  }, []);

  return subscribed;
}
