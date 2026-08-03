import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export type SubscriberTokenPayload = {
  type: 'subscriber';
  email: string;
  name?: string;
};

const EXPIRY = '365d';

export function subscriberDisplayName(input: { name?: string; email: string }): string {
  const saved = input.name?.trim();
  if (saved && saved.length >= 2) return saved.slice(0, 80);
  const local = (input.email.split('@')[0] ?? 'Reader').replace(/[._-]+/g, ' ').trim();
  if (!local) return 'Reader';
  return local
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
    .slice(0, 80);
}

export function signSubscriberToken(email: string, name?: string): string {
  const payload: SubscriberTokenPayload = {
    type: 'subscriber',
    email: email.trim().toLowerCase(),
    name: name?.trim() || undefined,
  };
  return jwt.sign(payload, config.jwtSecret, { expiresIn: EXPIRY });
}

export function verifySubscriberToken(token: string): SubscriberTokenPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as SubscriberTokenPayload;
    if (decoded?.type !== 'subscriber' || typeof decoded.email !== 'string') return null;
    return {
      type: 'subscriber',
      email: decoded.email.trim().toLowerCase(),
      name: typeof decoded.name === 'string' ? decoded.name.trim() : undefined,
    };
  } catch {
    return null;
  }
}
