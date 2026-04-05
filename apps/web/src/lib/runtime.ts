export function getApiBaseUrlForClient(): string {
  if (typeof window !== 'undefined') return '';
  return process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000';
}

