import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

/** Loopback SSR (Next.js API_INTERNAL_URL) must not share the public IP bucket. */
function isLoopbackRequest(req: Request): boolean {
  const ip = req.ip || req.socket.remoteAddress || '';
  return (
    ip === '127.0.0.1'
    || ip === '::1'
    || ip === '::ffff:127.0.0.1'
    || ip.endsWith('127.0.0.1')
  );
}

/**
 * General API rate limiter — applies to mutating requests only.
 * Public GET/HEAD reads are exempt so normal browsing (home + listings + filters) does not 429.
 * Loopback SSR (Next.js) is also exempt.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 200 : 1000,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (req.path === '/health' || isLoopbackRequest(req)) return true;
    if (req.method === 'GET' || req.method === 'HEAD') return true;
    return false;
  },
});

/**
 * Strict rate limiter for authentication endpoints
 * Limits: 5 requests per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: 'Too many login attempts from this IP, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * Rate limiter for subscription endpoints
 * Limits: 3 requests per hour per IP
 */
export const subscriptionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 subscription requests per hour
  message: 'Too many subscription requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for contact/message endpoints
 * Limits: 5 requests per hour per IP
 */
export const messageLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 messages per hour
  message: 'Too many messages from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/** Comment submissions — 8 per hour per IP */
export const commentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 8,
  message: 'Too many comments from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/** Reader reactions — 40 per hour per IP */
export const reactionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 40,
  message: 'Too many reactions from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
