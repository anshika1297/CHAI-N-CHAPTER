import crypto from 'crypto';

const URL_RE = /https?:\/\/|www\./gi;
const BLOCKED = [/viagra/i, /casino/i, /crypto\s*invest/i, /click\s*here\s*now/i];

export function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip || 'unknown').digest('hex').slice(0, 32);
}

export type SpamVerdict = { spam: boolean; reason?: string };

export function assessCommentSpam(body: string, honeypot?: string): SpamVerdict {
  if (typeof honeypot === 'string' && honeypot.trim()) {
    return { spam: true, reason: 'honeypot' };
  }
  const text = body.trim();
  if (text.length < 3) return { spam: true, reason: 'too_short' };
  if (text.length > 4000) return { spam: true, reason: 'too_long' };
  const links = (text.match(URL_RE) ?? []).length;
  if (links > 3) return { spam: true, reason: 'too_many_links' };
  if (BLOCKED.some((re) => re.test(text))) return { spam: true, reason: 'blocked_phrase' };
  const letters = text.replace(/[^a-zA-Z]/g, '');
  if (letters.length > 20 && letters === letters.toUpperCase()) {
    return { spam: true, reason: 'all_caps' };
  }
  return { spam: false };
}
