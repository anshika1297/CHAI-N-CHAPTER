import { getFetchBaseUrl } from '@/lib/apiBase';

/** Same rules as API fetches: public origin when NEXT_PUBLIC_API_URL is set, else same-origin (empty) in the browser. */
export function getApiBaseUrlForClient(): string {
  return getFetchBaseUrl();
}

